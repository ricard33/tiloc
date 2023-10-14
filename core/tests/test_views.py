import calendar
import unittest
from datetime import date
from functools import reduce

import arrow
from django.test import TestCase
from ics import Calendar
from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class ExportCalendarTestCase(TestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        for name in ["option", "contract sent", "deposit paid", "paid"]:
            factories.BookingStatusFactory(name=name)
        self.lodging = factories.LodgingFactory()

    def test_simple_export(self):
        factories.BookingFactory(lodging=self.lodging, guest_name="Cédric")
        r = self.client.get("/calendar/%s/" % self.lodging.uid)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["content-type"], "text/calendar")
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 1)
        self.assertEqual("GREGORIAN", c.extra["CALSCALE"][0].value)
        e = c.events.pop()
        self.assertEqual(e.summary, "Cédric")

    def test_secondary_export_url(self):
        factories.BookingFactory(lodging=self.lodging, guest_name="Cédric")
        r = self.client.get("/calendar/%s.ics" % self.lodging.uid)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["content-type"], "text/calendar")

    def test_event_uid_are_reliable(self):
        factories.BookingFactory(lodging=self.lodging, guest_name="Cédric")
        r = self.client.get("/calendar/%s/" % self.lodging.uid)
        c = Calendar(r.content.decode())
        e1 = c.events.pop()
        r = self.client.get("/calendar/%s/" % self.lodging.uid)
        c = Calendar(r.content.decode())
        e2 = c.events.pop()
        self.assertEqual(e1.uid, e2.uid)

    def test_exclude_bookings_from_requesting_channel(self):
        channel = factories.BookingChannelFactory(name="airbnb")
        sync = factories.BookingChannelSyncFactory(lodging=self.lodging, channel=channel)
        factories.BookingFactory(lodging=self.lodging, source=channel)
        factories.BookingFactory(lodging=self.lodging)
        r = self.client.get("/calendar/%s/?s=%d" % (self.lodging.uid, sync.id))
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 1)

    def test_exclude_deleted_bookings(self):
        channel = factories.BookingChannelFactory(name="airbnb")
        sync = factories.BookingChannelSyncFactory(lodging=self.lodging, channel=channel)
        factories.BookingFactory(lodging=self.lodging, deleted=True)
        factories.BookingFactory(lodging=self.lodging)
        r = self.client.get("/calendar/%s/?s=%d" % (self.lodging.uid, sync.id))
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 1)

    def test_exclude_cancelled_bookings(self):
        channel = factories.BookingChannelFactory(name="airbnb")
        sync = factories.BookingChannelSyncFactory(lodging=self.lodging, channel=channel)
        factories.BookingFactory(lodging=self.lodging, cancelled=True)
        factories.BookingFactory(lodging=self.lodging)
        r = self.client.get("/calendar/%s/?s=%d" % (self.lodging.uid, sync.id))
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 1)

    def test_booking_dates(self):
        now = arrow.now()
        year_ = now.date().year + 1
        factories.BookingFactory(
            lodging=self.lodging,
            guest_name="Cédric",
            begin_date=arrow.get("%d-08-02" % year_).date(),
            end_date=arrow.get("%d-08-12" % year_).date(),
        )
        self.assertEqual(models.Booking.objects.all().count(), 1)

        r = self.client.get("/calendar/%s/" % self.lodging.uid)
        self.assertEqual(r.status_code, 200)
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 1)
        e = c.events.pop()
        self.assertEqual(e.begin.date(), date(year_, 8, 2))
        self.assertEqual(e.end.date(), date(year_, 8, 12))


@unittest.skip("Security hole: Endpoint removed because not used")
class ExportFullPlanningTestCase(TestCase):
    def setUp(self) -> None:
        for name in ["option", "contract sent", "deposit paid", "paid"]:
            factories.BookingStatusFactory(name=name)
        self.lodging1 = factories.LodgingFactory()
        self.lodging2 = factories.LodgingFactory()
        factories.BookingFactory(lodging=self.lodging1, guest_name="Cédric")
        factories.BookingFactory(lodging=self.lodging2, guest_name="Daniel")

    def test_full_export_by_admin(self):
        admin = factories.SuperUserFactory()
        header = force_login(admin)
        r = self.client.get("/full_planning/", **header)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["content-type"], "text/calendar")
        c = Calendar(r.content.decode())
        self.assertEqual(len(c.events), 2)


class FillingRateTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.user = factories.StandardUserFactory.create()
        self.header = force_login(self.user)

    def test_default_dates_to_last_12_months(self):
        lodging = factories.LodgingFactory()
        self.user.lodgings.add(lodging)
        now = arrow.now()
        for i in range(24):
            date = now.shift(months=-i).replace(day=5)
            factories.BookingFactory(lodging=lodging, begin_date=date.date(), end_date=date.shift(weeks=1).date())
        response = self.client.get("/stats/filling_rate/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(12, len(obj), obj)
        self.assertEqual(arrow.utcnow().format("YYYY-MM"), obj[11]["date"], obj[11])
        self.assertEqual(arrow.now().shift(months=-11).format("YYYY-MM"), obj[0]["date"], obj[0])
        self.assertEqual(7, obj[0]["days"], obj[0])
        self.assertEqual(calendar.monthrange(now.year, now.month)[1], obj[11]["capacity"])
        self.assertEqual(lodging.daily_rate * 7, obj[0]["turnover"])

    def test_no_booking_at_all_returns_empty_result(self):
        response = self.client.get("/stats/filling_rate/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(0, len(obj), obj)

    def test_empty_months_are_included(self):
        lodging = factories.LodgingFactory()
        self.user.lodgings.add(lodging)
        now = arrow.now()
        date = now.shift(months=-10).replace(day=5)
        factories.BookingFactory(lodging=lodging, begin_date=date.date(), end_date=date.shift(weeks=1).date())
        date = now.shift(months=-5).replace(day=5)
        factories.BookingFactory(lodging=lodging, begin_date=date.date(), end_date=date.shift(weeks=1).date())

        response = self.client.get("/stats/filling_rate/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(12, len(obj), obj)

    def test_with_dates(self):
        lodging = factories.LodgingFactory()
        self.user.lodgings.add(lodging)
        factories.BookingFactory(
            lodging=lodging,
            begin_date=arrow.get("2020-08-02").date(),
            end_date=arrow.get("2020-08-18").date(),
        )
        response = self.client.get("/stats/filling_rate/2020-01-01/2020-09-30/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(9, len(obj), obj)
        self.assertEqual("2020-01", obj[0]["date"], obj[0])
        self.assertEqual("2020-09", obj[8]["date"], obj[8])

    def test_multiple_accounts_are_filtered(self):
        account = factories.AccountFactory(name="another")
        lodging = factories.LodgingFactory(account=account)
        factories.BookingFactory(
            lodging=lodging,
            begin_date=arrow.get("2020-08-02").date(),
            end_date=arrow.get("2020-08-18").date(),
        )
        response = self.client.get("/stats/filling_rate/2020-01-01/2020-09-30/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(0, len(obj), obj)

    def test_multiple_lodgings_are_filtered(self):
        lodging = factories.LodgingFactory()
        factories.BookingFactory(
            lodging=lodging,
            begin_date=arrow.get("2020-08-02").date(),
            end_date=arrow.get("2020-08-18").date(),
        )
        response = self.client.get("/stats/filling_rate/2020-01-01/2020-09-30/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(0, len(obj), obj)


class ChannelsDistributionTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        factories.BookingChannelFactory.create_batch(8)
        self.user = factories.StandardUserFactory.create()
        self.header = force_login(self.user)

    def count_channels(self, results, channel_name):
        return reduce(lambda acc, item: item["channel"] == channel_name and item["count"] + acc or acc, results, 0)

    def test_channel_distribution(self):
        lodging = factories.LodgingFactory()
        self.user.lodgings.add(lodging)
        factories.BookingFactory(lodging=lodging, begin_date=arrow.get("2020-08-02").date(), end_date=arrow.get("2020-08-18").date())
        factories.BookingFactory(lodging=lodging, begin_date=arrow.get("2020-07-02").date(), end_date=arrow.get("2020-07-18").date(),
                                 source=models.BookingChannel.objects.get(name="airbnb"))
        channels_count = models.BookingChannel.objects.for_user(self.user).count()
        response = self.client.get("/stats/channel_distribution/2020-01-01/2020-09-30/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(channels_count + 1, len(obj), obj)
        self.assertEqual(1, self.count_channels(obj, None))
        self.assertEqual(1, self.count_channels(obj, "airbnb"))

    def test_multiple_lodgings_are_filtered(self):
        lodging = factories.LodgingFactory()
        factories.BookingFactory(lodging=lodging, begin_date=arrow.get("2020-08-02").date(), end_date=arrow.get("2020-08-18").date())
        factories.BookingFactory(lodging=lodging, begin_date=arrow.get("2020-07-02").date(), end_date=arrow.get("2020-07-18").date(),
                                 source=models.BookingChannel.objects.get(name="airbnb"))
        channels_count = models.BookingChannel.objects.for_user(self.user).count()
        response = self.client.get("/stats/channel_distribution/2020-01-01/2020-09-30/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(channels_count + 1, len(obj), obj)
        self.assertEqual(0, self.count_channels(obj, "airbnb"))
        self.assertEqual(0, self.count_channels(obj, None))
