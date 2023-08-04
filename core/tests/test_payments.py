from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class PaymentTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.StandardUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        payment = factories.PaymentFactory.create()
        response = self.client.get("/api/payment/%d/" % payment.id)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_payment(self):
        payment = factories.PaymentFactory.create()
        response = self.client.get("/api/payment/%d/" % payment.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["id"], payment.id)

    def test_get_payments_for_booking(self):
        factories.PaymentFactory.create()
        booking = factories.BookingFactory.create()
        payment = factories.PaymentFactory.create(booking=booking)
        payment2 = factories.PaymentFactory.create(booking=booking)
        response = self.client.get("/api/payment/?booking_id=%d" % payment.booking.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertIn(payment.id, map(lambda x: x["id"], results))
        self.assertIn(payment2.id, map(lambda x: x["id"], results))

    def test_create_payment(self):
        booking = factories.BookingFactory.create()
        response = self.client.post(
            "/api/payment/",
            {
                "booking_id": booking.id,
                "description": "solde",
                "amount": 123.4,
                "method": models.Payment.PaymentMethod.TRANSFER.value,
                "date": "2021-08-01",
            },
            **self.header,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(models.Payment.objects.all().count(), 1)
        obj = response.data
        self.assertEqual(obj["booking_id"], booking.id)
        self.assertEqual(obj["amount"], "123.40")
