import unittest

from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class SubscriptionsTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        plan = factories.PlanFactory.create(ref="OWNER", name="Essentiel", max_lodgings=3, max_users=1, price=10)
        self.user = factories.AdminUserFactory.create(account__subscription_set__plan=plan)
        self.header = force_login(self.user)

    def test_lodgings_limit(self):
        factories.LodgingFactory.create_batch(2)
        self.assertEqual(2, models.Lodging.objects.all().count())
        data = {"name": "my beautiful lodge", "owner_id": self.user.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(3, models.Lodging.objects.all().count())
        # should fail because limit is 3
        data = {"name": "another beautiful lodge", "owner_id": self.user.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/lodging/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(3, models.Lodging.objects.all().count())

    @unittest.skip("This limitation can be easily bypassed, so it is not implemented for now.")
    def test_get_lodgings_is_limited(self):
        factories.LodgingFactory.create_batch(5)
        response = self.client.get("/api/lodging/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        # limit is set to 3 on this plan
        self.assertEqual(data["count"], 3)
        self.assertEqual(len(data["results"]), 3)

    def test_users_limit(self):
        self.assertEqual(1, models.User.objects.all().count())
        # should fail because limit is 1
        data = {"name": "another beautiful lodge", "owner_id": self.user.id, "address": "here", "daily_rate": 30}
        response = self.client.post("/api/user/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(1, models.User.objects.all().count())
