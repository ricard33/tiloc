__all__ = ["BookingResource"]

from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from core import models


class BookingResource(resources.ModelResource):
    lodgings = fields.Field(column_name="lodgings", attribute="lodgings", widget=ManyToManyWidget(models.Lodging, separator=","))
    source = fields.Field(
        column_name="source", attribute="source", widget=ForeignKeyWidget(models.BookingChannel, "name")
    )
    options = fields.Field(
        column_name="options",
        attribute="options",
        widget=ManyToManyWidget(models.Service, field="reference", separator=","),
    )

    class Meta:
        model = models.Booking
        fields = (
            "id",
            "uid",
            "lodgings",
            "guest_name",
            "guest_contact",
            "guest_address",
            "status",
            "source",
            "source_uid",
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
            "commission_fees",
            "arrival_details",
            "departure_details",
            "notes",
            'options',
            "cancelled",
            "deleted",
            "created",
            "modified",
        )
        export_order = (
            "id",
            "uid",
            "lodgings",
            "guest_name",
            "guest_contact",
            "guest_address",
            "status",
            "source",
            "source_uid",
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
            "commission_fees",
            "arrival_details",
            "departure_details",
            "notes",
            'options',
            "cancelled",
            "deleted",
            "created",
            "modified",
        )
