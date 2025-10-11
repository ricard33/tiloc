__all__ = ["UserResource", "BookingResource", "BookingForInvoiceResource", "CommentResource"]

from django.contrib.auth.models import Group
from django.utils.formats import date_format
from django.utils.translation import gettext_lazy as _
from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from core import models

EXPORT_DATE_FORMAT = "d/m/Y"


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
        name = "Bookings"
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


class BookingForInvoiceResource(resources.ModelResource):
    lodgings = fields.Field(column_name="lodgings", attribute="lodgings", widget=ManyToManyWidget(models.Lodging, field="name", separator=","))
    source = fields.Field(
        column_name="source", attribute="source", widget=ForeignKeyWidget(models.BookingChannel, "name")
    )
    options = fields.Field(
        column_name="options",
        attribute="options",
        widget=ManyToManyWidget(models.Service, field="reference", separator=","),
    )
    tourist_tax = fields.Field(readonly=True)
    price_with_options = fields.Field(readonly=True)
    paiements = fields.Field(readonly=True)
    invoice_title = fields.Field(readonly=True)

    def dehydrate_tourist_tax(self, booking):
        return booking.tourist_tax

    def dehydrate_price_with_options(self, booking):
        return booking.price_with_options

    def dehydrate_paiements(self, booking):
        def get_amount(p: models.Payment):
            if booking.payment_set.all().count() == 1 and booking.commission_fees:
                return p.amount + booking.commission_fees
            return p.amount
        return '\n'.join(map(lambda b: _("%.2f € by %s on %s") % (get_amount(b), dict(models.Payment.PaymentMethod.choices)[b.method], date_format(b.date, format=EXPORT_DATE_FORMAT)), booking.payment_set.all()))

    def dehydrate_invoice_title(self, booking):
        return _("Stay from %s to %s") % (date_format(booking.begin_date, format=EXPORT_DATE_FORMAT), date_format(booking.end_date, format=EXPORT_DATE_FORMAT))

    class Meta:
        name = "Bookings for invoices"
        model = models.Booking
        fields = (
            "id",
            "invoice_title",
            "lodgings",
            "guest_name",
            "guest_contact",
            "guest_address",
            "status",
            "source",
            "begin_date",
            "end_date",
            "duration",
            "price",
            "price_with_options",
            "deposit",
            "guaranty",
            "commission_fees",
            "tourist_tax",
            "options",
            "paiements",
            "cancelled",
            "deleted",
        )
        export_order = (
            "id",
            "invoice_title",
            "lodgings",
            "guest_name",
            "guest_contact",
            "guest_address",
            "status",
            "source",
            "begin_date",
            "end_date",
            "duration",
            "price",
            "price_with_options",
            "deposit",
            "guaranty",
            "commission_fees",
            "tourist_tax",
            'options',
            "paiements",
            "cancelled",
            "deleted",
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
