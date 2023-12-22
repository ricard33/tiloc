import logging
import os
import re
import uuid
from random import choice

import arrow
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
from timezone_field import TimeZoneField

logger = logging.getLogger("models")

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
        lodging_path = getattr(self.model, "_lodging_qs_path", None)

        account_query = lodging_query = user_query = Q(**{})
        # account_path = self.account_path or (self.user_path and self.user_path + "__account" or None)
        if account_path and hasattr(user, "account"):
            account_query = Q(**{account_path: user.account, account_path + "__is_active": True}) | Q(
                **{account_path + "__isnull": True}
            )

        if lodging_path and not user.has_perm("core.administrator"):
            lodging_query |= Q(**{lodging_path + "__in": user.owned_lodgings.all()})  # lodging is owned by user
            lodging_query |= Q(**{lodging_path + "__in": user.lodgings.all()})  # lodging can be accessed by user
        if user_path:
            user_query = Q(**{user_path: user})

        return self.filter(account_query & (lodging_query | user_query)).distinct()


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return "owner_{0}/{1}".format(instance.id, filename)


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


def generate_account_id():
    alphabet = [chr(i) for i in range(48, 58)]
    while True:
        account_id = ""
        for i in range(6):
            if not account_id:
                account_id += choice(alphabet[1:])  # don't start with 0
            else:
                account_id += choice(alphabet)
        if not Account.objects.filter(name=account_id).exists():
            break
    return account_id


class Account(models.Model):
    class DepositOrDownPayment(models.TextChoices):
        DEPOSIT = "deposit", _("Deposit")
        DOWN_PAYMENT = "down_payment", _("Down payment")

    class InvoiceLabel(models.TextChoices):
        INVOICE = "invoice", _("Invoice")
        NOTE = "note", _("Note")
        RECEIPT = "receipt", _("Receipt")
        QUITTANCE = "quittance", _("Quittance")

    name = models.CharField(
        _("name"),
        max_length=200,
        unique=True,
        default=generate_account_id,
        help_text=_("Internal name, should be unique"),
    )
    invoice_label = models.CharField(
        _("invoice label"), max_length=30, choices=InvoiceLabel.choices, default=InvoiceLabel.RECEIPT
    )
    deposit_label = models.CharField(
        _("deposit or down payment"),
        max_length=30,
        choices=DepositOrDownPayment.choices,
        default=DepositOrDownPayment.DEPOSIT,
    )
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True, unique=True)

    class Meta:
        permissions = (("administrator", "Can administer all account data"),)

    objects = AccountQuerySet.as_manager()

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.name,)

    @property
    def current_subscription(self):
        return (
            self.subscription_set.filter(
                status__in=[Subscription.Status.active.value, Subscription.Status.trialing.value],
                current_period_start__lte=arrow.utcnow().datetime,
            )
            .order_by("-current_period_end")
            .first()
        )

    @property
    def validity(self):
        current_subscription = self.current_subscription
        if current_subscription:
            return current_subscription.current_period_end
        return None

    @property
    def current_plan(self):
        current_subscription = self.current_subscription
        if current_subscription:
            return current_subscription.plan
        return None

    @property
    def trial_is_over(self):
        return self.validity and self.validity < arrow.utcnow().datetime or self.current_plan is None

    @property
    def is_free_plan(self):
        return self.current_plan is None or self.current_plan.ref == "FREE"

    @property
    def is_trial_period(self):
        return not self.is_free_plan and self.current_subscription.status == Subscription.Status.trialing.value

    @property
    def max_lodgings(self):
        return self.trial_is_over and 1 or self.current_plan.max_lodgings

    @property
    def max_users(self):
        return self.trial_is_over and 1 or self.current_plan.max_users

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
        Payment.objects.filter(booking__lodging__account=self).delete()
        Contract.objects.filter(booking__lodging__account=self).delete()
        BookedService.objects.filter(booking__lodging__account=self).delete()
        Booking.objects.filter(lodging__account=self).delete()
        BookingChannelSync.objects.filter(lodging__account=self).delete()
        Lodging.objects.filter(account=self).delete()
        ContractTemplate.objects.filter(account=self).delete()
        Service.objects.filter(account=self).delete()
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
    phone = models.CharField(_("phone"), max_length=50, blank=True, null=True)
    address = models.TextField(_("address"), blank=True, null=True)
    lodgings = models.ManyToManyField(
        "Lodging",
        verbose_name=_("lodgings"),
        blank=True,
        help_text=_("The lodgings this user has access."),
        related_name="users",
        related_query_name="user",
    )
    tz = TimeZoneField(default="America/Martinique")

    # Contracts and billing details
    legal = models.TextField(_("legal mention"), blank=True, null=True, help_text=_("Legal mention on bills"))
    payment = models.TextField(_("payment"), blank=True, null=True, help_text=_("Payment information"))
    billing = models.TextField(_("billing"), blank=True, null=True, help_text=_("Billing conditions"))
    no_vat = models.BooleanField(_("no vat"), default=True)
    vat_rate = models.DecimalField(_("vat rate"), max_digits=20, decimal_places=2, blank=True, null=True)
    logo = models.ImageField(_("logo"), upload_to=user_directory_path, blank=True, null=True)
    signature = models.ImageField(_("signature"), upload_to=user_directory_path, blank=True, null=True)
    verified = models.BooleanField(
        _("verified"), default=False, help_text=_("Define if email user has been verified or not")
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


class Lodging(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_("owner"),
        related_name="owned_lodgings",
        related_query_name="owned_lodging",
    )
    active = models.BooleanField(_("active"), default=True)
    shown = models.BooleanField(_("shown"), default=True)
    name = models.CharField(_("name"), max_length=200)
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
    balance_due_date = models.IntegerField(
        _("due date for balance (in days)"),
        default=0,
        help_text=_("When the balance should be paid (in days before arrival)"),
    )
    guaranty = models.DecimalField(_("guaranty deposit"), max_digits=20, decimal_places=2, null=True, blank=True)
    capacity = models.IntegerField(_("capacity"), null=True, blank=True)
    information = models.TextField(_("information"), blank=True)
    is_flat_rate_tourist_tax = models.BooleanField(_("flat rate tourist tax"), default=True)
    tourist_tax_included_in_payment = models.BooleanField(
        _("tourist tax included in payment"), default=True, help_text="An hidden feature for internal use only"
    )
    max_daily_tourist_tax = models.DecimalField(
        _("max daily tourist tax"), max_digits=20, decimal_places=2, null=True, blank=True
    )
    tourist_tax_rate = models.DecimalField(
        _("tourist tax rate"), max_digits=10, decimal_places=2, null=True, blank=True
    )

    contract_template = models.ForeignKey("ContractTemplate", on_delete=models.PROTECT, null=True, blank=True)
    description = models.TextField(_("description"), blank=True, help_text=_("Used by contracts generation"))
    default_services = models.ManyToManyField(
        "Service", blank=True, help_text=_("Services added by default on new bookings")
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Lodging")
        ordering = ["rank"]
        unique_together = ["account", "name"]

    objects = ForUserQuerySet.as_manager()
    _account_qs_path = "account"
    _lodging_qs_path = "pk"

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.name,) + self.account.natural_key()

    natural_key.dependencies = ["core.account"]


class Service(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"))
    reference = models.CharField(_("reference"), max_length=20)
    designation = models.CharField(_("designation"), max_length=256)
    unit_price = models.DecimalField(_("unit price VAT incl."), max_digits=20, decimal_places=2, blank=True, null=True)
    vat = models.DecimalField(_("VAT %"), max_digits=20, decimal_places=2, blank=True, null=True)
    is_flat_rate = models.BooleanField(
        _("flat rate?"), default=False, help_text=_("Use flat rate price instead of daily price computation")
    )
    not_included_in_price = models.BooleanField(
        _("not included in price"),
        default=False,
        help_text=_("Service not included in current booking price. Maybe provided by external partner..."),
    )
    # auto_add_booking = models.BooleanField(_("auto add booking"), default=False)
    # auto_add_invoice = models.BooleanField(_("auto add invoice"), default=False)

    class Meta:
        verbose_name = _("Service")
        ordering = ("reference",)
        unique_together = ("account", "reference")

    _account_qs_path = "account"

    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return "[%s] %s" % (self.reference, self.designation)


class BookingStatus(models.TextChoices):
    NotAvailable = "not available", _("Not available")
    Option = "option", _("Option")
    ContractSent = "contract sent", _("Contract sent")
    DepositPaid = "deposit paid", _("Deposit paid")
    PaymentOnArrival = "payment on arrival", _("Payment on arrival")
    Paid = "paid", _("Paid")
    External = "external", _("External")


# ignored from statistics
status_no_stats = map(lambda x: x.value, [BookingStatus.NotAvailable])
# booking is finalized and considered as real
status_finalized = map(lambda x: x.value, [BookingStatus.Paid, BookingStatus.External])


class BookingChannel(models.Model):
    """Where does the booking come from, for reports"""

    account = models.ForeignKey(Account, on_delete=models.CASCADE, verbose_name=_("account"), null=True, blank=True)
    name = models.CharField(_("name"), max_length=100)

    class Meta:
        verbose_name = _("Booking channel")
        verbose_name_plural = _("Booking channels")
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

    _account_qs_path = "lodging__account"
    _lodging_qs_path = "lodging"
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
    status = models.TextField(
        _("status"), choices=BookingStatus.choices, default=BookingStatus.NotAvailable, max_length=20
    )
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
    custom_tourist_tax = models.DecimalField(
        _("personalized tourist tax"),
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="overwrite automated tourist tax",
    )

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
    _account_qs_path = "lodging__account"
    _lodging_qs_path = "lodging"

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
    def price_with_options_and_taxes(self):
        return self.price_with_options + (self.lodging.tourist_tax_included_in_payment and self.tourist_tax or 0)

    @property
    def total_payments(self):
        """Returns the sum of the payments already made."""
        return self.payment_set.aggregate(total_payments=Sum("amount"))["total_payments"] or 0

    @property
    def left_to_pay(self):
        """Returns the left to pay, with options included in price, but not excluded options."""
        return (
            self.price_with_options
            + (self.lodging.tourist_tax_included_in_payment and self.tourist_tax or 0)
            - self.total_payments
            - (self.commission_fees or 0)
        )

    @property
    def tourist_tax(self):
        if self.custom_tourist_tax is not None:
            return self.custom_tourist_tax
        return self.computed_tourist_tax()

    @property
    def daily_tourist_tax_per_adult(self):
        if self.adults > 0:
            return self.tourist_tax / self.duration / self.adults
        return 0

    @property
    def guests(self):
        return self.adults + self.children + self.babies

    def computed_tourist_tax(self):
        if self.lodging.is_flat_rate_tourist_tax:
            daily_rate = self.lodging.max_daily_tourist_tax or 0
        elif self.adults + self.children + self.babies > 0:
            daily_rate = round(
                self.price
                / self.duration
                / (self.adults + self.children + self.babies)
                * self.lodging.tourist_tax_rate
                / 100,
                2,
            )
            daily_rate = min(daily_rate, self.lodging.max_daily_tourist_tax)
        else:
            daily_rate = 0
        return daily_rate * self.duration * self.adults

    def get_absolute_url(self):
        return reverse("booking-detail", kwargs={"pk": self.pk})


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

    _account_qs_path = "booking__lodging__account"
    _lodging_qs_path = "booking__lodging"
    objects = ForUserQuerySet.as_manager()

    def __str__(self):
        return "%s (%s -> %s)" % (self.booking.guest_name, self.booking.begin_date, self.booking.end_date)

    def make_pdf_path(self):
        def multiple_replace(string, rep_dict: dict):
            k: str  # noqa: F842
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
        if self.booking.lodging.account.id != self.service.account.id:
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

    _account_qs_path = "booking__lodging__account"
    _lodging_qs_path = "booking__lodging"
    objects = ForUserQuerySet.as_manager()


class Comment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_on = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_on"]

    _account_qs_path = "booking__lodging__account"
    _lodging_qs_path = "booking__lodging"
    objects = ForUserQuerySet.as_manager()


class Intervals(models.TextChoices):
    Monthly = "monthly", _("Monthly")
    Yearly = "yearly", _("Yearly")


class Plan(models.Model):
    ref = models.CharField(max_length=20, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    lookup_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    price = models.PositiveSmallIntegerField()
    interval = models.CharField(max_length=10, choices=Intervals.choices)
    max_lodgings = models.PositiveSmallIntegerField(null=True, blank=True)
    max_users = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    class Status(models.TextChoices):
        active = "active", "active"
        past_due = "past_due", "past_due"
        unpaid = "unpaid", "unpaid"
        canceled = "canceled", "canceled"
        incomplete = "incomplete", "incomplete"
        incomplete_expired = "incomplete_expired", "incomplete_expired"
        trialing = "trialing", "trialing"
        paused = "paused", "paused"

    id = models.CharField(max_length=255, primary_key=True)
    customer = models.ForeignKey(Account, to_field="stripe_customer_id", on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.DO_NOTHING, to_field="lookup_key")
    created = models.DateTimeField(auto_now_add=True)
    start_date = models.DateTimeField()
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    status = models.CharField(max_length=50, choices=Status.choices)
    latest_invoice = models.CharField(max_length=255, null=True, blank=True)
    default_payment_method = models.CharField(max_length=255, null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)

    _account_qs_path = "customer"

    def __str__(self):
        return "%s -> %s" % (self.customer, self.plan)

    @property
    def _base_stripe_url(self):
        if settings.STRIPE_TEST_MODE:
            return "https://dashboard.stripe.com/test/"
        return "https://dashboard.stripe.com/"

    @property
    def subscription_url(self):
        return self._base_stripe_url + "invoices/" + self.latest_invoice

    @property
    def latest_invoice_url(self):
        return self._base_stripe_url + "invoices/" + self.latest_invoice

    @property
    def customer_dashboard_url(self):
        return settings.STRIPE_CUSTOMER_DASHBOARD_URL  # + "?prefilled_email=" + self.customer.


class Invoice(models.Model):
    class Status(models.TextChoices):
        draft = "draft", "draft"
        open = "open", "open"
        paid = "paid", "paid"
        uncollectible = "uncollectible", "uncollectible"
        void = "void", "void"

    id = models.CharField(max_length=255, primary_key=True)
    customer = models.ForeignKey(Account, to_field="stripe_customer_id", on_delete=models.CASCADE)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices)
    hosted_invoice_url = models.URLField(null=True, blank=True)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    next_payment_attempt = models.DateTimeField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    _account_qs_path = "customer"


class SyncRemovedByExternal(models.Model):
    sync = models.ForeignKey(BookingChannelSync, on_delete=models.CASCADE, related_name="+")
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="+")
    date = models.DateTimeField(auto_now_add=True)
    see_count = models.IntegerField(default=1)

    class Meta:
        unique_together = ("sync", "booking")


class Activity(models.Model):
    """Log all changes made on bookings"""

    class ActivityType(models.TextChoices):
        add_booking = "add_booking", _("Add booking")
        modify_booking = "modify_booking", _("Modify booking")
        delete_booking = "delete_booking", _("Delete booking")
        cancel_booking = "cancel_booking", _("Cancel booking")
        uncancel_booking = "uncancel_booking", _("Uncancel booking")
        add_comment = "add_comment", _("Add comment")
        modify_comment = "modify_comment", _("Modify comment")
        delete_comment = "delete_comment", _("Delete comment")

    id = models.BigAutoField(primary_key=True, verbose_name="ID")
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(choices=ActivityType.choices, max_length=50, verbose_name="Activity type")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="+")
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="+")

    class Meta:
        verbose_name = _("Activity")
        verbose_name_plural = _("Activities")
        ordering = ("-date",)

    objects = ForUserQuerySet.as_manager()
    _account_qs_path = "booking__lodging__account"
    _lodging_qs_path = "booking__lodging"


# class AddOn(models.Model):
#     """Additional functionalities (marketplace)"""
#     name = models.CharField(max_length=255)
#
#     class Meta:
#         abstract = True
#
#
