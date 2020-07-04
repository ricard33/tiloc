from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from django.utils.translation import gettext_lazy as _

from core import models
from .imp_exp_resources import *


class BookingAdmin(ImportExportModelAdmin):
    list_display = (
        'id', 'lodging', 'status',
        'guest_name',
        'begin_date', 'end_date', 'duration', 'adults', 'children', 'babies',
        'price', 'is_flat_rate', 'deposit', 'source', 'source_uid_')
    list_filter = ('lodging', 'status', 'begin_date', 'source')
    resource_class = BookingResource

    def source_uid_(self, obj: models.Booking):
        return obj.source_uid and "%s..." % obj.source_uid[0:5]
    source_uid_.short_description = _("Channel UID")


class BookingStatusAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'color', 'rank')
    list_editable = ('name', 'color', 'rank')


class BookingChannelAdmin(ImportExportModelAdmin):
    list_display = ('name', 'default_booking_status')


class BookingChannelSyncAdmin(ImportExportModelAdmin):
    list_display = ('id', 'channel', 'lodging', 'source_url', 'active', 'last_import', 'last_export')
    list_display_links = ( 'channel', 'lodging')


class LodgingAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'owner', 'rank', 'active', 'capacity')


class OwnerAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'active')
    list_display_links = ( 'name', )


class HolidaysAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'begin_date', 'end_date')
    list_display_links = ( 'name', )


class PricingAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'daily_rate', 'weekend_rate', 'weekly_rate', 'minimum_stay', 'included_guests',
                    'supplement_per_additional_guest')
    list_display_links = ( 'name', )
    list_editable = ('daily_rate', 'weekend_rate', 'weekly_rate', 'minimum_stay', 'included_guests',
                     'supplement_per_additional_guest')


class SeasonalVariationAdmin(ImportExportModelAdmin):
    list_display = ('id', 'pricing', 'name', 'begin_date', 'end_date',
                    'daily_rate', 'weekend_rate', 'weekly_rate', 'minimum_stay')
    list_display_links = ( 'name', )


admin.site.register(models.Booking, BookingAdmin)
admin.site.register(models.Service)
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
