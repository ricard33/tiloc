__all__ = ["UserResource", "BookingResource", "CommentResource"]

from import_export import fields, resources
from import_export.widgets import DateTimeWidget, ForeignKeyWidget, ManyToManyWidget
from django.contrib.auth.models import Group

from core import models


class UserResource(resources.ModelResource):
    account = fields.Field(column_name="account", attribute="account", widget=ForeignKeyWidget(models.Account, "name"))
    groups = fields.Field(
        column_name="groups",
        attribute="groups",
        widget=ManyToManyWidget(Group, field="name", separator=","),
    )

    class Meta:
        model = models.User
        # fields = (
        #     "id",
        #     "account",
        #     "first_name",
        #     "last_name",
        #     "email",
        #     "is_active",
        #     "is_staff",
        #     "is_superuser",
        #     "groups",
        #     "date_joined",
        #     "last_login",
        #     "is_staff",
        #     "is_superuser",
        #     "phone",
        #     "address",
        #     "lodgings",
        #     "tz",
        #     "legal",
        #     "payment",
        #     "billing",
        #     "no_vat",
        #     "vat_rate",
        #     "logo",
        #     "signature",
        #     "verified",
        # )
        # export_order = (
        #     "id",
        #     "account",
        #     "first_name",
        #     "last_name",
        #     "email",
        #     "is_active",
        #     "is_staff",
        #     "is_superuser",
        #     "groups",
        #     "date_joined",
        #     "last_login",
        #     "is_staff",
        #     "is_superuser",
        #     "phone",
        #     "address",
        #     "lodgings",
        #     "tz",
        #     "legal",
        #     "payment",
        #     "billing",
        #     "no_vat",
        #     "vat_rate",
        #     "logo",
        #     "signature",
        #     "verified",
        # )

class BookingResource(resources.ModelResource):
    account = fields.Field(column_name="account", attribute="account", widget=ForeignKeyWidget(models.Account, "name"))
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
            "account",
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
            "guests_distribution",
            "catering",
            "daily_rate",
            "price",
            "is_flat_rate",
            "deposit",
            "guaranty",
            "commission_fees",
            "is_flat_rate_tourist_tax",
            "tourist_tax_included_in_payment",
            "max_daily_tourist_tax",
            "tourist_tax_rate",
            "custom_tourist_tax",
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
            "account",
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
            "guests_distribution",
            "catering",
            "daily_rate",
            "price",
            "is_flat_rate",
            "deposit",
            "guaranty",
            "commission_fees",
            "is_flat_rate_tourist_tax",
            "tourist_tax_included_in_payment",
            "max_daily_tourist_tax",
            "tourist_tax_rate",
            "custom_tourist_tax",
            "arrival_details",
            "departure_details",
            "notes",
            'options',
            "cancelled",
            "deleted",
            "created",
            "modified",
        )

    def after_import_row(self, row, row_result, **kwargs):
        models.Booking.objects.filter(id=row_result.object_id).update(
            created=self.fields["created"].widget.render(self.fields["created"].clean(row, **kwargs)),
            modified=self.fields["modified"].widget.render(self.fields["modified"].clean(row, **kwargs)),
        )


class CommentResource(resources.ModelResource):
    class Meta:
        model = models.Comment

    def after_import_row(self, row, row_result, **kwargs):
        models.Comment.objects.filter(id=row_result.object_id).update(
            created_on=self.fields["created_on"].widget.render(self.fields["created_on"].clean(row, **kwargs)),
            modified=self.fields["modified"].widget.render(self.fields["modified"].clean(row, **kwargs)),
        )
