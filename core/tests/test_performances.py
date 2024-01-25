import random

from django.db import connection
from django.test.utils import CaptureQueriesContext, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import factories
from core.tests.helpers import force_login


class BookingTestCase(APITestCase):
    fixtures = ["default-groups"]

    @classmethod
    @override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
    def setUpTestData(cls) -> None:
        cls.lodgings = factories.LodgingFactory.create_batch(5)
        cls.services = factories.ServiceFactory.create_batch(10)
        for lodging in cls.lodgings:
            bookings = factories.BookingFactory.create_batch(50, lodgings=lodging)
            for booking in bookings:
                booking.options.add(cls.services[random.randint(0, len(cls.services) - 1)])
                booking.payment_set.add(factories.PaymentFactory.create(booking=booking))
        cls.user = factories.StandardUserFactory.create()
        cls.user.lodgings.set(cls.lodgings)

    def setUp(self):
        self.header = force_login(self.user, self.client)

    def test_get_booking(self):
        booking = self.lodgings[0].booking_set.first()
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/booking/%d/" % booking.id, **self.header)
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            print("%d queries" % len(ctx.captured_queries))
            for query in ctx.captured_queries:
                print(query)
            self.assertEqual(17, len(ctx.captured_queries))

    def test_get_bookings(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/booking/", **self.header)
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            print("%d queries" % len(ctx.captured_queries))
            for query in ctx.captured_queries:
                print(query)
            self.assertEqual(17, len(ctx.captured_queries))
