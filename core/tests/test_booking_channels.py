from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class BookingChannelTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        factories.BookingChannelFactory.create_batch(4)
        self.user = factories.AdminUserFactory.create()
        self.header = force_login(self.user)

    def test_need_authentication(self):
        response = self.client.get("/api/booking_channel/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_channels(self):
        response = self.client.get("/api/booking_channel/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 4)

    def test_get_global_and_current_account_channels(self):
        another_account = factories.AccountFactory.create(name="another")
        factories.BookingChannelFactory.create_batch(2, account=another_account)
        factories.BookingChannelFactory.create_batch(1, account=self.user.account)
        self.assertEqual(models.BookingChannel.objects.all().count(), 7)
        self.assertEqual(models.BookingChannel.objects.for_user(self.user).count(), 5)

        response = self.client.get("/api/booking_channel/", **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 5)

    def test_create_custom_channel(self):
        channel_count = models.BookingChannel.objects.all().count()
        data = {"name": "my custom status"}
        response = self.client.post("/api/booking_channel/", data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(channel_count + 1, models.BookingChannel.objects.all().count())
        self.assertEqual(models.BookingChannel.objects.filter(account=self.user.account).count(), 1)

    def test_delete_custom_channel(self):
        channel = factories.BookingChannelFactory.create(account=self.user.account)
        channel_count = models.BookingChannel.objects.all().count()
        response = self.client.delete("/api/booking_channel/%d/" % channel.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)
        self.assertEqual(channel_count - 1, models.BookingChannel.objects.all().count())

    def test_cant_delete_global_channel(self):
        channel_count = models.BookingChannel.objects.all().count()
        channel = models.BookingChannel.objects.filter(account__isnull=True).first()
        response = self.client.delete("/api/booking_channel/%d/" % channel.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(channel_count, models.BookingChannel.objects.all().count())
