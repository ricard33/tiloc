import logging
import os
import re
import uuid
from datetime import date

from django.conf import settings
from django.contrib.auth import models as auth_models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import UserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, Sum
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from rest_framework.reverse import reverse as drf_reverse
from simple_history.models import HistoricalRecords

logger = logging.getLogger("api")

# -------------------------------------------------------------------------------------------------
# Note: for all models that depends on an account, a field is mandatory in model: _account_qs_path
# it should define the query path to get the account field
# -------------------------------------------------------------------------------------------------


class ForUserQuerySet(models.QuerySet):
    """Generic QuerySet allowing to make filters for a specific user, depending on its account."""

    def for_user(self, user):
        """
        Filter objects to only those visible by the given user.
        Object should have a 'user' or a 'account' property

        :param user:
        :return:
        """

        # query path to get user from object
        user_path = getattr(self.model, "_user_qs_path", None)  # not used as v1.0 (2023)
        # query path to get account from object
        account_path = getattr(self.model, "_account_qs_path", "account") or (
            user_path and user_path + "__account" or None
        )
        property_path = getattr(self.model, "_property_qs_path", None)

        account_query = property_query = user_query = Q(**{})
        # account_path = self.account_path or (self.user_path and self.user_path + "__account" or None)
        if account_path and hasattr(user, "account"):
            account_query = Q(**{account_path: user.account, account_path + "__is_active": True}) | Q(
                **{account_path + "__isnull": True}
            )

        if property_path and not user.has_perm('core.administrator'):
            property_query |= Q(**{property_path + "__in": user.properties.all()})
        if user_path:
            user_query = Q(**{user_path: user})

        return self.filter(account_query & (property_query | user_query)).distinct()


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return "property_{0}/{1}".format(instance.id, filename)


class AccountQuerySet(models.QuerySet):
    def create(self, **kwargs):
        if kwargs.get("name") == "__template__" and Account.objects.filter(name="__template__").exists():
            raise ValidationError(
                "'__template__' account already exists. You're not allowed to create multiple templates."
            )

        account = super().create(**kwargs)
        return account

    def for_user(self, user):
        if user.is_superuser:
            return self
        return self.filter(pk=user.account.pk)

    def get_or_create_demo(self):
        return self.get_or_create(name=settings.DEMO_ACCOUNT_NAME)

    def get_template(self):
        return self.get(name="__template__")


class Account(models.Model):
    name = models.CharField(_("name"), max_length=200, unique=True, help_text=_("Internal name, should be unique"))
    is_active = models.BooleanField(default=True)

    class Meta:
        permissions = (("administrator", "Can administer all account data"),)

    objects = AccountQuerySet.as_manager()

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.name,)

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        creating = self.pk is None or force_insert
        if self.pk is None and self.name == "__template__" and Account.objects.filter(name="__template__").exists():
            raise ValidationError(
                "'__template__' account already exists. " "You're not allowed to create multiple templates."
            )
        super().save(force_insert=force_insert, force_update=force_update, using=using, update_fields=update_fields)

        if creating:
            self.fill_account_with_default_ressources()

    def delete(self, using=None, keep_parents=False):
        self.cleanup_account()
        super().delete(using, keep_parents)

    def cleanup_account(self, using=None, keep_parents=False):

        Payment.objects.filter(booking__lodging__property__account=self).delete()
        Contract.objects.filter(booking__lodging__property__account=self).delete()
        BookedService.objects.filter(booking__lodging__property__account=self).delete()
        Booking.objects.filter(lodging__property__account=self).delete()
        BookingChannelSync.objects.filter(lodging__property__account=self).delete()
        Lodging.objects.filter(property__account=self).delete()
        Property.objects.filter(account=self).delete()
        ContractTemplate.objects.filter(account=self).delete()
        Service.objects.filter(account=self).delete()
        BookingStatus.objects.filter(account=self).delete()
        Pricing.objects.filter(account=self).delete()
        Holidays.objects.filter(account=self).delete()
        User.objects.filter(account=self).delete()

    def fill_account_with_default_ressources(self, template=None):
        try:
            if template is None:
                template = Account.objects.get_template()
            if template.pk == self.pk:
                # don't apply for the template creation itself
                return self

            def _set_account(obj):
                obj.pk = None
                obj.account = self
                return obj

            Service.objects.bulk_create(map(_set_account, template.service_set.all()))
            BookingStatus.objects.bulk_create(map(_set_account, template.bookingstatus_set.all()))
            BookingChannel.objects.bulk_create(map(_set_account, template.bookingchannel_set.all()))
            ContractTemplate.objects.bulk_create(map(_set_account, template.contracttemplate_set.all()))

        except Account.DoesNotExist:
            logging.info(
                "Template account not found. "
                "To have default value, create a fictive account whose name is '__template__', "
                "then create default statuses, services, etc...."
            )
            pass


class MyUserManager(UserManager.from_queryset(ForUserQuerySet)):
    # Inheritance needed to be able to use Manager.from_queryset() and Manager.use_in_migrations jointly
    use_in_migrations = True

    def get_by_natural_key(self, email):
        return self.get(email=email)

    def _create_user(self, email, password, **extra_fields):
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(auth_models.AbstractUser):
    """
    A user of this application (= any employee, including managers and bosses)
    """

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ()

    account = models.ForeignKey(Account, null=True, on_delete=models.CASCADE, verbose_name=_("account"))
    username = None
    email = models.EmailField(_("email address"), unique=True)
    properties = models.ManyToManyField(
        "Property",
        verbose_name=_("properties"),
        blank=True,
        help_text=_("The properties this user has access."),
        related_name="users",
        related_query_name="user",
    )

    _account_qs_path = "account"

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")

    objects = MyUserManager()

    def __str__(self):
        return str(self.email)

    def natural_key(self):
        return (self.get_username(),)

    natural_key.dependencies = ["core.account"]


class Property(models.Model):
    class DepositOrDownPayment(models.TextChoices):
        DEPOSIT = "deposit", _("Deposit")
        DOWN_PAYMENT = "down_payment", _("Down payment")

    class InvoiceLabel(models.TextChoices):
        INVOICE = "invoice", _("Invoice")
        NOTE = "note", _("Note")
        RECEIPT = "receipt", _("Receipt")
        QUITTANCE = "quittance", _("Quittance")

    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    active = models.BooleanField(_("active"), default=True)
    name = models.CharField(_("name"), max_length=200)
    contractual_name = models.CharField(_("name"), max_length=200)
    email = models.EmailField(_("email"))
    phone = models.CharField(_("phone"), max_length=30, blank=True, null=True)
    contact = models.TextField(
        _("contact"),
        blank=True,
        null=True,
        help_text=_("Phone number and email as displayed in contracts, invoices, etc..."),
    )
    address = models.TextField(_("address"), blank=True, null=True)
    legal = models.TextField(_("legal mention"), blank=True, null=True, help_text=_("Legal mention on bills"))
    payment = models.TextField(_("payment"), blank=True, null=True, help_text=_("Payment information"))
    billing = models.TextField(_("billing"), blank=True, null=True, help_text=_("Billing conditions"))
    no_vat = models.BooleanField(
        _("no vat"),
    )
    vat_rate = models.DecimalField(_("vat rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    note = models.TextField(_("note"), blank=True)
    invoice_label = models.CharField(
        _("invoice label"), max_length=30, choices=InvoiceLabel.choices, default=InvoiceLabel.RECEIPT
    )
    deposit_label = models.CharField(
        _("deposit or down payment"),
        max_length=30,
        choices=DepositOrDownPayment.choices,
        default=DepositOrDownPayment.DEPOSIT,
    )
    logo = models.ImageField(_("logo"), upload_to=user_directory_path, blank=True, null=True)
    signature = models.ImageField(_("signature"), upload_to=user_directory_path, blank=True, null=True)
    display_week = models.BooleanField(_("display week number"), default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Property")
        verbose_name_plural = _("Properties")
        unique_together = ["account", "name"]

    objects = ForUserQuerySet.as_manager()

    _account_qs_path = "account"
    _property_qs_path = "pk"

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.name,) + self.account.natural_key()

    natural_key.dependencies = ["core.account"]


class Lodging(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    active = models.BooleanField(_("active"), default=True)
    shown = models.BooleanField(_("shown"), default=True)
    name = models.CharField(_("name"), max_length=200, unique=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    rank = models.IntegerField(
        _("rank"),
    )
    address = models.TextField(
        _("address"),
    )
    daily_rate = models.DecimalField(
        _("daily rate"), max_digits=20, decimal_places=2, help_text=_("Default price for one night")
    )
    # weekly_rate = models.DecimalField(_("weekly price"), max_digits=20, decimal_places=2, null=True, blank=True)
    guaranty = models.DecimalField(_("guaranty deposit"), max_digits=20, decimal_places=2, null=True, blank=True)
    capacity = models.IntegerField(_("capacity"), null=True, blank=True)
    information = models.TextField(_("information"), blank=True)
    tourist_tax = models.DecimalField(_("tourist tax"), max_digits=20, decimal_places=2, null=True, blank=True)

    contract_template = models.ForeignKey("ContractTemplate", on_delete=models.PROTECT, null=True, blank=True)
    description = models.TextField(_("description"), blank=True, help_text=_("Used by contracts generation"))

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Lodging")
        ordering = ["rank"]

    objects = ForUserQuerySet.as_manager()
    _account_qs_path = "property__account"
    _property_qs_path = "property"

    def __str__(self):
        return self.name

    def generate_empty_contract(self, url_server="http://127.0.0.1:8000"):
        booking = Booking(
            lodging=self,
            guest_name="........................................",
            guest_contact="email: .................................@.................... - tel: ...................................",
            guest_address="........................................\n........................................\n........................................",
            guaranty=self.guaranty,
            duration=0,
            adults=0,
            price=0,
        )
        return booking.generate_contract(url_server=url_server, save=False).content


class Service(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    reference = models.CharField(_("reference"), blank=True, null=True, max_length=20)
    designation = models.CharField(_("designation"), max_length=256)
    unit_price = models.DecimalField(_("unit price VAT incl."), max_digits=20, decimal_places=2, blank=True, null=True)
    vat = models.DecimalField(_("VAT %"), max_digits=20, decimal_places=2, blank=True, null=True)
    is_flat_rate = models.BooleanField(
        _("flat rate?"), default=False, help_text=_("Use flat rate price instead of daily price computation")
    )
    included_in_booking = models.BooleanField(
        _("included in booking"),
        default=False,
        help_text=_("If true, the price of this option is included in booking price and not displayed separately"),
    )
    not_included_in_price = models.BooleanField(
        _("not included in price"),
        default=False,
        help_text=_("Service not included in current booking price. Maybe provided by external partner..."),
    )
    auto_add_booking = models.BooleanField(_("auto add booking"), default=False)
    auto_add_invoice = models.BooleanField(_("auto add invoice"), default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Service")
        ordering = ("reference",)

    _account_qs_path = "account"

    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return self.designation


class BookingStatus(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    name = models.CharField(_("name"), max_length=100)
    color = models.CharField(_("color"), max_length=20)
    rank = models.PositiveSmallIntegerField(_("rank"))
    no_stats = models.BooleanField(
        default=False, help_text=_("Check to ignore from statistics bookings with this status")
    )
    finalized = models.BooleanField(
        default=True, help_text=_("If true, the booking is finalized and considered as real")
    )

    class Meta:
        verbose_name = _("Booking status")
        verbose_name_plural = _("Booking statuses")
        ordering = ["rank"]

    _account_qs_path = "account"
    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return self.name


class BookingChannel(models.Model):
    """Where does the booking come from, for reports"""

    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    name = models.CharField(_("name"), max_length=100)
    default_booking_status = models.ForeignKey(BookingStatus, on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        verbose_name = _("Booking channel")
        ordering = ["name"]

    _account_qs_path = "account"
    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return self.name


class BookingChannelSync(models.Model):
    """Take care about calendar synchronisation with external booking platforms"""

    channel = models.ForeignKey(BookingChannel, on_delete=models.CASCADE)
    lodging = models.ForeignKey(Lodging, on_delete=models.CASCADE)
    source_url = models.URLField(_("Source URL"))
    active = models.BooleanField(_("active"), default=True)
    last_import = models.DateTimeField(
        blank=True, null=True, help_text=_("Last time we imported remote calendar from channel.")
    )
    last_export = models.DateTimeField(
        blank=True, null=True, help_text=_("Last time the calendar has been successfully requested by remote channel.")
    )
    last_import_error = models.TextField(null=True, blank=True)

    _account_qs_path = "channel__account"
    _property_qs_path = "lodging__property"
    objects = ForUserQuerySet.as_manager()

    def url_for_remote(self, request):
        return drf_reverse("calendar_sync", kwargs={"uid": self.lodging.uid}, request=request) + "?s=%d" % self.id


class Booking(models.Model):
    class Catering(models.TextChoices):
        NONE = "none", _("None")
        BREAKFAST = "breakfast", _("Breakfast")
        HALF = "half", _("Half board")
        FULL = "full", _("Full board")

    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    lodging = models.ForeignKey(Lodging, on_delete=models.CASCADE)
    guest_name = models.CharField(_("guest name"), max_length=256)
    guest_contact = models.TextField(_("guest contact"), blank=True, null=True)
    guest_address = models.TextField(_("guest address"), blank=True, null=True)
    status = models.ForeignKey(BookingStatus, on_delete=models.PROTECT)
    source = models.ForeignKey(BookingChannel, on_delete=models.PROTECT, blank=True, null=True)
    source_uid = models.CharField(
        _("channel UID"), max_length=256, null=True, blank=True, help_text=_("UID on source channel")
    )
    begin_date = models.DateField(
        _("begin date"),
    )
    end_date = models.DateField(
        _("end date"),
    )
    duration = models.PositiveSmallIntegerField(
        _("duration"),
    )
    adults = models.PositiveSmallIntegerField(_("adults"), default=1)
    children = models.PositiveSmallIntegerField(_("children"), default=0)
    babies = models.PositiveSmallIntegerField(_("babies"), default=0)
    catering = models.CharField(_("catering"), choices=Catering.choices, default=Catering.NONE, max_length=20)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    price = models.DecimalField(
        _("price"),
        max_digits=20,
        decimal_places=2,
        help_text=_("Total price, either computed by daily price or applying flat rate"),
    )
    is_flat_rate = models.BooleanField(
        _("flat rate?"), default=False, help_text=_("Use flat rate price instead of daily price computation if true")
    )
    deposit = models.DecimalField(_("deposit"), max_digits=20, decimal_places=2, blank=True, null=True)
    guaranty = models.DecimalField(_("guaranty"), max_digits=20, decimal_places=2, blank=True, null=True)
    commission_fees = models.DecimalField(_("commission fees"), max_digits=20, decimal_places=2, blank=True, null=True)

    arrival_details = models.CharField(
        _("arrival details"), max_length=100, blank=True, null=True, help_text=_("Arrival time, flight number, etc...")
    )
    notes = models.TextField(_("Notes"), blank=True, null=True)
    options = models.ManyToManyField(Service, through="BookedService")
    cancelled = models.BooleanField(_("cancelled"), default=False, help_text=_("True if this booking was cancelled"))
    deleted = models.BooleanField(_("deleted"), default=False, help_text=_("True if this booking was deleted"))

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Booking")
        ordering = ("-begin_date",)
        permissions = [
            ("view_prices", "Can view prices informations"),
        ]

    objects = ForUserQuerySet.as_manager()
    _account_qs_path = "lodging__property__account"
    _property_qs_path = "lodging__property"

    def __str__(self):
        return "%s (%s: %s -> %s)" % (
            self.guest_name,
            self.lodging and self.lodging.name or "--",
            self.begin_date,
            self.end_date,
        )

    @property
    def price_with_options(self):
        total = self.price
        if self.id:
            # this is a real db instance, we can follow relations
            for option in self.bookedservice_set.filter(service__not_included_in_price=False):
                if option.unit_price:
                    total += option.unit_price * (option.is_flat_rate and 1 or self.duration)
        return total

    @property
    def total_payments(self):
        """Returns the sum of the payments already made."""
        return self.payment_set.aggregate(total_payments=Sum("amount"))["total_payments"] or 0

    @property
    def left_to_pay(self):
        """Returns the left to pay, with options included in price, but not excluded options."""
        return self.price_with_options - self.total_payments - (self.commission_fees or 0)

    def get_absolute_url(self):
        return reverse("booking-detail", kwargs={"pk": self.pk})

    def generate_contract(self, url_server="http://127.0.0.1:8000", save=True):
        if not self.lodging:
            logger.warning("Lodging not set, can't generate a contract")
            return None
        if not Contract.objects.filter(booking=self).exists():
            self.contract = Contract(booking=self)
        if self.lodging.contract_template:
            from core.jinja2_tools import render_template

            signature_img = (
                self.lodging.property.signature
                and (
                    '<img style="max-width: 200px; max-height: 100px" '
                    'src="%s" alt="Signature"' % (url_server + self.lodging.property.signature.url)
                )
                or ""
            )

            page_break = '<div style="display: block; page-break-before: always;"></div>'
            content = render_template(
                self.lodging.contract_template.content,
                {
                    "booking": self,
                    "lodging": self.lodging,
                    "property": self.lodging.property,
                    "options": self.id and list(self.bookedservice_set.all()) or [],
                    "included_options": self.id
                    and self.bookedservice_set.filter(service__not_included_in_price=False)
                    or [],
                    "third_party_options": self.id
                    and self.bookedservice_set.filter(service__not_included_in_price=True)
                    or [],
                    "url_server": url_server,
                    "date": date.today(),
                    "signature": signature_img,
                    "page_break": page_break,
                },
            )
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
    return os.path.join(settings.MEDIA_ROOT, "contracts")


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

    _account_qs_path = "booking__lodging__property__account"
    _property_qs_path = "booking__lodging__property"
    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return "%s (%s -> %s)" % (self.booking.guest_name, self.booking.begin_date, self.booking.end_date)

    def make_pdf_path(self):
        def multiple_replace(string, rep_dict: dict):
            k: str
            pattern = re.compile(
                "|".join([re.escape(k) for k in sorted(rep_dict.keys(), key=len, reverse=True)]), flags=re.DOTALL
            )
            return pattern.sub(lambda x: rep_dict[x.group(0)], string)

        return os.path.join(
            "contracts",
            str(self.booking.lodging.uid),
            "%s_%s.pdf"
            % (
                self.booking.begin_date.isoformat(),
                multiple_replace(
                    self.booking.guest_name,
                    {
                        " ": "_",
                        ",": "_",
                        ";": "_",
                    },
                ),
            ),
        )


class ContractTemplate(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    name = models.CharField(max_length=100)
    content = models.TextField(_("Contract"))
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Contract template")

    _account_qs_path = "account"

    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return self.name


class BookedService(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    unit_price = models.DecimalField(_("unit price VAT incl."), max_digits=20, decimal_places=2, blank=True, null=True)
    is_flat_rate = models.BooleanField(
        _("flat rate?"), default=False, help_text=_("Use flat rate price instead of daily price computation")
    )

    class Meta:
        verbose_name = _("Booking service")
    _account_qs_path = "service__account"

    def __str__(self):
        return "%s -> %s" % (self.service.designation, self.booking)

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        if self.booking.lodging.property.account.id != self.service.account.id:
            raise ValidationError("BookingService: booking and service aren't from same account")
        super().save(force_insert, force_update, using, update_fields)


class Holidays(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    name = models.CharField(_("name"), max_length=256)
    begin_date = models.DateField(
        _("begin date"),
    )
    end_date = models.DateField(
        _("end date"),
    )

    class Meta:
        verbose_name_plural = _("holidays")

    _account_qs_path = "account"

    objects = ForUserQuerySet.as_manager()


class Pricing(models.Model):  # or RatePlan
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    name = models.CharField(_("name"), max_length=256)
    daily_rate = models.DecimalField(_("daily rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    weekend_rate = models.DecimalField(_("weekend rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    weekly_rate = models.DecimalField(_("weekly rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    minimum_stay = models.PositiveSmallIntegerField(_("Minimum stay"))
    included_guests = models.PositiveSmallIntegerField(_("Number of guests included in the price"))
    supplement_per_additional_guest = models.PositiveSmallIntegerField(
        _("Supplement per night and per additional guest")
    )
    info = models.TextField(_("info"), blank=True, null=True)

    _account_qs_path = "account"

    objects = ForUserQuerySet.as_manager()


class SeasonalVariation(models.Model):
    pricing = models.ForeignKey(Pricing, on_delete=models.CASCADE)
    name = models.CharField(_("name"), max_length=256)
    begin_date = models.DateField(
        _("begin date"),
    )
    end_date = models.DateField(
        _("end date"),
    )
    daily_rate = models.DecimalField(_("daily rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    weekend_rate = models.DecimalField(_("weekend rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    weekly_rate = models.DecimalField(_("weekly rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    minimum_stay = models.PositiveSmallIntegerField(_("Minimum stay"))

    _account_qs_path = "pricing__account"
    objects = ForUserQuerySet.as_manager()


class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", _("Cash")
        BANK_CARD = "bank_card", _("Bank card")
        CHECK = "check", _("Check")
        TRANSFER = "transfer", _("Transfer")
        PAYPAL = "paypal", _("PayPal")
        HOLIDAY_VOUCHERS = "vouchers", _("Holiday vouchers")
        OTHER = "other", _("Other")

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    description = models.CharField(_("description"), max_length=255)
    amount = models.DecimalField(_("amount"), max_digits=20, decimal_places=2)
    method = models.CharField(_("Payment method"), max_length=30, choices=PaymentMethod.choices)
    date = models.DateField(_("Payment date"))
    checked = models.BooleanField("Checked", default=False, help_text=_("Used for account reconciliation"))

    class Meta:
        ordering = ["date"]
        permissions = [
            ("reconciliation", "Can do account reconciliation"),
        ]

    _account_qs_path = "booking__lodging__property__account"
    _property_qs_path = "booking__lodging__property"
    objects = ForUserQuerySet.as_manager()


class Comment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_on = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_on"]

    _account_qs_path = "booking__lodging__property__account"
    _property_qs_path = "booking__lodging__property"
    objects = ForUserQuerySet.as_manager()
