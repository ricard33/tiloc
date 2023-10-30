import random
from decimal import Decimal

import arrow
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from faker import Faker

from core.models import Account, BookedService, Booking, BookingChannel, BookingStatus, Contract, Lodging, Payment, User


class Command(BaseCommand):
    help = "Populate demo account with faked data"

    def add_arguments(self, parser):
        # parser.add_argument("poll_ids", nargs="+", type=int)
        parser.add_argument(
            "--clean",
            action="store_true",
            help="Delete all data before to generate new one",
        )

    def handle(self, *args, **options):
        demo_account, created = Account.objects.get_or_create_demo()
        if options["clean"] and not created:
            demo_account.cleanup_account()
            demo_account.fill_account_with_default_ressources()

        fake = Faker("fr_FR")

        admin, created = User.objects.get_or_create(
            account=demo_account,
            email="admin@app.tiloc.fr",
        )
        if created:
            admin.first_name = (fake.first_name(),)
            admin.last_name = (fake.last_name(),)

            admin.groups.add(Group.objects.get(name__iexact="administrator"))

            admin.set_password("admin")
            admin.save()

        # purge bookings
        Payment.objects.filter(booking__lodging__account=demo_account).delete()
        Contract.objects.filter(booking__lodging__account=demo_account).delete()
        BookedService.objects.filter(booking__lodging__account=demo_account).delete()
        Booking.objects.filter(lodging__account=demo_account).delete()

        # create lodgings
        lodgings = []
        for rank, name in enumerate(["Hibiscus", "Frangipanier", "Orchidée", "Anthurium", "Heliconia"]):
            lodging, created = Lodging.objects.get_or_create(
                account=demo_account,
                owner=admin,
                name=name,
                rank=rank,
                guaranty=300,
                tourist_tax=1.5,
            )
            if created:
                lodging.address = fake.address()
                lodging.capacity = random.choice([2, 3, 4])
                lodgings.daily_rate = random.randrange(50, 120, 10)
                lodging.save()
            lodgings.append(lodging)

        # create bookings
        channel_website = BookingChannel.objects.get(name="Site Web")
        channel_airbnb = BookingChannel.objects.get(name="Airbnb")
        channel_booking = BookingChannel.objects.get(name="Booking.com")
        channel_abritel = BookingChannel.objects.get(name="Abritel")
        for lodging in lodgings:
            for i in range(random.randrange(60, 80)):
                while True:
                    begin_date = fake.date_between(start_date="-3y", end_date="+1y")
                    duration = random.randint(7, 21)
                    end_date = arrow.get(begin_date).shift(days=duration).date()
                    if not Booking.objects.filter(
                        lodging=lodging, begin_date__lte=end_date, end_date__gte=begin_date
                    ).exists():
                        if begin_date < arrow.now().date():
                            status = random.choices(
                                [BookingStatus.Paid, BookingStatus.External],
                                weights=(8, 5),
                            )[0]
                        else:
                            status = random.choices(
                                [
                                    BookingStatus.Option,
                                    BookingStatus.ContractSent,
                                    BookingStatus.DepositPaid,
                                    BookingStatus.External,
                                ],
                                weights=(1, 5, 10, 5),
                            )[0]
                        if status == BookingStatus.External:
                            source = random.choices(
                                [
                                    channel_airbnb,
                                    channel_booking,
                                    channel_abritel,
                                ],
                                weights=(2, 2, 1),
                            )[0]
                        else:
                            source = channel_website
                        booking = Booking.objects.create(
                            lodging=lodging,
                            status=status.value,
                            source=source,
                            begin_date=begin_date,
                            end_date=end_date,
                            duration=duration,
                            guest_name=fake.name(),
                            guest_contact="%s\n%s" % (fake.phone_number(), fake.email()),
                            guest_address=fake.address(),
                            adults=random.randrange(2, lodging.capacity + 1),
                            children=random.choices([0, 1, 2], weights=(10, 1, 1))[0],
                            babies=random.choices([0, 1], weights=(10, 1))[0],
                            daily_rate=lodging.daily_rate,
                            price=lodging.daily_rate * duration,
                            deposit=round(float(lodging.daily_rate) * duration * 0.3, -1),
                            commission_fees=(
                                status == BookingStatus.External and float(lodging.daily_rate) * duration * 0.15 or None
                            ),
                            guaranty=300,
                        )
                        if status in [BookingStatus.DepositPaid, BookingStatus.Paid]:
                            Payment.objects.create(
                                booking=booking,
                                description="Arrhes",
                                date=arrow.get(begin_date).shift(days=random.randrange(-300, -50)).date(),
                                amount=booking.deposit,
                                method=Payment.PaymentMethod.TRANSFER.value,
                            )
                        if status == BookingStatus.Paid:
                            Payment.objects.create(
                                booking=booking,
                                description="Solde",
                                date=arrow.get(begin_date).shift(days=random.randrange(-20, 0)).date(),
                                amount=booking.price_with_options - Decimal(booking.deposit),
                                method=Payment.PaymentMethod.TRANSFER.value,
                            )
                        if status == BookingStatus.External and end_date < arrow.now().date():
                            Payment.objects.create(
                                booking=booking,
                                description="Totalité",
                                date=arrow.get(begin_date).shift(days=random.randrange(1, 15)).date(),
                                amount=booking.price_with_options,
                                method=Payment.PaymentMethod.TRANSFER.value,
                            )

                        print("Insert %s" % booking)
                        break
                    else:
                        print("Invalide dates %s->%s" % (begin_date, end_date))

        self.stdout.write(self.style.SUCCESS("Successfully filled demo account"))
