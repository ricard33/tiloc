import random

import factory
import arrow
from django.contrib.auth import get_user_model

from core import models


class UserFactory(factory.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.Faker('email')
    email = factory.Faker('email')


class AdminFactory(UserFactory):
    is_superuser = True


class OwnerFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.Owner

    name = factory.Faker('name')
    email = factory.Faker('email')
    no_vat = False


class LodgingFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.Lodging

    name = factory.Faker('name')
    owner = factory.SubFactory(OwnerFactory)
    rank = factory.Sequence(lambda n: n)
    address = factory.Faker("address")
    daily_rate = 50


class BookingChannelFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.BookingChannel

    name = factory.Faker('name')


class BookingChannelSyncFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.BookingChannelSync

    channel = factory.SubFactory(BookingChannelFactory)
    lodging = factory.SubFactory(LodgingFactory)
    source_url = factory.Faker('uri')


class BookingStatusFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.BookingStatus

    name = factory.Sequence(lambda n: ['option', 'contract sent', 'deposit paid', 'paid'][n % 4])
    color = factory.Faker('color')
    rank = factory.Sequence(lambda n: n)


class BookingFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.Booking

    lodging = factory.SubFactory(LodgingFactory)
    guest_name = factory.Faker("name")
    guest_contact = factory.Faker("email")
    guest_address = factory.Faker("address")
    status = factory.LazyFunction(lambda: models.BookingStatus.objects.first())
    begin_date = factory.Faker('date_between', start_date='-1y', end_date='+1y')
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=random.randint(7, 21)).date())
    duration = factory.LazyAttribute(lambda b: (b.end_date - b.begin_date).days)
    daily_rate = factory.LazyAttribute(lambda b: b.lodging.daily_rate)
    price = factory.LazyAttribute(lambda b: b.daily_rate * b.duration)
