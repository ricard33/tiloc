from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import factories
from core.tests.helpers import force_login


class UserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        # factories.BookingStatusFactory.create_batch(4)
        self.user = factories.AdminUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/user/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_users(self):
        factories.StandardUserFactory.create_batch(4)
        response = self.client.get("/api/user/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(len(obj), 4)

    def test_create(self):
        data = {"first_name": "John", "last_name": "DOE", "email": "none@nowhere.com", "groups": ['standard'],
                'password': 'PasSw0rd'}
        response = self.client.post("/api/user/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_create_with_properties(self):
        property = factories.PropertyFactory.create()
        data = {"first_name": "John", "last_name": "DOE", "email": "none@nowhere.com", "groups": ['standard'],
                'password': 'PasSw0rd', 'properties': [property.id]}
        response = self.client.post("/api/user/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        obj = response.data
        self.assertEqual(1, len(obj['properties']), obj)
