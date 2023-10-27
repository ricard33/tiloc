import arrow
from django.test import TestCase

from core import models
from core.models import BookingStatus
from core.sync import synchronize_bookings
from core.tests import factories

empty_ical = r"""BEGIN:VCALENDAR
PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
CALSCALE:GREGORIAN
VERSION:2.0
BEGIN:VEVENT
DTEND;VALUE=DATE:20240629
DTSTART;VALUE=DATE:20230626
UID:6fec1092d3fa-85d6b3a607ea0eb64564d5c9c6f3bdb1@airbnb.com
SUMMARY:Airbnb (Not available)
END:VEVENT
END:VCALENDAR
"""

booking_empty_ical = ""

airbnb_ical = r"""BEGIN:VCALENDAR
PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
CALSCALE:GREGORIAN
VERSION:2.0
BEGIN:VEVENT
DTEND;VALUE=DATE:20200812
DTSTART;VALUE=DATE:20200802
UID:1418fb94e984-c36acd434xxxxxxxe6515e5ef948f56a@airbnb.com
DESCRIPTION:Reservation URL: https://www.airbnb.com/reservation/itinerary
 ?code=HMNxxx8J99\nPhone Number (Last 4 Digits): 4235
SUMMARY:Reserved
END:VEVENT
BEGIN:VEVENT
DTEND;VALUE=DATE:20200704
DTSTART;VALUE=DATE:20200703
UID:6fec1092d3fa-593cc373f3608bf4d477eed46f443abe@airbnb.com
SUMMARY:Airbnb (Not available)
END:VEVENT
END:VCALENDAR
"""

abritel_ical = r"""BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//HomeAway.com, Inc.//EN
BEGIN:VEVENT
UID:6f49cda7-479e-454b-a6a3-39fa7feee5ed
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20191224
DTEND;VALUE=DATE:20191229
SUMMARY:Réservée - Melanie
END:VEVENT
BEGIN:VEVENT
UID:d585fe79-8607-4b73-a4ab-47c6d4188aee
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20200101
DTEND;VALUE=DATE:20200124
SUMMARY:Réservée - M & Mme
END:VEVENT
BEGIN:VEVENT
UID:02292020-0229-2020-0305-202003052020
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20200229
DTEND;VALUE=DATE:20200305
SUMMARY:Indisponible
END:VEVENT
BEGIN:VEVENT
UID:6329b32c-b425-40e1-b49e-acb83bad14aa
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20200309
DTEND;VALUE=DATE:20200316
SUMMARY:Réservée - Charlotte & Fred
END:VEVENT
BEGIN:VEVENT
UID:ecc06b8c-350b-4b43-b6f1-10c0a353aaea
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20200515
DTEND;VALUE=DATE:20200519
SUMMARY:Réservée - Khatleen
END:VEVENT
BEGIN:VEVENT
UID:a69a7fa7-6603-4b81-9596-99643c07cc4e
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20201013
DTEND;VALUE=DATE:20201024
SUMMARY:Réservée
END:VEVENT
BEGIN:VEVENT
UID:138b5f92-5aaa-400d-86b6-268bfb3c8aa5
DTSTAMP:20200703T195526Z
DTSTART;VALUE=DATE:20201115
DTEND;VALUE=DATE:20201206
SUMMARY:Provisoire - Sylvie
END:VEVENT
END:VCALENDAR
"""


class SyncBookingsTestCase(TestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.lodging = factories.LodgingFactory()
        self.sync = factories.BookingChannelSyncFactory(lodging=self.lodging)

    def test_airbnb_simple_sync(self):
        synchronize_bookings(self.sync, airbnb_ical)
        self.assertEqual(models.Booking.objects.all().count(), 1)
        self.assertIsNotNone(self.sync.last_import)

    def test_sync_twice(self):
        synchronize_bookings(self.sync, airbnb_ical)
        synchronize_bookings(self.sync, airbnb_ical)
        self.assertEqual(models.Booking.objects.all().count(), 1)

    def test_abritel_simple_sync(self):
        synchronize_bookings(self.sync, abritel_ical)
        self.assertEqual(models.Booking.objects.all().count(), 7)

    def test_default_status(self):
        channel = factories.BookingChannelFactory(name="airbnb")
        sync = factories.BookingChannelSyncFactory(lodging=self.lodging, channel=channel)
        synchronize_bookings(sync, airbnb_ical)
        self.assertEqual(models.Booking.objects.first().status, BookingStatus.External.value)

    def test_update_existing_booking_with_same_dates(self):
        factories.BookingFactory(
            lodging=self.lodging, begin_date=arrow.get("2020-08-02").date(), end_date=arrow.get("2020-08-12").date()
        )
        synchronize_bookings(self.sync, airbnb_ical)
        self.assertEqual(models.Booking.objects.all().count(), 1)

    def test_booking_cancelled_by_ota(self):
        factories.BookingFactory(lodging=self.lodging, source=self.sync.channel)
        synchronize_bookings(self.sync, empty_ical)
        self.assertEqual(models.Booking.objects.all().count(), 1)
        self.assertEqual(models.Booking.objects.filter(cancelled=0).count(), 0)

    def test_empty_string_answer(self):
        """Change on 26/06/2023: Booking returns empty string if calendar is empty"""
        synchronize_bookings(self.sync, booking_empty_ical)
        self.assertEqual(models.Booking.objects.all().count(), 0)
