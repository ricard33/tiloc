from django.db import models
from django.utils.translation import gettext_lazy as _


class Owner(models.Model):
    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200)
    email = models.EmailField(_("email"))
    phone = models.CharField(_("phone"), max_length=30, blank=True, null=True)
    contact = models.TextField(_("contact"), blank=True, null=True, help_text=_("Phone number and email as displayed in contracts, invoices, etc..."))
    address = models.TextField(_("address"), blank=True, null=True)
    legal = models.TextField(_("legal mention"), blank=True, null=True, help_text=_("Legal mention on bills"))
    payment = models.TextField(_("payment"), blank=True, null=True, help_text=_("Payment information"))
    billing = models.TextField(_("billing"), blank=True, null=True, help_text=_("Billing conditions"))
    no_vat = models.BooleanField(_("no vat"), )
    vat_rate = models.DecimalField(_("vat rate"), max_digits=10, decimal_places=2, blank=True, null=True, db_column='proprietaire_tva1')
    note = models.TextField(_("note"), )
    invoice_label = models.CharField(_("invoice label"), max_length=30)
    deposit_label = models.CharField(_("deposit label"), max_length=30)
    logo = models.ImageField(_("logo"), )
    signature = models.ImageField(_("signature"), )
    display_week = models.NullBooleanField(_("display week"), )

    class Meta:
        verbose_name = _("Owner")


class Property(models.Model):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200)
    address = models.TextField(_("address"), )

    class Meta:
        verbose_name = _("Property")


class Lodging(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200)
    rank = models.IntegerField(_("rank"), )
    address = models.TextField(_("address"), )
    default_price = models.DecimalField(_("default price"), max_digits=10, decimal_places=2)
    # weekly_package = models.BooleanField(_("weekly package"), default=False)
    # weekly_price = models.DecimalField(_("weekly price"), max_digits=10, decimal_places=2)
    guaranty = models.DecimalField(_("guaranty deposit"), max_digits=10, decimal_places=2)
    cleaning_fee = models.DecimalField(_("cleaning fee"), max_digits=10, decimal_places=2)
    capacity = models.IntegerField(_("capacity"), )
    information = models.TextField(_("information"), )

    class Meta:
        verbose_name = _("Lodging")


class Category(models.Model):
    """Category of receipts, mainly for reports"""
    name = models.CharField(_("name"), max_length=100)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")


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


class BookingStatus(models.Model):
    name = models.CharField(_("name"), max_length=100)
    color = models.CharField(_("color"), max_length=10)

    class Meta:
        verbose_name = _("Booking status")
        verbose_name_plural = _("Booking statuses")


class BookingChannel(models.Model):
    """Where does the booking come from, for reports"""
    name = models.CharField(_("name"), max_length=100)

    class Meta:
        verbose_name = _("Booking channel")


class Booking(models.Model):
    class Catering(models.TextChoices):
        NONE = 'none', _('None')
        BREAKFAST = 'breakfast', _('Breakfast')
        HALF = 'half', _('Half board')
        FULL = 'full', _('Full board')

    lodging = models.ForeignKey(Lodging, on_delete=models.CASCADE)
    customer_name = models.CharField(_("customer name"), max_length=256)
    customer_contact = models.TextField(_("customer contact"), blank=True, null=True)
    customer_address = models.TextField(_("customer address"), blank=True, null=True)
    status = models.ForeignKey(BookingStatus, on_delete=models.PROTECT)
    source = models.ForeignKey(BookingChannel, on_delete=models.PROTECT)
    begin_date = models.DateField(_("begin date"), )
    end_date = models.DateField(_("end date"), )
    duration = models.PositiveSmallIntegerField(_("duration"), )
    adults = models.PositiveSmallIntegerField(_("adults"), default=1)
    children = models.PositiveSmallIntegerField(_("children"), default=0)
    babies = models.PositiveSmallIntegerField(_("babies"), default=0)
    catering = models.CharField(_("catering"), choices=Catering.choices, default=Catering.NONE, max_length=20)
    daily_price = models.DecimalField(_("daily price"), max_digits=10, decimal_places=2, blank=True, null=True)
    flat_rate = models.DecimalField(_("flat rate"), max_digits=10, decimal_places=2, blank=True, null=True, help_text=_("Overwrite daily price computation if set"))
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2, help_text=_("Total price, either computed by daily price or applying flat rate"))
    deposit = models.DecimalField(_("deposit"), max_digits=10, decimal_places=2, blank=True, null=True)
    guaranty = models.DecimalField(_("guaranty"), max_digits=10, decimal_places=2, blank=True, null=True)
    info = models.TextField(_("info"), blank=True, null=True)

    contract = models.FileField(_("contract"), blank=True, null=True)
    contract_date = models.DateField(_("contract date"), blank=True, null=True)
    special_conditions = models.TextField(_("Special conditions"), blank=True, null=True)
    options = models.ManyToManyField(Service, through='BookedService')

    class Meta:
        verbose_name = _("Booking")


class BookedService(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.DecimalField(_("quantity"), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("Booking service")
