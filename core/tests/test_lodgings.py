from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class LodgingAdminUserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        # factories.BookingStatusFactory.create_batch(4)
        self.user = factories.AdminUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/lodging/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_lodgings(self):
        factories.LodgingFactory.create_batch(5)
        response = self.client.get("/api/lodging/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj['count'], 5)
        self.assertEqual(len(obj['results']), 5)

    def testMoveUp(self):
        factories.LodgingFactory.create_batch(4)
        lodgings = list(models.Lodging.objects.all())
        # move 2nd to 1st
        response = self.client.post("/api/lodging/%d/move_up/" % lodgings[1].id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["rank"], lodgings[0].rank)
        new_lodgings = list(models.Lodging.objects.all())
        self.assertEqual(new_lodgings[1].id, lodgings[0].id)
        self.assertEqual(new_lodgings[0].id, lodgings[1].id)
        self.assertEqual(new_lodgings[2].id, lodgings[2].id)
        self.assertEqual(new_lodgings[3].id, lodgings[3].id)

    def testMoveDown(self):
        factories.LodgingFactory.create_batch(4)
        lodgings = list(models.Lodging.objects.all())
        # move 2nd to 3rd
        response = self.client.post("/api/lodging/%d/move_down/" % lodgings[1].id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj["rank"], lodgings[2].rank)
        new_lodgings = list(models.Lodging.objects.all())
        self.assertEqual(new_lodgings[0].id, lodgings[0].id)
        self.assertEqual(new_lodgings[1].id, lodgings[2].id)
        self.assertEqual(new_lodgings[2].id, lodgings[1].id)
        self.assertEqual(new_lodgings[3].id, lodgings[3].id)

    def test_create(self):
        owner = factories.StandardUserFactory()
        status_count = models.Lodging.objects.all().count()
        data = {"name": "my beautiful lodge", "owner_id": owner.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(status_count + 1, models.Lodging.objects.all().count())


class LodgingStandardUserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        # factories.BookingStatusFactory.create_batch(4)
        self.user = factories.StandardUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/lodging/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_lodgings(self):
        factories.LodgingFactory.create(owner=self.user)  # owned
        self.user.lodgings.add(factories.LodgingFactory.create())  # has access
        factories.LodgingFactory.create_batch(2)  # no access
        response = self.client.get("/api/lodging/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj['count'], 2)
        self.assertEqual(len(obj['results']), 2)

    def test_cant_create(self):
        owner = factories.StandardUserFactory()
        status_count = models.Lodging.objects.all().count()
        data = {"name": "my beautiful lodge", "owner_id": owner.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
