import random

import arrow
import factory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission

from core import models


class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Account
        django_get_or_create = ("name",)

    name = "default"


class InactiveAccount(AccountFactory):
    name = "deleted-account"
    is_active = False


class GroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Group
        django_get_or_create = ("name",)

    name = "default"


def get_or_create_group(name):
    """Returns the XXX Group"""
    try:
        group_obj = Group.objects.get_or_create(name__iexact=name)
    except Group.DoesNotExist:
        group_obj = Group.objects.create(name=name)
        group_obj.permissions.add(
            Permission.objects.get(codename="change_user"),
            Permission.objects.get(codename="delete_user"),
        )
    return group_obj


class _UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()
        django_get_or_create = ("email",)

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    password = factory.django.Password("P@55w0rd")
    account = factory.SubFactory(AccountFactory)


class SuperUserFactory(_UserFactory):
    is_superuser = True
    is_staff = True


class AdminUserFactory(_UserFactory):
    """Create an administrator for an account"""

    @factory.post_generation
    def add_to_group(self, create, extracted, **kwargs):
        self.groups.add(Group.objects.get(name__iexact="administrator"))


class StandardUserFactory(_UserFactory):
    """Create an administrator for an account"""

    @factory.post_generation
    def add_to_group(self, create, extracted, **kwargs):
        self.groups.add(Group.objects.get(name__iexact="standard"))


class PropertyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Property
        django_get_or_create = ("name",)

    account = factory.SubFactory(AccountFactory)
    name = factory.Faker("name")
    email = factory.Faker("email")
    no_vat = False
    signature = factory.django.ImageField()


class LodgingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Lodging
        django_get_or_create = ("property", "name",)

    name = factory.Faker("name")
    property = factory.SubFactory(PropertyFactory)
    rank = factory.Sequence(lambda n: n)
    address = factory.Faker("address")
    daily_rate = 50

    description = """<strong>Capacity:</strong> 4 adults</br>
    <strong>Lodging type:</strong> Bungalow</br>
    ..."""


class BookingChannelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingChannel
        django_get_or_create = (
            "account",
            "name",
        )

    account = factory.SubFactory(AccountFactory)
    name = factory.Iterator(["web site", "booking.com", "airbnb", "abritel", "facebook", "instagram", "already come", "tripadvisor"])


class BookingChannelSyncFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingChannelSync

    channel = factory.SubFactory(BookingChannelFactory)
    lodging = factory.SubFactory(LodgingFactory)
    source_url = factory.Faker("uri")


class BookingStatusFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingStatus
        django_get_or_create = (
            "account",
            "name",
        )

    account = factory.SubFactory(AccountFactory)
    name = factory.Iterator(["option", "contract sent", "deposit paid", "paid"])
    color = factory.Faker("color")
    rank = factory.Sequence(lambda n: n)


class BookingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Booking

    lodging = factory.SubFactory(LodgingFactory)
    guest_name = factory.Faker("name")
    guest_contact = factory.Faker("email")
    guest_address = factory.Faker("address")
    status = factory.SubFactory(
        BookingStatusFactory, name="option", account=factory.SelfAttribute("..lodging.property.account")
    )
    begin_date = factory.Faker("date_between", start_date="-5d", end_date="+1y")
    duration = factory.LazyAttribute(lambda b: random.randint(7, 21))
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=b.duration).date())
    daily_rate = factory.LazyAttribute(lambda b: b.lodging and b.lodging.daily_rate or 50)
    price = factory.LazyAttribute(lambda b: b.daily_rate * b.duration)


class ContractTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.ContractTemplate

    account = factory.SubFactory(AccountFactory)
    name = factory.Sequence(lambda n: "template %d" % n)
    content = "{{ lodging.name }}: from {{ booking.begin_date }} to {{ booking.end_date }}..."


class ContractFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Contract

    booking = factory.SubFactory(BookingFactory)
    content = ""


class ServiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Service
        django_get_or_create = ["reference"]

    account = factory.SubFactory(AccountFactory)
    reference = factory.Sequence(lambda n: "REF%d" % n)
    designation = factory.Sequence(lambda n: "Service no %d" % n)


class BookedServiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookedService

    booking = factory.SubFactory(BookingFactory)
    service = factory.SubFactory(ServiceFactory)
    unit_price = factory.LazyAttribute(lambda bs: bs.service.unit_price)
    is_flat_rate = factory.LazyAttribute(lambda bs: bs.service.is_flat_rate)


class BookingWithServiceFactory(BookingFactory):
    service0 = factory.RelatedFactory(BookedServiceFactory, factory_related_name="booking")


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Payment

    booking = factory.SubFactory(BookingFactory)
    description = "Solde"
    amount = 150.0
    method = models.Payment.PaymentMethod.TRANSFER
    date = factory.Faker("date")


class HolidaysFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Holidays

    account = factory.SubFactory(AccountFactory)
    name = factory.Sequence(lambda n: "Holidays %d" % n)
    begin_date = factory.Faker("date_between", start_date="-5d", end_date="+1y")
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=random.randint(7, 21)).date())


class PricingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Pricing

    account = factory.SubFactory(AccountFactory)
    name = factory.Sequence(lambda n: "Price %d" % n)
    daily_rate = factory.LazyAttribute(lambda x: random.choice([40, 50, 60, 70]))
    weekend_rate = factory.LazyAttribute(lambda x: x.daily_rate * 0.25)
    weekly_rate = factory.LazyAttribute(lambda x: x.daily_rate * 7)
    minimum_stay = 7
    included_guests = 4
    supplement_per_additional_guest = 5.0


class SeasonalVariationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.SeasonalVariation

    pricing = factory.SubFactory(PricingFactory)
    name = factory.Sequence(lambda n: "Holidays %d" % n)
    begin_date = factory.Faker("date_between", start_date="-5d", end_date="+1y")
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=random.randint(7, 21)).date())
    daily_rate = factory.LazyAttribute(lambda x: random.choice([40, 50, 60, 70]))
    weekend_rate = factory.LazyAttribute(lambda x: x.daily_rate * 0.25)
    weekly_rate = factory.LazyAttribute(lambda x: x.daily_rate * 7)
    minimum_stay = 7
