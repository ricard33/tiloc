import json

import arrow
from django.test import TestCase
from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories


class BookingTestCase(APITestCase):
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.AdminFactory.create()
        self.client.force_login(self.user)
        instance, token = AuthToken.objects.create(self.user)
        self.header = {"HTTP_AUTHORIZATION": "Token " + token}

    def test_need_authentication(self):
        booking = factories.BookingFactory.create()
        response = self.client.get("/api/booking/%d/" % booking.id)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_booking(self):
        booking = factories.BookingFactory.create()
        response = self.client.get("/api/booking/%d/" % booking.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["id"], booking.id)

    def test_get_booking_with_services(self):
        booking = factories.BookingWithServiceFactory.create()
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
        self.assertIn("included_in_booking", obj["options"][0])

    def test_create_booking(self):
        data = {
            "lodging_id": self.lodging.id,
            "status_id": models.BookingStatus.objects.first().id,
            "guest_name": "John DOE",
            "begin_date": "2021-02-05",
            "end_date": "2021-02-25",
            "duration": 10,
            "price": 345,
        }
        response = self.client.post("/api/booking/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_update_cancelled_booking(self):
        booking = factories.BookingFactory.create(lodging=None, daily_rate=50)
        data = {
            "notes": "something",
        }
        response = self.client.patch("/api/booking/%d/" % booking.id, data, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        instance = models.Booking.objects.get(id=response.data["id"])
        self.assertEqual("something", instance.notes)

    def test_delete_cancelled_booking(self):
        booking = factories.BookingFactory.create(lodging=None, daily_rate=50)
        response = self.client.delete("/api/booking/%d/" % booking.id, format="json", **self.header)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)
        self.assertFalse(models.Booking.objects.filter(id=booking.id, deleted=False).exists())

    def test_create_booking_with_services(self):
        # factories.ServiceFactory.create_batch(5)
        service = factories.ServiceFactory.create()
        data = {
            "lodging_id": self.lodging.id,
            "status_id": models.BookingStatus.objects.first().id,
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
                    "included_in_booking": service.included_in_booking,
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
        booking = factories.BookingWithServiceFactory.create()
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
                    "included_in_booking": service.included_in_booking,
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
        booking = factories.BookingWithServiceFactory.create()
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
                    "included_in_booking": service.included_in_booking,
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
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.AdminFactory.create()
        self.client.force_login(self.user)
        instance, token = AuthToken.objects.create(self.user)
        self.header = {"HTTP_AUTHORIZATION": "Token " + token}

    def testAllGuests(self):
        for name in ["Alain DELON", "Franck HERBERT", "Pablo PICASSO"]:
            factories.BookingFactory.create(guest_name=name)

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(len(guests), 3, guests)
        self.assertIn("Alain DELON", map(lambda g: g["name"], guests), json.dumps(guests))

    def testAllGuestsDeduplicate(self):
        for name in ["Alain DELON", "Franck HERBERT", "Pablo PICASSO", "Franck HERBERT"]:
            factories.BookingFactory.create(guest_name=name)

        response = self.client.get("/api/booking/all_guests/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        guests = response.data
        self.assertEqual(len(guests), 3, json.dumps(guests))
        self.assertIn("Franck HERBERT", map(lambda g: g["name"], guests), json.dumps(guests))

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
            factories.BookingFactory.create(begin_date=date.date(), duration=duration, guest_name="guest %d" % (i + 1))

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
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()

    def test_booking_with_options_prices(self):
        booking = factories.BookingFactory.create(price=500)
        service = factories.ServiceFactory.create(unit_price=30, is_flat_rate=True, included_in_booking=False)
        models.BookedService.objects.create(service=service, booking=booking, unit_price=40, is_flat_rate=False)
        self.assertEqual(booking.price, 500)
        self.assertEqual(booking.price_with_options, 500 + 40 * booking.duration)
