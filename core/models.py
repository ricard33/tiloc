import logging
import os
import re
import uuid
from datetime import date

from django.conf import settings
from django.db import models
from django.db.models import Sum
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

logger = logging.getLogger('api')


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return 'owner_{0}/{1}'.format(instance.id, filename)


class Owner(models.Model):
    class DepositOrDownPayment(models.TextChoices):
        DEPOSIT = 'deposit', _('Deposit')
        DOWN_PAYMENT = 'down_payment', _('Down payment')

    class InvoiceLabel(models.TextChoices):
        INVOICE = 'invoice', _('Invoice')
        NOTE = 'note', _('Note')
        RECEIPT = 'receipt', _('Receipt')
        QUITTANCE = 'quittance', _('Quittance')

    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200, unique=True)
    email = models.EmailField(_("email"))
    phone = models.CharField(_("phone"), max_length=30, blank=True, null=True)
    contact = models.TextField(_("contact"), blank=True, null=True,
                               help_text=_("Phone number and email as displayed in contracts, invoices, etc..."))
    address = models.TextField(_("address"), blank=True, null=True)
    legal = models.TextField(_("legal mention"), blank=True, null=True, help_text=_("Legal mention on bills"))
    payment = models.TextField(_("payment"), blank=True, null=True, help_text=_("Payment information"))
    billing = models.TextField(_("billing"), blank=True, null=True, help_text=_("Billing conditions"))
    no_vat = models.BooleanField(_("no vat"), )
    vat_rate = models.DecimalField(_("vat rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    note = models.TextField(_("note"), blank=True)
    invoice_label = models.CharField(_("invoice label"), max_length=30, choices=InvoiceLabel.choices,
                                     default=InvoiceLabel.RECEIPT)
    deposit_label = models.CharField(_("deposit or down payment"), max_length=30, choices=DepositOrDownPayment.choices,
                                     default=DepositOrDownPayment.DEPOSIT)
    logo = models.ImageField(_("logo"), upload_to=user_directory_path, blank=True)
    signature = models.ImageField(_("signature"), upload_to=user_directory_path, blank=True)
    display_week = models.BooleanField(_("display week number"), default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Owner")

    def __str__(self):
        return self.name


class Lodging(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    active = models.BooleanField(_("active"), default=True)
    shown = models.BooleanField(_("shown"), default=True)
    name = models.CharField(_("name"), max_length=200, unique=True)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    rank = models.IntegerField(_("rank"), )
    address = models.TextField(_("address"), )
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2,
                                     help_text=_("Default price for one night"))
    # weekly_rate = models.DecimalField(_("weekly price"), max_digits=10, decimal_places=2, null=True, blank=True)
    guaranty = models.DecimalField(_("guaranty deposit"), max_digits=10, decimal_places=2, null=True, blank=True)
    # NOTE should probably be removed. But how to handle different cleaning fees for different lodging ?
    cleaning_fee = models.DecimalField(_("cleaning fee"), max_digits=10, decimal_places=2, null=True, blank=True)
    capacity = models.IntegerField(_("capacity"), null=True, blank=True)
    information = models.TextField(_("information"), blank=True)
    tourist_tax = models.DecimalField(_("tourist tax"), max_digits=10, decimal_places=2, null=True, blank=True)

    contract_template = models.ForeignKey("ContractTemplate", on_delete=models.PROTECT, null=True, blank=True)
    description = models.TextField(_("description"), blank=True, help_text=_("Used by contracts generation"))

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Lodging")
        ordering = ['owner', 'rank']

    def __str__(self):
        return self.name

    def generate_empty_contract(self, url_server='http://127.0.0.1:8000'):
        booking = Booking(
            lodging=self,
            guest_name="........................................",
            guest_contact="email: .................................@.................... - tel: ...................................",
            guest_address="........................................\n........................................\n........................................",
            guaranty=self.guaranty,
            adults=0,
            price=0,
        )
        return booking.generate_contract(url_server=url_server, save=False).content


class Category(models.Model):
    """Category of receipts, mainly for reports"""
    name = models.CharField(_("name"), max_length=100)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")

    def __str__(self):
        return self.name


class Service(models.Model):
    reference = models.CharField(_("reference"), blank=True, null=True, max_length=20)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    designation = models.CharField(_("designation"), max_length=256)
    quantity = models.SmallIntegerField(_("quantity"), default=1)
    unit_price = models.DecimalField(_("unit price VAT incl."), max_digits=10, decimal_places=2, blank=True,
                                     null=True)
    vat = models.DecimalField(_("VAT %"), max_digits=10, decimal_places=2, blank=True, null=True)
    is_flat_rate = models.BooleanField(_("flat rate?"), default=False,
                                       help_text=_("Use flat rate price instead of daily price computation"))
    included_in_booking = models.BooleanField(
        _("included in booking"), default=False,
        help_text=_("If true, the price of this option is included in booking price and not displayed separately"))
    not_included_in_price = models.BooleanField(
        _("not included in price"), default=False,
        help_text=_("Service not included in current booking price. Maybe provided by external partner..."))
    auto_add_booking = models.BooleanField(_("auto add booking"), default=False)
    auto_add_invoice = models.BooleanField(_("auto add invoice"), default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Service")
        ordering = ("reference",)

    def __str__(self):
        return self.designation


class BookingStatus(models.Model):
    name = models.CharField(_("name"), max_length=100)
    color = models.CharField(_("color"), max_length=10)
    rank = models.PositiveSmallIntegerField(_("rank"))

    class Meta:
        verbose_name = _("Booking status")
        verbose_name_plural = _("Booking statuses")
        ordering = ['rank']

    def __str__(self):
        return self.name


class BookingChannel(models.Model):
    """Where does the booking come from, for reports"""
    name = models.CharField(_("name"), max_length=100)
    default_booking_status = models.ForeignKey(BookingStatus, on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        verbose_name = _("Booking channel")
        ordering = ['name']

    def __str__(self):
        return self.name


class BookingChannelSync(models.Model):
    """Take care about calendar synchronisation with external booking platforms"""
    channel = models.ForeignKey(BookingChannel, on_delete=models.CASCADE)
    lodging = models.ForeignKey(Lodging, on_delete=models.CASCADE)
    source_url = models.URLField(_("Source URL"))
    active = models.BooleanField(_("active"), default=True)
    last_import = models.DateTimeField(blank=True, null=True,
                                       help_text=_("Last time we imported remote calendar from channel."))
    last_export = models.DateTimeField(blank=True, null=True, help_text=_(
        "Last time the calendar has been successfully requested by remote channel."))
    last_import_error = models.TextField(null=True, blank=True)


class Booking(models.Model):
    class Catering(models.TextChoices):
        NONE = 'none', _('None')
        BREAKFAST = 'breakfast', _('Breakfast')
        HALF = 'half', _('Half board')
        FULL = 'full', _('Full board')

    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    lodging = models.ForeignKey(Lodging, blank=True, null=True, on_delete=models.SET_NULL)
    guest_name = models.CharField(_("guest name"), max_length=256)
    guest_contact = models.TextField(_("guest contact"), blank=True, null=True)
    guest_address = models.TextField(_("guest address"), blank=True, null=True)
    status = models.ForeignKey(BookingStatus, on_delete=models.PROTECT)
    source = models.ForeignKey(BookingChannel, on_delete=models.PROTECT, blank=True, null=True)
    source_uid = models.CharField(_("channel UID"), max_length=256, null=True, blank=True,
                                  help_text=_('UID on source channel'))
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )
    duration = models.PositiveSmallIntegerField(_("duration"), )
    adults = models.PositiveSmallIntegerField(_("adults"), default=1)
    children = models.PositiveSmallIntegerField(_("children"), default=0)
    babies = models.PositiveSmallIntegerField(_("babies"), default=0)
    catering = models.CharField(_("catering"), choices=Catering.choices, default=Catering.NONE, max_length=20)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2,
                                help_text=_("Total price, either computed by daily price or applying flat rate"))
    is_flat_rate = models.BooleanField(_("flat rate?"), default=False,
                                       help_text=_("Use flat rate price instead of daily price computation if true"))
    deposit = models.DecimalField(_("deposit"), max_digits=10, decimal_places=2, blank=True, null=True)
    guaranty = models.DecimalField(_("guaranty"), max_digits=10, decimal_places=2, blank=True, null=True)
    commission_fees = models.DecimalField(_("commission fees"), max_digits=10, decimal_places=2, blank=True, null=True)
    info = models.TextField(_("info"), blank=True, null=True)

    special_conditions = models.TextField(_("Special conditions"), blank=True, null=True)
    options = models.ManyToManyField(Service, through='BookedService')

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Booking")

    def __str__(self):
        return "%s (%s: %s -> %s)" % (
            self.guest_name, self.lodging and self.lodging.name or '--', self.begin_date, self.end_date)

    @property
    def price_with_options(self):
        total = self.price
        for option in self.bookedservice_set.filter(service__not_included_in_price=False):
            if option.service.unit_price:
                total += option.service.unit_price * (option.service.is_flat_rate and 1 or self.duration)
        return total

    @property
    def total_payments(self):
        """Returns the sum of the payments already made."""
        return self.payment_set.aggregate(total_payments=Sum('amount'))['total_payments'] or 0

    @property
    def left_to_pay(self):
        """Returns the left to pay, with options included in price, but not excluded options."""
        return self.price_with_options - self.total_payments

    def get_absolute_url(self):
        return reverse('booking-detail', kwargs={'pk': self.pk})

    def generate_contract(self, url_server='http://127.0.0.1:8000', save=True):
        if not self.lodging:
            logger.warning("Lodging not set, can't generate a contract")
            return None
        if not Contract.objects.filter(booking=self).exists():
            self.contract = Contract(booking=self)
        if self.lodging.contract_template:
            from core.jinja2_tools import render_template
            signature_img = '<img style="max-width: 200px; max-height: 100px" ' \
                            'src="%s" alt="Signature"' % (url_server + self.lodging.owner.signature.url)

            content = render_template(self.lodging.contract_template.content,
                                      {
                                          'booking':    self,
                                          'lodging':    self.lodging,
                                          'owner':      self.lodging.owner,
                                          'options':    list(self.bookedservice_set.all()),
                                          'included_options':   self.bookedservice_set.filter(
                                              service__not_included_in_price=False),
                                          'third_party_options': self.bookedservice_set.filter(
                                              service__not_included_in_price=True),
                                          'url_server': url_server,
                                          'date':       date.today(),
                                          'signature':  signature_img
                                      })
            page_break = '<div style="display: block; page-break-before: always;"></div>'
            if self.lodging.description:
                content += page_break + self.lodging.description
            self.contract.content = content
        else:
            logger.warning("Contract template not set for lodging '%s', can't generate a contract", self.lodging)
            self.contract.content = ""
        if save:
            self.contract.save()
        return self.contract


def contracts_path():
    return os.path.join(settings.MEDIA_ROOT, 'contracts')


class Contract(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    content = models.TextField(_("Contract"))
    pdf = models.CharField(max_length=255, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    pdf_created = models.DateTimeField(null=True, blank=True)
    signed = models.DateTimeField(_("signed"), null=True, blank=True)

    class Meta:
        verbose_name = _("Contract")

    def __str__(self):
        return "%s (%s -> %s)" % (self.booking.guest_name, self.booking.begin_date, self.booking.end_date)

    def make_pdf_path(self):
        def multiple_replace(string, rep_dict):
            pattern = re.compile("|".join([re.escape(k) for k in sorted(rep_dict, key=len, reverse=True)]),
                                 flags=re.DOTALL)
            return pattern.sub(lambda x: rep_dict[x.group(0)], string)

        return os.path.join('contracts', str(self.booking.lodging.uid),
                            "%s_%s.pdf" % (self.booking.begin_date.isoformat(),
                                           multiple_replace(self.booking.guest_name, {
                                               " ": "_",
                                               ",": "_",
                                               ";": "_",
                                           })))


class ContractTemplate(models.Model):
    name = models.CharField(max_length=100)
    content = models.TextField(_("Contract"))
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Contract template")

    def __str__(self):
        return self.name


class BookedService(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.SmallIntegerField(_("quantity"))

    class Meta:
        verbose_name = _("Booking service")


class Holidays(models.Model):
    name = models.CharField(_("name"), max_length=256)
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )

    class Meta:
        verbose_name_plural = _("holidays")


class Pricing(models.Model):  # or RatePlan
    name = models.CharField(_("name"), max_length=256)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekend_rate = models.DecimalField(_("weekend rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekly_rate = models.DecimalField(_("weekly rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    minimum_stay = models.PositiveSmallIntegerField(_("Minimum stay"))
    included_guests = models.PositiveSmallIntegerField(_("Number of guests included in the price"))
    supplement_per_additional_guest = models.PositiveSmallIntegerField(
        _('Supplement per night and per additional guest'))
    info = models.TextField(_("info"), blank=True, null=True)


class SeasonalVariation(models.Model):
    pricing = models.ForeignKey(Pricing, on_delete=models.CASCADE)
    name = models.CharField(_("name"), max_length=256)
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekend_rate = models.DecimalField(_("weekend rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekly_rate = models.DecimalField(_("weekly rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    minimum_stay = models.PositiveSmallIntegerField(_("Minimum stay"))


class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('Cash')
        BANK_CARD = 'bank_card', _('Bank card')
        CHECK = 'check', _('Check')
        TRANSFER = 'transfer', _('Transfer')
        PAYPAL = 'paypal', _('PayPal')
        HOLIDAY_VOUCHERS = 'vouchers', _('Holiday vouchers')
        OTHER = 'other', _('Other')

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    description = models.CharField(_("description"), max_length=255)
    amount = models.DecimalField(_("amount"), max_digits=10, decimal_places=2)
    method = models.CharField(_("Payment method"), max_length=30, choices=PaymentMethod.choices)
    date = models.DateField(_("Payment date"))

    class Meta:
        ordering = ['date']
