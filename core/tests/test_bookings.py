import json
from decimal import Decimal

import arrow
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class BookingTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.StandardUserFactory.create()
        self.user.lodgings.add(self.lodging)
        self.header = force_login(self.user)

    def test_need_authentication(self):
        booking = factories.BookingFactory.create(lodging=self.lodging)
        response = self.client.get("/api/booking/%d/" % booking.id)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_booking(self):
        booking = factories.BookingFactory.create(lodging=self.lodging)
        response = self.client.get("/api/booking/%d/" % booking.id, **self.header)
        print(self.user.groups)
        print(models.Booking.objects.filter(id=booking.id).values())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["id"], booking.id)

    def test_get_booking_with_services(self):
        booking = factories.BookingWithServiceFactory.create(lodging=self.lodging)
        response = self.client.get("/api/booking/%d/" % booking.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["id"], booking.id)
        self.assertIn("options", obj)
        self.assertEqual(len(obj["options"]), 1)
        self.assertIn("id", obj["options"][0])
        self.assertIn("reference", obj["options"][0])
        self.assertIn("designation", obj["options"][0])
        self.assertIn("is_flat_rate", obj["options"][0])
        self.assertIn("unit_price", obj["options"][0])

    def test_create_booking(self):
        data = {
            "lodging_id": self.lodging.id,
            "status": models.BookingStatus.Option.value,
            "guest_name": "John DOE",
            "begin_date": "2021-02-05",
            "end_date": "2021-02-25",
            "duration": 10,
            "price": 345,
        }
        response = self.client.post("/api/booking/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_update_cancelled_booking(self):
        booking = factories.BookingFactory.create(lodging=self.lodging, cancelled=True, daily_rate=50)
        data = {
            "notes": "something",
        }
        response = self.client.patch("/api/booking/%d/" % booking.id, data, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        instance = models.Booking.objects.get(id=response.data["id"])
        self.assertEqual("something", instance.notes)

    def test_delete_cancelled_booking(self):
        booking = factories.BookingFactory.create(lodging=self.lodging, cancelled=True, daily_rate=50)
        response = self.client.delete("/api/booking/%d/" % booking.id, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)
        self.assertFalse(models.Booking.objects.filter(id=booking.id, deleted=False).exists())

    def test_create_booking_with_services(self):
        # factories.ServiceFactory.create_batch(5)
        service = factories.ServiceFactory.create()
        data = {
            "lodging_id": self.lodging.id,
            "status": models.BookingStatus.Option.value,
            "guest_name": "John DOE",
            "begin_date": "2021-02-05",
            "end_date": "2021-02-25",
            "duration": 10,
            "price": 345,
            "options": [
                {
                    "id": service.id,
                    "reference": service.reference,
                    "designation": service.designation,
                    "is_flat_rate": service.is_flat_rate,
                    "unit_price": service.unit_price,
                }
            ],
        }
        response = self.client.post("/api/booking/", data, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj["id"])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn("id", obj)
        self.assertIn("options", obj)
        self.assertEqual(len(obj["options"]), 1)

    def test_update_booking_with_services(self):
        booking = factories.BookingWithServiceFactory.create(lodging=self.lodging)
        service = factories.ServiceFactory.create()
        self.assertNotEqual(booking.options.first().id, service.id)
        self.assertEqual(models.Service.objects.count(), 2)
        data = {
            "price": 345,
            "options": [
                {
                    "id": service.id,
                    "reference": service.reference,
                    "designation": service.designation,
                    "is_flat_rate": service.is_flat_rate,
                    "unit_price": service.unit_price,
                }
            ],
        }
        response = self.client.patch("/api/booking/%d/" % booking.id, data, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj["id"])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn("options", obj)
        self.assertEqual(len(obj["options"]), 1)
        self.assertEqual(obj["options"][0]["id"], service.id)

        # removed service is not deleted
        self.assertEqual(models.Service.objects.count(), 2)

    def test_update_price_for_booking_option(self):
        booking = factories.BookingWithServiceFactory.create(lodging=self.lodging)
        service = booking.options.first()
        self.assertNotEqual(service.unit_price, 123)
        data = {
            "price": 345,
            "options": [
                {
                    "id": service.id,
                    "reference": service.reference,
                    "designation": service.designation,
                    "is_flat_rate": not service.is_flat_rate,
                    "unit_price": 123,
                }
            ],
        }
        response = self.client.patch("/api/booking/%d/" % booking.id, data, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj["id"])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn("options", obj)
        self.assertEqual(len(obj["options"]), 1)
        self.assertEqual(obj["options"][0]["id"], service.id)
        self.assertEqual(obj["options"][0]["unit_price"], "123.00")
        self.assertEqual(obj["options"][0]["is_flat_rate"], not service.is_flat_rate)
        self.assertEqual(booking.bookedservice_set.first().unit_price, 123)


class BookingQueriesTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.StandardUserFactory.create()
        self.user.lodgings.add(self.lodging)
        self.header = force_login(self.user)

    def testAllGuests(self):
        for name in ["Alain DELON", "Franck HERBERT", "Pablo PICASSO"]:
            factories.BookingFactory.create(guest_name=name, lodging=self.lodging)

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(len(guests), 3, guests)
        self.assertIn("Alain DELON", map(lambda g: g["name"], guests), json.dumps(guests))

    def testAllGuestsDeduplicate(self):
        for name in ["Alain DELON", "Franck HERBERT", "Pablo PICASSO", "Franck HERBERT"]:
            factories.BookingFactory.create(guest_name=name, lodging=self.lodging)

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(3, len(guests), json.dumps(guests))
        self.assertIn("Franck HERBERT", map(lambda g: g["name"], guests), json.dumps(guests))

    def testAllGuestsGetLastAddress(self):
        for [name, days, address] in [
            ["Franck HERBERT", 0, "123 road X"],
            ["Franck HERBERT", 30, "999 road Y"],
            ["Franck HERBERT", 60, "666 road Z"],
        ]:
            factories.BookingFactory.create(
                guest_name=name,
                begin_date=arrow.utcnow().shift(days=days).date(),
                guest_address=address,
                lodging=self.lodging,
            )

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(1, len(guests), json.dumps(guests))
        self.assertEqual("666 road Z", guests[0]["address"], json.dumps(guests))

    def testAllGuestsOnlyForOwnedLodgings(self):
        for name in ["Alain DELON", "Franck HERBERT", "Pablo PICASSO"]:
            factories.BookingFactory.create(guest_name=name, lodging=self.lodging)
        factories.BookingFactory.create()  # for another lodging

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(len(guests), 3, guests)

    def testAllGuestsWithAdminUser(self):
        factories.BookingFactory.create_batch(3)  # on different lodgings
        admin = factories.AdminUserFactory.create()
        header = force_login(admin)

        response = self.client.get("/api/booking/all_guests/", **header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(len(guests), 3, guests)

    def testNextEvents(self):
        now = arrow.utcnow()
        # test bookings can't be less than 7 days nor more than 21 days
        for i, (date, duration) in enumerate(
            [
                (now.shift(days=-30), 15),
                (now.shift(days=-4), 7),
                (now.shift(days=+1), 15),
                (now.shift(days=+30), 10),
                (now.shift(days=+35), 7),
            ]
        ):
            factories.BookingFactory.create(
                begin_date=date.date(),
                duration=duration,
                guest_name="guest %d" % (i + 1),
                lodging=self.lodging,
            )

        response = self.client.get("/api/booking/next_events/?count=5", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        events = response.data
        self.assertEqual(len(events), 5, json.dumps(events))
        self.assertEqual(events[0]["guest_name"], "guest 3", json.dumps(events))
        self.assertEqual(events[0]["event_type"], "CHECKIN", json.dumps(events))
        self.assertEqual(events[1]["guest_name"], "guest 2", json.dumps(events))
        self.assertEqual(events[1]["event_type"], "CHECKOUT", json.dumps(events))
        self.assertEqual(events[2]["guest_name"], "guest 3", json.dumps(events))
        self.assertEqual(events[2]["event_type"], "CHECKOUT", json.dumps(events))
        self.assertEqual(events[3]["guest_name"], "guest 4", json.dumps(events))
        self.assertEqual(events[3]["event_type"], "CHECKIN", json.dumps(events))
        self.assertEqual(events[4]["guest_name"], "guest 5", json.dumps(events))
        self.assertEqual(events[4]["event_type"], "CHECKIN", json.dumps(events))


class BookingModelTestCase(TestCase):
    fixtures = ["default-groups"]

    def test_booking_with_options_prices(self):
        booking = factories.BookingFactory.create(price=500)
        service = factories.ServiceFactory.create(unit_price=30, is_flat_rate=True)
        models.BookedService.objects.create(service=service, booking=booking, unit_price=40, is_flat_rate=False)
        self.assertEqual(booking.price, 500)
        self.assertEqual(booking.price_with_options, 500 + 40 * booking.duration)

    def test_tourist_tax_flat_rate(self):
        lodging = factories.LodgingFactory.create(
            daily_rate=60,
            is_flat_rate_tourist_tax=True,
            max_daily_tourist_tax=1.5,
        )
        booking = factories.BookingFactory.create(lodging=lodging, duration=5, adults=2, children=2)
        self.assertEqual(5 * 60, booking.price)
        self.assertEqual(5 * 1.5 * 2, booking.tourist_tax)

    def test_tourist_tax(self):
        lodging = factories.LodgingFactory.create(
            daily_rate=60,
            is_flat_rate_tourist_tax=False,
            max_daily_tourist_tax=1.8,
            tourist_tax_rate=5,
        )
        booking = factories.BookingFactory.create(lodging=lodging, duration=4, adults=2, children=2, price=Decimal(410))
        self.assertEqual(410, booking.price)
        print (type(booking.price))
        self.assertAlmostEqual(Decimal('10.24'), booking.tourist_tax, 1)

        lodging.daily_rate = 50
        booking = factories.BookingFactory.create(lodging=lodging, duration=8, adults=2, children=2)
        self.assertEqual(400, booking.price)
        print (type(booking.price))
        self.assertAlmostEqual(Decimal('10.08'), booking.tourist_tax, 1)
