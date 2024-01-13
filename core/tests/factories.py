import datetime
import random

import arrow
import factory
import factory.fuzzy
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.db.models import signals

from core import models


class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Plan
        # django_get_or_create = ("ref",)

    ref = factory.Sequence(lambda n: "PLAN_%d" % n)
    name = "default"
    max_lodgings = 10
    max_users = 10
    price = 10
    interval = "monthly"
    lookup_key = factory.LazyAttribute(lambda p: p.ref.lower() + "-" + p.interval)


class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Subscription
        django_get_or_create = ("customer",)  # to avoid multiple creation by factory.RelatedFactory()

    id = factory.Sequence(lambda n: "pk_sub_%d" % n)
    plan = factory.SubFactory(PlanFactory)
    customer = factory.SubFactory("core.tests.factories.SubscriptionFactory", subscription_set=None)
    start_date = factory.Faker("date_time_between", start_date="-20d", end_date="-2d", tzinfo=datetime.UTC)
    current_period_start = factory.LazyAttribute(lambda b: b.start_date)
    current_period_end = factory.LazyAttribute(
        lambda b: arrow.get(b.current_period_start)
        .shift(months=(b.plan.interval == "monthly" and 1 or 0), years=(b.plan.interval == "yearly" and 1 or 0))
        .datetime
    )
    # status=factory.fuzzy.FuzzyChoice(models.Subscription.Status, getter=lambda c: c)
    status = "active"


class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Account
        django_get_or_create = ("name",)

    name = "default"
    stripe_customer_id = factory.Sequence(lambda n: "pk_customer_%d" % n)
    subscription_set = factory.RelatedFactory(SubscriptionFactory, factory_related_name="customer")


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
        django_get_or_create = (
            "account",
            "email",
        )

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    password = factory.django.Password("P@55w0rd")
    phone = factory.Faker("phone_number")
    address = factory.Faker("address")
    account = factory.SubFactory(AccountFactory)
    no_vat = False
    signature = factory.django.ImageField()
    verified = True


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


class LodgingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Lodging
        django_get_or_create = (
            "account",
            "name",
        )

    name = factory.Faker("name")
    account = factory.SubFactory(AccountFactory)
    owner = factory.SubFactory(StandardUserFactory)
    rank = factory.Sequence(lambda n: n)
    address = factory.Faker("address")
    capacity = 4
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

    account = None  # factory.SubFactory(AccountFactory)
    name = factory.Iterator(
        ["web site", "booking.com", "airbnb", "abritel", "facebook", "instagram", "already come", "tripadvisor"]
    )


class BookingChannelSyncFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingChannelSync

    channel = factory.SubFactory(BookingChannelFactory)
    lodging = factory.SubFactory(LodgingFactory)
    source_url = factory.Faker("uri")


@factory.django.mute_signals(signals.pre_save, signals.post_save)
class BookingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Booking

    guest_name = factory.Faker("name")
    guest_contact = factory.Faker("email")
    guest_address = factory.Faker("address")
    status = "option"
    begin_date = factory.Faker("date_between", start_date="-5d", end_date="+1y")
    duration = factory.LazyAttribute(lambda b: random.randint(7, 21))
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=b.duration).date())
    daily_rate = 0  # factory.LazyAttribute(lambda b: b.lodgings.first() and b.lodgings.first().daily_rate or 50)
    price = 0  # factory.LazyAttribute(lambda b: b.daily_rate * b.duration)

    @factory.post_generation
    def lodgings(self, create, extracted, **kwargs):
        if not create:
            # Simple build, or nothing to add, do nothing.
            return

        if extracted:
            # Add the iterable of lodgings using bulk addition
            if isinstance(extracted, (tuple, list)):
                self.lodgings.add(*extracted)
            else:
                self.lodgings.add(extracted)
        else:
            self.lodgings.add(LodgingFactory.create(**kwargs))

    @factory.post_generation
    def daily_rates_and_price(self, create, extracted, **kwargs):
        update_fields = []
        if not self.daily_rate:
            self.daily_rate = self.lodgings.first() and self.lodgings.first().daily_rate or 50
            update_fields.append("daily_rate")
        if not self.price:
            self.price = self.daily_rate * self.duration
            update_fields.append("price")
        if update_fields:
            self.save(update_fields=update_fields)

    @factory.post_generation
    def adults(self, create, extracted, **kwargs):
        if not self.guests_distribution:
            self.guests_distribution = {}
        if extracted:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["adults"] = extracted
        else:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["adults"] = 1

    @factory.post_generation
    def children(self, create, extracted, **kwargs):
        if not self.guests_distribution:
            self.guests_distribution = {}
        if extracted:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["children"] = extracted
        else:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["children"] = 0

    @factory.post_generation
    def babies(self, create, extracted, **kwargs):
        if not self.guests_distribution:
            self.guests_distribution = {}
        if extracted:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["babies"] = extracted
        else:
            self.guests_distribution.setdefault(self.lodgings.first().id, {})["babies"] = 0


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
        django_get_or_create = ["account", "reference"]

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
