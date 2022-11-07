from django.contrib import admin, messages
from django.contrib.admin import TabularInline
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from import_export.admin import ImportExportMixin, ImportExportModelAdmin
from rest_framework.reverse import reverse
from simple_history.admin import SimpleHistoryAdmin

from core import models
from core.imp_exp_resources import BookingResource
from core.sync import retrieve_and_synchronize_bookings


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
    list_filter = ("lodging", "lodging__owner", "channel", "active")
    list_editable = ("active",)
    actions = ["synchronize"]

    def get_queryset(self, request):
        qs = super(BookingChannelSyncAdmin, self).get_queryset(request)
        self.request = request
        return qs

    def url_for_remote(self, obj):
        return reverse("calendar_sync", kwargs={"uid": obj.lodging.uid}, request=self.request) + "?s=%d" % obj.id

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
        "owner",
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
    list_filter = ("owner", "active", "shown")


class OwnerAdmin(ImportExportMixin, SimpleHistoryAdmin):
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
    list_display = ("id", "booking", "description", "amount", "method", "date")
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
admin.site.register(models.Owner, OwnerAdmin)
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
