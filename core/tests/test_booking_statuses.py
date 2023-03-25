from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories


class BookingStatusTestCase(APITestCase):
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.user = factories.AdminFactory.create()
        self.client.force_login(self.user)
        instance, token = AuthToken.objects.create(self.user)
        self.header = {"HTTP_AUTHORIZATION": "Token " + token}

    def test_need_authentication(self):
        response = self.client.get("/api/booking_status/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_statuses(self):
        response = self.client.get("/api/booking_status/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(len(obj), 4)

    def testMoveUp(self):
        statuses = list(models.BookingStatus.objects.all())
        # move 2nd to 1st
        response = self.client.post("/api/booking_status/%d/moveUp/" % statuses[1].id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["rank"], statuses[0].rank)
        new_statuses = list(models.BookingStatus.objects.all())
        self.assertEqual(new_statuses[1].id, statuses[0].id)
        self.assertEqual(new_statuses[0].id, statuses[1].id)
        self.assertEqual(new_statuses[2].id, statuses[2].id)
        self.assertEqual(new_statuses[3].id, statuses[3].id)

    def testMoveDown(self):
        statuses = list(models.BookingStatus.objects.all())
        # move 2nd to 3rd
        response = self.client.post("/api/booking_status/%d/moveDown/" % statuses[1].id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["rank"], statuses[2].rank)
        new_statuses = list(models.BookingStatus.objects.all())
        self.assertEqual(new_statuses[0].id, statuses[0].id)
        self.assertEqual(new_statuses[1].id, statuses[2].id)
        self.assertEqual(new_statuses[2].id, statuses[1].id)
        self.assertEqual(new_statuses[3].id, statuses[3].id)
