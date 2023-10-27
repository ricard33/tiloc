from django.core.files.base import ContentFile
from django.test.client import MULTIPART_CONTENT, encode_multipart, BOUNDARY
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import factories
from core.tests.helpers import force_login


class UserTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.user = factories.AdminUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/user/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_users(self):
        factories.StandardUserFactory.create_batch(2)
        response = self.client.get("/api/user/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 3)  # 1 admin + 2 standard users

    def test_create(self):
        data = {
            "first_name": "John",
            "last_name": "DOE",
            "email": "none@nowhere.com",
            "groups": ["standard"],
            "password": "PasSw0rd",
        }
        response = self.client.post("/api/user/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_create_with_lodgings(self):
        lodging1 = factories.LodgingFactory.create()
        lodging2 = factories.LodgingFactory.create()
        data = {
            "first_name": "John",
            "last_name": "DOE",
            "email": "none@nowhere.com",
            "groups": ["standard"],
            "password": "PasSw0rd",
            "lodgings": [lodging1.name, lodging2.name],
        }
        response = self.client.post("/api/user/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        obj = response.data
        self.assertEqual(2, len(obj["lodgings"]), obj)

    def test_create_with_signature(self):
        image_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xdb\x0c\x17\x020;\xd1\xda\xcf\xd2\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82"
        data = {
            "first_name": "John",
            "last_name": "DOE",
            "email": "none@nowhere.com",
            "groups": ["standard"],
            "password": "PasSw0rd",
            "signature": ContentFile(image_data, "test.png"),
            "logo": "",
            "lodgings": [],
            "vat_rate": "",
        }
        response = self.client.post(
            "/api/user/", encode_multipart(data=data, boundary=BOUNDARY), content_type=MULTIPART_CONTENT, **self.header
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
