from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from core import models
from .imp_exp_resources import *


class BookingAdmin(ImportExportModelAdmin):
    list_display = (
        'id', 'lodging', 'status',
        'guest_name',
        'begin_date', 'end_date', 'duration', 'adults', 'children', 'babies',
        'price', 'is_flat_rate', 'deposit')
    resource_class = BookingResource


class BookingStatusAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'color', 'rank')
    list_editable = ('name', 'color', 'rank')


class LodgingAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'owner', 'rank', 'active', 'capacity')


class OwnerAdmin(ImportExportModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'active')
    list_display_links = ( 'name', )


admin.site.register(models.Booking, BookingAdmin)
admin.site.register(models.Service)
admin.site.register(models.Lodging, LodgingAdmin)
admin.site.register(models.Category)
admin.site.register(models.Owner, OwnerAdmin)
admin.site.register(models.BookingChannel)
admin.site.register(models.BookingStatus, BookingStatusAdmin)
admin.site.register(models.BookedService)


