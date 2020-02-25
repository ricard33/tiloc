from django.contrib import admin
from core import models

admin.site.register(models.Booking)
admin.site.register(models.Service)
admin.site.register(models.Lodging)
admin.site.register(models.Category)
admin.site.register(models.Owner)
admin.site.register(models.BookingChannel)
admin.site.register(models.BookingStatus)
admin.site.register(models.BookedService)
