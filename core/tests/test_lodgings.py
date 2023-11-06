from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class LodgingAdminUserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.user = factories.AdminUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/lodging/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_lodgings(self):
        factories.LodgingFactory.create_batch(5)
        response = self.client.get("/api/lodging/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["count"], 5)
        self.assertEqual(len(data["results"]), 5)

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
        self.assertEqual(0, models.Lodging.objects.all().count())
        data = {"name": "my beautiful lodge", "owner_id": owner.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(1, models.Lodging.objects.all().count())

    def test_create_with_default_services(self):
        owner = factories.StandardUserFactory()
        service = factories.ServiceFactory()
        data = {
            "name": "my beautiful lodge",
            "owner_id": owner.id,
            "address": "here",
            "daily_rate": 30,
            "default_services": [service.reference],
        }
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        lodging = models.Lodging.objects.first()
        self.assertEqual(1, lodging.default_services.count())

    def test_create_with_default_services_and_multiple_account(self):
        # create a service on other account with a conflicting name
        account2 = factories.AccountFactory.create(name="other")
        factories.ServiceFactory.create(account=account2, reference="REF1")
        owner = factories.StandardUserFactory.create()
        service = factories.ServiceFactory.create(reference="REF1")
        self.assertEqual(2, models.Service.objects.all().count())
        self.assertEqual(owner.account, service.account)

        data = {
            "name": "my beautiful lodge",
            "owner_id": owner.id,
            "address": "here",
            "daily_rate": 30,
            "default_services": ["REF1"],
        }
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        lodging = models.Lodging.objects.first()
        self.assertEqual(service.id, lodging.default_services.first().id)

    def test_update_default_services(self):
        owner = factories.StandardUserFactory.create()
        service = factories.ServiceFactory.create()
        lodging = factories.LodgingFactory.create()
        self.assertEqual(0, lodging.default_services.count())
        data = {
            "name": "my beautiful lodge",
            "owner_id": owner.id,
            "address": "here",
            "daily_rate": 30,
            "default_services": [service.reference],
        }
        response = self.client.patch("/api/lodging/%d/" % lodging.id, data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(1, lodging.default_services.count())


class LodgingStandardUserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
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
        data = response.data
        self.assertEqual(data["count"], 2)
        self.assertEqual(len(data["results"]), 2)

    def test_cant_create(self):
        owner = factories.StandardUserFactory()
        data = {"name": "my beautiful lodge", "owner_id": owner.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
