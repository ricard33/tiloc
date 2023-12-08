import logging
from importlib import import_module

from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate

from notifier import settings as notifier_settings


def create_backends(**kwargs):
    """
    Creates/Updates Backend objects based on NOTIFIER_BACKENDS settings.

    All values except `enabled` are derived from the Backend class and
    not suppossed to be modified by user. They will be over-written on restart.
    """
    from notifier.models import Backend

    # print("create_backends: sender=%s" % kwargs["sender"])
    for klass in notifier_settings.BACKEND_CLASSES:
        try:
            backend = Backend.objects.get(name=klass.name)
        except Backend.DoesNotExist:
            logging.info("Create backend %s", klass.name)
            backend = Backend()
            backend.enabled = True
        finally:
            backend.display_name = klass.display_name
            backend.name = klass.name
            backend.description = klass.description
            backend.klass = ".".join([klass.__module__, klass.__name__])
            backend.save()


def create_notifications(**kwargs):
    """
    Creates all the notifications specified in notifiers.py for all apps
    in INSTALLED_APPS
    """

    for installed_app in settings.INSTALLED_APPS:
        try:
            import_module(installed_app + ".notifications")
        except ImportError as ex:
            pass


class NotifierAppConfig(AppConfig):
    name = "notifier"
    verbose_name = "Django notifier"

    def ready(self):
        post_migrate.connect(
            create_backends,
            dispatch_uid="notifier.create_backends",
            sender=self,
        )
        post_migrate.connect(
            create_notifications,
            dispatch_uid="notifier.create_notifications",
            sender=self,
        )
