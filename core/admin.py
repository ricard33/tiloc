from django.conf import settings
from django.contrib import admin, messages
from django.contrib.admin import TabularInline
from django.contrib.admin.options import IS_POPUP_VAR
from django.contrib.admin.utils import unquote
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import UserChangeForm, UserCreationForm, AdminPasswordChangeForm
from django.core.exceptions import PermissionDenied
from django.db import transaction, router
from django.db.models import Sum
from django.http import Http404, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.decorators import method_decorator
from django.utils.html import escape
from django.utils.translation import gettext_lazy as _, gettext
from django.utils.translation import ngettext
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from import_export.admin import ImportExportMixin, ImportExportModelAdmin
from simple_history.admin import SimpleHistoryAdmin

from core import models
from core.imp_exp_resources import BookingResource
from core.sync import retrieve_and_synchronize_bookings

csrf_protect_m = method_decorator(csrf_protect)
sensitive_post_parameters_m = method_decorator(sensitive_post_parameters())


@admin.register(models.User)
class UserAdmin(admin.ModelAdmin):
    add_form_template = "admin/auth/user/add_form.html"
    change_user_password_template = None
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "password1", "password2"),
            },
        ),
    )
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("username",)
    filter_horizontal = (
        "groups",
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
        return not lookup.startswith("password") and super().lookup_allowed(
            lookup, value
        )

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
            self.change_user_password_template
            or "admin/auth/user/change_password.html",
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


class PaymentInlineAdmin(TabularInline):
    model = models.Payment
    ordering = ("-date",)


class BookingAdmin(ImportExportMixin, SimpleHistoryAdmin):
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
    history_list_display = (
        "status",
        "cancelled",
        "deleted",
    )
    ordering = ("-begin_date",)
    resource_class = BookingResource
    inlines = [PaymentInlineAdmin]

    def source_uid_(self, obj: models.Booking):
        return obj.source_uid and "%s..." % obj.source_uid[0:5]

    source_uid_.short_description = _("Channel UID")

    def cashed_in(self, obj: models.Booking):
        return obj.payment_set.all().aggregate(total=Sum("amount"))["total"]


class BookingStatusAdmin(ImportExportModelAdmin):
    list_display = ("id", "name", "color", "rank", "no_stats", "finalized")
    list_editable = ("name", "color", "rank", "no_stats", "finalized")


class BookingChannelAdmin(ImportExportModelAdmin):
    list_display = ("name", "default_booking_status")


class BookingChannelSyncAdmin(ImportExportModelAdmin):
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
    list_filter = ("lodging", "lodging__property", "channel", "active")
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


class LodgingAdmin(ImportExportMixin, SimpleHistoryAdmin):
    list_display = (
        "__str__",
        "id",
        "name",
        "property",
        "rank",
        "active",
        "shown",
        "capacity",
        "daily_rate",
        "guaranty",
        "tourist_tax",
        "contract_template",
    )
    list_editable = (
        "name",
        "rank",
        "active",
        "shown",
        "capacity",
        "daily_rate",
        "guaranty",
        "tourist_tax",
        "contract_template",
    )
    list_filter = ("property", "active", "shown")


class PropertyAdmin(ImportExportMixin, SimpleHistoryAdmin):
    list_display = ("id", "name", "email", "phone", "active")
    list_display_links = ("name",)


class HolidaysAdmin(ImportExportModelAdmin):
    list_display = ("id", "name", "begin_date", "end_date")
    list_display_links = ("name",)
    ordering = ("begin_date",)


class PricingAdmin(ImportExportModelAdmin):
    list_display = (
        "id",
        "name",
        "daily_rate",
        "weekend_rate",
        "weekly_rate",
        "minimum_stay",
        "included_guests",
        "supplement_per_additional_guest",
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


class SeasonalVariationAdmin(ImportExportModelAdmin):
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


class ContractTemplateAdmin(ImportExportMixin, SimpleHistoryAdmin):
    list_display = ("id", "name", "created", "modified")
    list_display_links = (
        "id",
        "name",
    )


class PaymentAdmin(ImportExportModelAdmin):
    list_display = ("id", "booking", "description", "amount", "method", "date", "checked")
    ordering = ("-date",)


class ServiceAdmin(ImportExportMixin, SimpleHistoryAdmin):
    list_display = (
        "reference",
        "category",
        "designation",
        "unit_price",
        "vat",
        "is_flat_rate",
        "included_in_booking",
        "not_included_in_price",
        "auto_add_booking",
        "auto_add_invoice",
    )


admin.site.register(models.Booking, BookingAdmin)
admin.site.register(models.Service, ServiceAdmin)
admin.site.register(models.Lodging, LodgingAdmin)
admin.site.register(models.Category)
admin.site.register(models.Property, PropertyAdmin)
admin.site.register(models.BookingChannel, BookingChannelAdmin)
admin.site.register(models.BookingChannelSync, BookingChannelSyncAdmin)
admin.site.register(models.BookingStatus, BookingStatusAdmin)
admin.site.register(models.BookedService)
admin.site.register(models.Holidays, HolidaysAdmin)
admin.site.register(models.Pricing, PricingAdmin)
admin.site.register(models.SeasonalVariation, SeasonalVariationAdmin)
admin.site.register(models.Contract)
admin.site.register(models.ContractTemplate, ContractTemplateAdmin)
admin.site.register(models.Payment, PaymentAdmin)
