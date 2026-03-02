from collections.abc import Iterable
from importlib import import_module

from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import PermissionDenied
from django.db import models
from django.db.models import Q
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

from notifier import managers


###############################################################################
## Models
###############################################################################
class BaseModel(models.Model):
    """Abstract base class with auto-populated created and updated fields."""

    created = models.DateTimeField(auto_now_add=True, db_index=True)
    updated = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True


class Backend(BaseModel):
    """
    Entries for various delivery backends (SMS, Email)
    """

    name = models.CharField(max_length=200, unique=True, db_index=True)
    display_name = models.CharField(max_length=200, null=True)
    description = models.CharField(max_length=500, null=True)

    # This can be set to False to stop all deliveries using this
    # method, regardless of permissions and preferences
    enabled = models.BooleanField(default=True)

    # The klass value defines the class to be used to send the notification.
    klass = models.CharField(
        max_length=500, help_text="Example: notifier.backends.EmailBackend"
    )

    def __str__(self):
        return self.name

    def _get_backendclass(self):
        """
        Return the python class from the string value in `self.klass`
        """
        module, klass = self.klass.rsplit(".", 1)
        return getattr(import_module(module), klass)

    backendclass = property(_get_backendclass)

    def send(self, user, notification, message, path, context=None):
        """
        Send the notification to the specified user using this backend.

        returns Boolean according to success of delivery.
        """

        backendobject = self.backendclass(notification)
        sent_success = backendobject.send(user, context)

        SentNotification.objects.create(
            user=user,
            notification=notification,
            backend=self,
            success=sent_success,
            description=message,
            path=path,
        )

        return sent_success


class Notification(BaseModel):
    """
    Entries for various notifications
    """

    name = models.CharField(primary_key=True, max_length=200, unique=True, db_index=True)
    display_name = models.CharField(max_length=200)

    # This field determines whether the notification is to be shown
    #   to users or it is private and only set by code.
    # This only affects UI, the notification is otherwise enabled
    #   and usable in all ways.
    public = models.BooleanField(default=True)

    default_notify = models.BooleanField(
        default=True, help_text=_("Default notification state")
    )

    # user should have all the permissions selected here to be able to change
    # the user prefs for this notification or see it in the UI
    permissions = models.ManyToManyField(Permission, blank=True)

    # These are the backend methods that are allowed for this type of
    # notification
    backends = models.ManyToManyField(Backend, blank=True, help_text=_("Default notification methods (unless overridden by prefs)"))

    objects = managers.NotificationManager()

    def __str__(self):
        return self.name

    def check_perms(self, user):
        # Need an iterable with permission strings to check using has_perms.
        # This makes it possible to take advantage of the cache.
        perm_list = set(
            [
                "%s.%s" % (p.content_type.app_label, p.codename)
                for p in self.permissions.select_related()
            ]
        )

        if not user.has_perms(perm_list):
            return False
        return True

    def get_backends(self, user):
        """
        Returns backends after checking `User` and `Group` preferences
        as well as `backend.enabled` flag.
        """
        user_settings = self.userprefs_set.filter(user=user)
        group_filter = Q()
        for group in user.groups.all():
            group_filter = Q(group_filter | Q(group=group))

        group_settings = self.groupprefs_set.filter(group_filter)

        backends = Backend.objects.filter(enabled=True)
        activated_backends = self.backends.filter(enabled=True)

        remove_backends = []
        for backend in backends:
            notify = self.default_notify and backend in activated_backends
            try:
                userprefs = user_settings.get(backend=backend)
                notify = userprefs.notify
            except UserPrefs.DoesNotExist:
                try:
                    groupprefs = group_settings.get(backend=backend)
                    notify = groupprefs.notify
                except GroupPrefs.DoesNotExist:
                    pass
            if not notify:
                remove_backends.append(backend.id)

        return backends.exclude(id__in=remove_backends)

    def get_user_prefs(self, user):
        """
        Return a dictionary of all available backend methods with True
        or False values depending on preferences.
        """
        all_backends = self.backends.filter(enabled=True)
        selected_backends = self.get_backends(user)

        backend_dict = dict(zip(all_backends, [False] * len(all_backends)))
        for backend in all_backends:
            if backend in selected_backends:
                backend_dict[backend] = True

        return backend_dict

    def update_user_prefs(self, user, prefs_dict):
        """
        Update or create a `UserPrefs` instance as required
        """
        result = {}
        for backend, value in prefs_dict.items():
            if not isinstance(backend, Backend):
                backend = Backend.objects.get(name=backend)

            try:
                userpref = self.userprefs_set.get(user=user, backend=backend)
            except UserPrefs.DoesNotExist:
                UserPrefs.objects.create(
                    user=user, notification=self, backend=backend, notify=value
                )
                result[backend.name] = "created"
            else:
                if userpref.notify != value:
                    userpref.notify = value
                    userpref.save()
                    result[backend.name] = "updated"
        return result

    def update_group_prefs(self, group, prefs_dict):
        """
        Update or create a `GroupPrefs` instance as required
        """
        result = {}
        for backend, value in prefs_dict.items():
            if not isinstance(backend, Backend):
                backend = Backend.objects.get(name=backend)

            try:
                grouppref = self.groupprefs_set.get(group=group, backend=backend)
            except GroupPrefs.DoesNotExist:
                GroupPrefs.objects.create(
                    group=group, notification=self, backend=backend, notify=value
                )
                result[backend.name] = "created"
            else:
                if grouppref.notify != value:
                    grouppref.notify = value
                    grouppref.save()
                    result[backend.name] = "updated"
        return result

    def send(self, users, message, path, context=None):
        if not isinstance(users, Iterable):
            users = [users]

        if not message:
            message = self.display_name

        for user in users:
            for backend in self.get_backends(user):
                backend.send(user, self, message, path, context)


class GroupPrefs(BaseModel):
    """
    Per group notification settings

    If notification is not explicitly set to True, then default to False.
    """

    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    backend = models.ForeignKey(Backend, on_delete=models.CASCADE)
    notify = models.BooleanField(default=True)

    class Meta:
        unique_together = ("group", "notification", "backend")

    def __str__(self):
        return "%s:%s:%s" % (self.group, self.notification, self.backend)


class UserPrefs(BaseModel):
    """
    Per user notification settings

    Supercedes group setting.
    If notification preference is not explicitly set, then use group setting.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    backend = models.ForeignKey(Backend, on_delete=models.CASCADE)
    notify = models.BooleanField(default=True)

    objects = managers.UserPrefsManager()

    class Meta:
        unique_together = ("user", "notification", "backend")

    def __str__(self):
        return "%s:%s:%s" % (self.user, self.notification, self.backend)

    def save(self, *args, **kwargs):
        if not self.notification.check_perms(self.user):
            raise PermissionDenied
        super(UserPrefs, self).save(*args, **kwargs)


class SentNotification(BaseModel):
    """
    Record of every notification sent.
    """

    id = models.BigAutoField(primary_key=True, verbose_name="ID")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    description = models.TextField(
        null=True, blank=True, help_text=_("Description displayed")
    )
    path = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_("Page to redirect (path part of the url)"),
    )
    backend = models.ForeignKey(Backend, on_delete=models.CASCADE)
    success = models.BooleanField()
    read = models.BooleanField(default=False)

    def __str__(self):
        return "%s:%s:%s" % (self.user, self.notification, self.backend)


###############################################################################
## Signal Recievers
###############################################################################
@receiver(pre_delete, sender=Backend, dispatch_uid="notifier.models.backend_pre_delete")
def backend_pre_delete(sender, instance, **kwargs):
    raise PermissionDenied(
        "Cannot delete backend %s. Remove from settings." % instance.name
    )
