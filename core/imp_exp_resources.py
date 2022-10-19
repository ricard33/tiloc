__all__ = ["BookingResource"]

from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget

from core import models


class BookingResource(resources.ModelResource):
    lodging = fields.Field(column_name="lodging", attribute="lodging", widget=ForeignKeyWidget(models.Lodging, "name"))
    status = fields.Field(
        column_name="status", attribute="status", widget=ForeignKeyWidget(models.BookingStatus, "name")
    )
    source = fields.Field(
        column_name="source", attribute="source", widget=ForeignKeyWidget(models.BookingChannel, "name")
    )
    # options = fields.Field(column_name='options', attribute='options',
    #                        widget=ManyToManyWidget(models.BookingChannel, ','))

    class Meta:
        model = models.Booking
        fields = (
            "id",
            "lodging",
            "status",
            "guest_name",
            "guest_contact",
            "guest_address",
            "source",
            "begin_date",
            "end_date",
            "duration",
            "adults",
            "children",
            "babies",
            "catering",
            "daily_rate",
            "price",
            "is_flat_rate",
            "deposit",
            "guaranty",
            "notes",
        )  # 'options')
        export_order = (
            "id",
            "lodging",
            "status",
            "guest_name",
            "guest_contact",
            "guest_address",
            "source",
            "begin_date",
            "end_date",
            "duration",
            "adults",
            "children",
            "babies",
            "catering",
            "daily_rate",
            "price",
            "is_flat_rate",
            "deposit",
            "guaranty",
            "notes",
        )  # 'options')
