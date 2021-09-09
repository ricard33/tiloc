import random

import arrow
import factory
from django.contrib.auth import get_user_model

from core import models


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.Faker('email')
    email = factory.Faker('email')


class AdminFactory(UserFactory):
    is_superuser = True


class OwnerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Owner

    name = factory.Faker('name')
    email = factory.Faker('email')
    no_vat = False
    signature = factory.django.ImageField()


class LodgingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Lodging

    name = factory.Faker('name')
    owner = factory.SubFactory(OwnerFactory)
    rank = factory.Sequence(lambda n: n)
    address = factory.Faker("address")
    daily_rate = 50

    description = """<strong>Capacity:</strong> 4 adults</br>
    <strong>Lodging type:</strong> Bungalow</br>
    ..."""


class BookingChannelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingChannel

    name = factory.Faker('name')


class BookingChannelSyncFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingChannelSync

    channel = factory.SubFactory(BookingChannelFactory)
    lodging = factory.SubFactory(LodgingFactory)
    source_url = factory.Faker('uri')


class BookingStatusFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.BookingStatus

    name = factory.Iterator(['option', 'contract sent', 'deposit paid', 'paid'])
    color = factory.Faker('color')
    rank = factory.Sequence(lambda n: n)


class BookingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Booking

    lodging = factory.SubFactory(LodgingFactory)
    guest_name = factory.Faker("name")
    guest_contact = factory.Faker("email")
    guest_address = factory.Faker("address")
    status = factory.LazyFunction(lambda: models.BookingStatus.objects.first())
    begin_date = factory.Faker('date_between', start_date='-5d', end_date='+1y')
    duration = factory.LazyAttribute(lambda b: random.randint(7, 21))
    end_date = factory.LazyAttribute(lambda b: arrow.get(b.begin_date).shift(days=b.duration).date())
    daily_rate = factory.LazyAttribute(lambda b: b.lodging and b.lodging.daily_rate or 50)
    price = factory.LazyAttribute(lambda b: b.daily_rate * b.duration)


class ContractTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.ContractTemplate

    name = factory.Sequence(lambda n: "template %d" % n)
    content = "{{ lodging.name }}: from {{ booking.begin_date }} to {{ booking.end_date }}..."


class ContractFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Contract

    booking = factory.SubFactory(BookingFactory)
    content = ""


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Category
        django_get_or_create = ['name']

    name = factory.Sequence(lambda n: "Cat %d" % (n % 3))


class ServiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Service
        django_get_or_create = ['reference']

    category = factory.SubFactory(CategoryFactory)
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
    service0 = factory.RelatedFactory(
        BookedServiceFactory,
        factory_related_name='booking'
    )


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Payment

    booking = factory.SubFactory(BookingFactory)
    description = "Solde"
    amount = 150.0
    method = models.Payment.PaymentMethod.TRANSFER
    date = factory.Faker('date')
