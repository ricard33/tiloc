import uuid

from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


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
    contact = models.TextField(_("contact"), blank=True, null=True, help_text=_("Phone number and email as displayed in contracts, invoices, etc..."))
    address = models.TextField(_("address"), blank=True, null=True)
    legal = models.TextField(_("legal mention"), blank=True, null=True, help_text=_("Legal mention on bills"))
    payment = models.TextField(_("payment"), blank=True, null=True, help_text=_("Payment information"))
    billing = models.TextField(_("billing"), blank=True, null=True, help_text=_("Billing conditions"))
    no_vat = models.BooleanField(_("no vat"), )
    vat_rate = models.DecimalField(_("vat rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    note = models.TextField(_("note"), blank=True)
    invoice_label = models.CharField(_("invoice label"), max_length=30, choices=InvoiceLabel.choices, default=InvoiceLabel.RECEIPT)
    deposit_label = models.CharField(_("deposit or down payment"), max_length=30, choices=DepositOrDownPayment.choices, default=DepositOrDownPayment.DEPOSIT)
    logo = models.ImageField(_("logo"), blank=True)
    signature = models.ImageField(_("signature"), blank=True)
    display_week = models.BooleanField(_("display week number"), default=False)

    class Meta:
        verbose_name = _("Owner")

    def __str__(self):
        return self.name


class Lodging(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200, unique=True)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    rank = models.IntegerField(_("rank"), )
    address = models.TextField(_("address"), )
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, help_text=_("Default price for one night"))
    # weekly_rate = models.DecimalField(_("weekly price"), max_digits=10, decimal_places=2, null=True, blank=True)
    guaranty = models.DecimalField(_("guaranty deposit"), max_digits=10, decimal_places=2, null=True, blank=True)
    cleaning_fee = models.DecimalField(_("cleaning fee"), max_digits=10, decimal_places=2, null=True, blank=True)
    capacity = models.IntegerField(_("capacity"), null=True, blank=True)
    information = models.TextField(_("information"), blank=True)

    class Meta:
        verbose_name = _("Lodging")

    def __str__(self):
        return self.name


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
    quantity = models.DecimalField(_("quantity"), max_digits=10, decimal_places=2, blank=True, null=True)
    unit_price_ht = models.DecimalField(_("unit price VAT excl."), max_digits=10, decimal_places=2, blank=True, null=True)
    vat = models.DecimalField(_("VAT %"), max_digits=10, decimal_places=2, blank=True, null=True)
    auto_add_booking = models.BooleanField(_("auto add booking"), default=False)
    auto_add_invoice = models.BooleanField(_("auto add invoice"), default=False)

    class Meta:
        verbose_name = _("Service")

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

    def __str__(self):
        return self.name


class BookingChannelSync(models.Model):
    """Take care about calendar synchronisation with external booking platforms"""
    channel = models.ForeignKey(BookingChannel, on_delete=models.CASCADE)
    lodging = models.ForeignKey(Lodging, on_delete=models.CASCADE)
    source_url = models.URLField(_("Source URL"))
    active = models.BooleanField(_("active"), default=True)
    last_import = models.DateTimeField(blank=True, null=True, help_text=_("Last time we imported remote calendar from channel."))
    last_export = models.DateTimeField(blank=True, null=True, help_text=_("Last time the calendar has been successfully requested by remote channel."))


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
    source_uid = models.CharField(_("channel UID"), max_length=256, null=True, blank=True, help_text=_('UID on source channel'))
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )
    duration = models.PositiveSmallIntegerField(_("duration"), )
    adults = models.PositiveSmallIntegerField(_("adults"), default=1)
    children = models.PositiveSmallIntegerField(_("children"), default=0)
    babies = models.PositiveSmallIntegerField(_("babies"), default=0)
    catering = models.CharField(_("catering"), choices=Catering.choices, default=Catering.NONE, max_length=20)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2, help_text=_("Total price, either computed by daily price or applying flat rate"))
    is_flat_rate = models.BooleanField(_("flat rate?"), default=False, help_text=_("Use flat rate price insteed of daily price computation if true"))
    deposit = models.DecimalField(_("deposit"), max_digits=10, decimal_places=2, blank=True, null=True)
    guaranty = models.DecimalField(_("guaranty"), max_digits=10, decimal_places=2, blank=True, null=True)
    info = models.TextField(_("info"), blank=True, null=True)

    contract = models.FileField(_("contract"), blank=True, null=True)
    contract_date = models.DateField(_("contract date"), blank=True, null=True)
    special_conditions = models.TextField(_("Special conditions"), blank=True, null=True)
    options = models.ManyToManyField(Service, through='BookedService')

    class Meta:
        verbose_name = _("Booking")

    def __str__(self):
        return "%s from %s to %s" % (self.guest_name, self.begin_date, self.end_date)

    def get_absolute_url(self):
        return reverse('booking-detail', kwargs={'pk': self.pk})


class BookedService(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.DecimalField(_("quantity"), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("Booking service")


class Holidays(models.Model):
    name = models.CharField(_("name"), max_length=256)
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )

    class Meta:
        verbose_name_plural = _("holidays")


class Pricing(models.Model): # or RatePlan
    name = models.CharField(_("name"), max_length=256)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekend_rate = models.DecimalField(_("weekend rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    weekly_rate = models.DecimalField(_("weekly rate"), max_digits=10, decimal_places=2, blank=True, null=True)
    minimum_stay = models.PositiveSmallIntegerField(_("Minimum stay"))
    included_guests = models.PositiveSmallIntegerField(_("Number of guests included in the price"))
    supplement_per_additional_guest = models.PositiveSmallIntegerField(_('Supplement per night and per aditional guest'))
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
