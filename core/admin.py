from functools import reduce

from constance.admin import Config, ConstanceAdmin
from django.conf import settings
from django.contrib import admin, messages
from django.contrib.admin import FieldListFilter, RelatedOnlyFieldListFilter, TabularInline
from django.contrib.admin.options import IS_POPUP_VAR
from django.contrib.admin.utils import unquote
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.admin import GroupAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.contrib.auth.models import Group
from django.core.exceptions import PermissionDenied
from django.db import router, transaction
from django.db.models import Q, Sum
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.decorators import method_decorator
from django.utils.html import escape
from django.utils.translation import gettext
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django_cron.admin import CronJobLogAdmin
from django_cron.models import CronJobLock, CronJobLog
from import_export.admin import ImportExportMixin, ImportExportModelAdmin
from knox.admin import AuthTokenAdmin
from knox.models import AuthToken
from simple_history.admin import SimpleHistoryAdmin

from core import models
from core.imp_exp_resources import BookingResource
from core.sync import retrieve_and_synchronize_bookings

csrf_protect_m = method_decorator(csrf_protect)
sensitive_post_parameters_m = method_decorator(sensitive_post_parameters())


# noinspection PyUnresolvedReferences
class RestrictedModelAdminMixIn(object):
    def has_add_permission(self, request):
        return super().has_add_permission(request) or request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return super().has_change_permission(request, obj) or request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return super().has_delete_permission(request, obj) or request.user.is_superuser

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or not hasattr(qs, "for_user"):
            return self.filter_by_account(qs, request)
        return qs.for_user(request.user)

    def filter_by_account(self, qs, request):
        if request.session.get("account_goggles") and hasattr(qs.model, "_account_qs_path"):
            account = request.session["account_goggles"]
            # field account_field should be set by child classes to the queryset path to reach the account
            account_field = getattr(qs.model, "_account_qs_path", "account")
            if isinstance(account_field, list):
                import operator

                return qs.filter(reduce(operator.or_, map(lambda x: Q(**{x + "__id": account["id"]}), account_field)))

            return qs.filter(**{account_field + "__id": account["id"]})
        return qs

    def get_field_queryset(self, db, db_field, request):
        """
        If the ModelAdmin specifies ordering, the queryset should respect that
        ordering.  Otherwise, don't specify the queryset, let the field decide
        (returns None in that case).
        """
        qs = super().get_field_queryset(db, db_field, request)
        if qs is None:
            qs = db_field.remote_field.model._default_manager.using(db)
        qs = self.filter_by_account(qs, request)
        if request.user.is_superuser:
            return qs
        if hasattr(qs, "for_user"):
            qs = qs.for_user(request.user).distinct()
        elif db_field.remote_field.model is models.Account:
            qs = qs.filter(pk=request.user.account.pk)
        return qs

    # def formfield_for_foreignkey(self, db_field, request, **kwargs):
    #     if not request.user.is_superuser:
    #         if 'queryset' in kwargs:
    #             queryset = kwargs['queryset']
    #         else:
    #             db = kwargs.get('using')
    #             queryset = self.get_field_queryset(db, db_field, request)
    #         kwargs["queryset"] = queryset.for_user(request.user)
    #     return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_list_display(self, request):
        """
        Return a sequence containing the fields to be displayed on the
        changelist.
        """
        if request.user.is_superuser and not request.session.get("account_goggles"):
            return self.list_display
        return [field for field in self.list_display if field != "account"]

    def get_list_filter(self, request):
        """
        Returns a sequence containing the fields to be displayed as filters in
        the right sidebar of the changelist page.
        """
        if request.user.is_superuser and not hasattr(request.session, "account_goggles"):
            return self.list_filter
        return [field for field in self.list_filter if field != "account" and not field.endswith("__account")]

    def get_changeform_initial_data(self, request):
        """
        Get the initial form data from the request's GET params.
        """
        initial = super().get_changeform_initial_data(request)
        selected_account = request.session.get("account_goggles")
        if "account" not in initial and selected_account:
            initial["account"] = selected_account["id"]
        return initial


# noinspection PyUnresolvedReferences
class RestrictedInlineModelAdminMixIn(object):
    def has_add_permission(self, request, obj=None):
        return super().has_add_permission(request, obj) or request.user.is_superuser


class TilocAdminSite(admin.AdminSite):
    # Text to put at the end of each page's <title>.
    site_title = _("Tiloc site admin")

    # Text to put in each page's <h1>.
    site_header = _("Tiloc administration")

    # Text to put at the top of the admin index page.
    index_title = _("Site administration")

    # login_form = forms.TilocAuthenticationForm

    def get_urls(self):
        urlpatterns = [
            path("set_active_account/", self.set_active_account, name="set_active_account"),
        ]
        urlpatterns += super().get_urls()
        return urlpatterns

    def set_active_account(self, request):
        account_id = request.POST["select_account"]
        if account_id:
            account = get_object_or_404(models.Account, id=account_id)
            request.session["account_goggles"] = {"id": account.id, "name": account.name}
        else:
            del request.session["account_goggles"]
        return redirect(request.POST["current_location"])


site = TilocAdminSite("tiloc-admin")

FieldListFilter.register(lambda f: f.remote_field, RelatedOnlyFieldListFilter, take_priority=True)


@admin.register(models.Account, site=site)
class AccountAdmin(RestrictedModelAdminMixIn, admin.ModelAdmin):
    pass


@admin.register(models.User, site=site)
class UserAdmin(RestrictedModelAdminMixIn, admin.ModelAdmin):
    add_form_template = "admin/auth/user/add_form.html"
    change_user_password_template = None
    fieldsets = (
        (None, {"fields": ("account", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email", "phone", "address", "verified")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "lodgings",
                    "user_permissions",
                ),
            },
        ),
        (
            _("Contracts and billing details"),
            {"fields": ("legal", "payment", "billing", "no_vat", "vat_rate", "logo", "signature")},
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("account", "email", "password1", "password2"),
            },
        ),
    )
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    list_display = ("email", "first_name", "last_name", "is_staff", "verified", "account")
    list_filter = ("is_staff", "is_superuser", "is_active", "verified", "groups")
    search_fields = ("first_name", "last_name", "email")
    ordering = ("email",)
    filter_horizontal = (
        "groups",
        "lodgings",
        "user_permissions",
    )

    def get_fieldsets(self, request, obj=None):
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        """
        Use special form during user creation
        """
        defaults = {}
        if obj is None:
            defaults["form"] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def get_urls(self):
        return [
            path(
                "<id>/password/",
                self.admin_site.admin_view(self.user_change_password),
                name="auth_user_password_change",
            ),
        ] + super().get_urls()

    def lookup_allowed(self, lookup, value):
        # Don't allow lookups involving passwords.
        return not lookup.startswith("password") and super().lookup_allowed(lookup, value)

    @sensitive_post_parameters_m
    @csrf_protect_m
    def add_view(self, request, form_url="", extra_context=None):
        with transaction.atomic(using=router.db_for_write(self.model)):
            return self._add_view(request, form_url, extra_context)

    def _add_view(self, request, form_url="", extra_context=None):
        # It's an error for a user to have add permission but NOT change
        # permission for users. If we allowed such users to add users, they
        # could create superusers, which would mean they would essentially have
        # the permission to change users. To avoid the problem entirely, we
        # disallow users from adding users if they don't have change
        # permission.
        if not self.has_change_permission(request):
            if self.has_add_permission(request) and settings.DEBUG:
                # Raise Http404 in debug mode so that the user gets a helpful
                # error message.
                raise Http404(
                    'Your user does not have the "Change user" permission. In '
                    "order to add users, Django requires that your user "
                    'account have both the "Add user" and "Change user" '
                    "permissions set."
                )
            raise PermissionDenied
        if extra_context is None:
            extra_context = {}
        username_field = self.opts.get_field(self.model.USERNAME_FIELD)
        defaults = {
            "auto_populated_fields": (),
            "username_help_text": username_field.help_text,
        }
        extra_context.update(defaults)
        return super().add_view(request, form_url, extra_context)

    @sensitive_post_parameters_m
    def user_change_password(self, request, id, form_url=""):
        user = self.get_object(request, unquote(id))
        if not self.has_change_permission(request, user):
            raise PermissionDenied
        if user is None:
            raise Http404(
                _("%(name)s object with primary key %(key)r does not exist.")
                % {
                    "name": self.opts.verbose_name,
                    "key": escape(id),
                }
            )
        if request.method == "POST":
            form = self.change_password_form(user, request.POST)
            if form.is_valid():
                form.save()
                change_message = self.construct_change_message(request, form, None)
                self.log_change(request, user, change_message)
                msg = gettext("Password changed successfully.")
                messages.success(request, msg)
                update_session_auth_hash(request, form.user)
                return HttpResponseRedirect(
                    reverse(
                        "%s:%s_%s_change"
                        % (
                            self.admin_site.name,
                            user._meta.app_label,
                            user._meta.model_name,
                        ),
                        args=(user.pk,),
                    )
                )
        else:
            form = self.change_password_form(user)

        fieldsets = [(None, {"fields": list(form.base_fields)})]
        admin_form = admin.helpers.AdminForm(form, fieldsets, {})

        context = {
            "title": _("Change password: %s") % escape(user.get_username()),
            "adminForm": admin_form,
            "form_url": form_url,
            "form": form,
            "is_popup": (IS_POPUP_VAR in request.POST or IS_POPUP_VAR in request.GET),
            "is_popup_var": IS_POPUP_VAR,
            "add": True,
            "change": False,
            "has_delete_permission": False,
            "has_change_permission": True,
            "has_absolute_url": False,
            "opts": self.opts,
            "original": user,
            "save_as": False,
            "show_save": True,
            **self.admin_site.each_context(request),
        }

        request.current_app = self.admin_site.name

        return TemplateResponse(
            request,
            self.change_user_password_template or "admin/auth/user/change_password.html",
            context,
        )

    def response_add(self, request, obj, post_url_continue=None):
        """
        Determine the HttpResponse for the add_view stage. It mostly defers to
        its superclass implementation but is customized because the User model
        has a slightly different workflow.
        """
        # We should allow further modification of the user just added i.e. the
        # 'Save' button should behave like the 'Save and continue editing'
        # button except in two scenarios:
        # * The user has pressed the 'Save and add another' button
        # * We are adding a user in a popup
        if "_addanother" not in request.POST and IS_POPUP_VAR not in request.POST:
            request.POST = request.POST.copy()
            request.POST["_continue"] = 1
        return super().response_add(request, obj, post_url_continue)


class PaymentInlineAdmin(RestrictedInlineModelAdminMixIn, TabularInline):
    model = models.Payment
    ordering = ("-date",)


class CommentInlineAdmin(RestrictedInlineModelAdminMixIn, TabularInline):
    model = models.Comment
    ordering = ("created_on",)


class BookingAdmin(RestrictedModelAdminMixIn, ImportExportMixin, SimpleHistoryAdmin):
    list_display = (
        "id",
        "lodging",
        "status",
        "guest_name",
        "begin_date",
        "end_date",
        "duration",
        "adults",
        "children",
        "babies",
        "price",
        "cashed_in",
        "is_flat_rate",
        "deposit",
        "guaranty",
        "commission_fees",
        "source",
        "source_uid_",
        "cancelled",
        "deleted",
    )
    list_filter = (
        "lodging",
        "status",
        "begin_date",
        "source",
        "cancelled",
        "deleted",
    )
    search_fields = ("guest_name",)
    history_list_display = (
        "status",
        "cancelled",
        "deleted",
    )
    ordering = ("-begin_date",)
    resource_class = BookingResource
    inlines = [PaymentInlineAdmin, CommentInlineAdmin]

    def source_uid_(self, obj: models.Booking):
        return obj.source_uid and "%s..." % obj.source_uid[0:5]

    source_uid_.short_description = _("Channel UID")

    def cashed_in(self, obj: models.Booking):
        return obj.payment_set.all().aggregate(total=Sum("amount"))["total"]


class BookingChannelAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = ("name", "account")


class BookingChannelSyncAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = (
        "id",
        "channel",
        "lodging",
        "source_url",
        "url_for_remote",
        "active",
        "last_import",
        "last_export",
        "last_import_error",
    )
    list_display_links = ("channel", "lodging")
    list_filter = ("lodging", "lodging__owner", "channel", "active")
    list_editable = ("active",)
    actions = ["synchronize"]

    def get_queryset(self, request):
        qs = super(BookingChannelSyncAdmin, self).get_queryset(request)
        self.request = request
        return qs

    def url_for_remote(self, obj):
        return obj.url_for_remote(self.request)
        # return reverse("calendar_sync", kwargs={"uid": obj.lodging.uid}, request=self.request) + "?s=%d" % obj.id

    @admin.action(description="Run synchronization")
    def synchronize(self, request, queryset):
        count = queryset.count()
        for sync in queryset:
            retrieve_and_synchronize_bookings(sync)
        self.message_user(
            request,
            ngettext(
                "%d channel was successfully synchronized.",
                "%d channels were successfully synchronized.",
                count,
            )
            % count,
            messages.SUCCESS,
        )


class LodgingAdmin(RestrictedModelAdminMixIn, ImportExportMixin, SimpleHistoryAdmin):
    list_display = (
        "__str__",
        "id",
        "name",
        "owner",
        "rank",
        "active",
        "shown",
        "capacity",
        "daily_rate",
        "guaranty",
        "is_flat_rate_tourist_tax",
        "tourist_tax_included_in_payment",
        "tourist_tax_rate",
        "max_daily_tourist_tax",
        "contract_template",
    )
    list_editable = (
        "name",
        "rank",
        "owner",
        "active",
        "shown",
        "capacity",
        "daily_rate",
        "guaranty",
        "is_flat_rate_tourist_tax",
        "tourist_tax_included_in_payment",
        "tourist_tax_rate",
        "max_daily_tourist_tax",
        "contract_template",
    )
    list_filter = ("owner", "active", "shown")


class HolidaysAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = ("id", "name", "begin_date", "end_date", "account")
    list_display_links = ("name",)
    ordering = ("begin_date",)


class PricingAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = (
        "id",
        "name",
        "daily_rate",
        "weekend_rate",
        "weekly_rate",
        "minimum_stay",
        "included_guests",
        "supplement_per_additional_guest",
        "account",
    )
    list_display_links = ("name",)
    list_editable = (
        "daily_rate",
        "weekend_rate",
        "weekly_rate",
        "minimum_stay",
        "included_guests",
        "supplement_per_additional_guest",
    )


class SeasonalVariationAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = (
        "id",
        "pricing",
        "name",
        "begin_date",
        "end_date",
        "daily_rate",
        "weekend_rate",
        "weekly_rate",
        "minimum_stay",
    )
    list_display_links = ("name",)


class ContractTemplateAdmin(RestrictedModelAdminMixIn, ImportExportMixin, SimpleHistoryAdmin):
    list_display = ("id", "name", "created", "modified", "account")
    list_display_links = (
        "id",
        "name",
    )


class PaymentAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = ("id", "booking", "description", "amount", "method", "date", "checked")
    ordering = ("-date",)


class ServiceAdmin(RestrictedModelAdminMixIn, ImportExportModelAdmin):
    list_display = (
        "reference",
        "designation",
        "unit_price",
        "vat",
        "is_flat_rate",
        "not_included_in_price",
        "account",
    )


class ContractAdmin(RestrictedModelAdminMixIn, admin.ModelAdmin):
    list_display = ("booking", "created", "modified", "pdf_created")
    list_filter = ("booking__lodging", "created", "modified")


class BookedServiceAdmin(RestrictedModelAdminMixIn, admin.ModelAdmin):
    list_display = ("booking", "service", "unit_price", "is_flat_rate")
    list_filter = ("service", "unit_price", "is_flat_rate")


site.register(models.Booking, BookingAdmin)
site.register(models.Service, ServiceAdmin)
site.register(models.Lodging, LodgingAdmin)
site.register(models.BookingChannel, BookingChannelAdmin)
site.register(models.BookingChannelSync, BookingChannelSyncAdmin)
site.register(models.BookedService, BookedServiceAdmin)
site.register(models.Holidays, HolidaysAdmin)
site.register(models.Pricing, PricingAdmin)
site.register(models.SeasonalVariation, SeasonalVariationAdmin)
site.register(models.Contract, ContractAdmin)
site.register(models.ContractTemplate, ContractTemplateAdmin)
site.register(models.Payment, PaymentAdmin)

site.register([Config], ConstanceAdmin)
site.register(Group, GroupAdmin)
site.register(CronJobLog, CronJobLogAdmin)
site.register(CronJobLock)
site.register(AuthToken, AuthTokenAdmin)
