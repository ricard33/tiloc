import random

from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories
from core.tests.helpers import force_login


class AccountTestCase(APITestCase):
    def test_account_template(self):
        template = factories.AccountFactory(name="__template__")
        template.bookingstatus_set.create(name="custom status", rank=1)

        account = factories.AccountFactory(name="new account")
        self.assertTrue(account.bookingstatus_set.filter(name="custom status").exists())

        account.save()


class AccountDeleteTestCase(APITestCase):
    fixtures = ["default-groups"]

    def test_adminuser_can_request_for_account_deletion(self):
        admin_user = factories.AdminUserFactory()
        headers = force_login(admin_user)
        self.assertEqual(1, models.Account.objects.all().count())
        response = self.client.delete("/api/my-account/", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, models.Account.objects.all().count())
        self.assertFalse(models.Account.objects.first().is_active)

    def test_inactive_accounts_return_401_for_their_users(self):
        deleted_account = factories.InactiveAccount()
        user = factories.AdminUserFactory.create(account=deleted_account)
        headers = force_login(user)
        response = self.client.get("/api/user/", **headers)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_account_lambda_user_cant_request_for_account_deletion(self):
        lambda_user = factories.StandardUserFactory()
        headers = force_login(lambda_user)
        self.assertEqual(1, models.Account.objects.all().count(), models.Account.objects.all())
        response = self.client.delete("/api/my-account/", **headers)
        self.assertEqual(1, models.Account.objects.all().count())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_delete_account(self):
        account = factories.AccountFactory(name="Account")
        factories.AdminUserFactory(account=account)

        users = []
        lodgings = []
        bookings = []

        for i in range(5):
            users.append(factories.StandardUserFactory())
        for i in range(5):
            lodgings.append(factories.LodgingFactory())
        for i in range(50):
            bookings.append(factories.BookingFactory(lodging=random.choice(lodgings)))

        superuser = factories.SuperUserFactory()
        headers = force_login(superuser)
        response = self.client.delete("/api/account/%s/" % account.id, **headers)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(models.Account.objects.filter(name=account.name).count(), 0)

    def test_superuser_can_unlock_account(self):
        account = factories.InactiveAccount()
        factories.AdminUserFactory(account=account)
        superuser = factories.SuperUserFactory(account=factories.AccountFactory(name="Deus"))

        headers = force_login(superuser)
        response = self.client.patch("/api/account/%s/" % account.id, data={"is_active": True}, **headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(models.Account.objects.get(name=account.name).is_active, True)

    def test_user_can_logout_from_inactive_account(self):
        account = factories.InactiveAccount()
        user = factories.StandardUserFactory(account=account)

        headers = force_login(user)
        response = self.client.post("/api/auth/logout/", **headers)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class MyAccountTestCase(APITestCase):
    fixtures = ["default-groups"]

    def test_user_can_get_my_account(self):
        user = factories.StandardUserFactory()
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/my-account/")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        response = self.client.get("/api/my-account/")
        self.assertEqual(status.HTTP_200_OK, response.status_code)


class MultipleAccountsSeparationTestCase(APITestCase):
    fixtures = ["default-groups"]

    @classmethod
    def setUpTestData(cls):
        account = factories.AccountFactory.create(name="Account")
        factories.AdminUserFactory.create(account=account)

        users = []

        for i in range(5):
            users.append(factories.StandardUserFactory.create(account=account))
        factories.ContractTemplateFactory.create(account=account)
        pricing = factories.PricingFactory.create(account=account)
        factories.SeasonalVariationFactory.create(pricing=pricing)
        factories.HolidaysFactory.create(account=account)
        for i in range(4):
            factories.BookingStatusFactory.create(account=account)
        for i in range(6):
            factories.ServiceFactory.create(account=account)

        cls.make_lodgings(account)

        for i in range(8):
            channel = factories.BookingChannelFactory.create(account=account)
            for lodging in models.Lodging.objects.filter(account=account):
                factories.BookingChannelSyncFactory(lodging=lodging, channel=channel)

    @classmethod
    def make_lodgings(cls, account):
        lodgings = []
        bookings = []
        for i in range(5):
            lodgings.append(factories.LodgingFactory.create(account=account))
        for i in range(50):
            b = factories.BookingFactory.create(lodging=random.choice(lodgings))
            bookings.append(b)
            factories.ContractFactory.create(booking=b)
        for i in range(25):
            factories.PaymentFactory.create(booking=random.choice(bookings))

    def test_account_separation(self):
        account = factories.AccountFactory.create(name="another account")
        user = factories.AdminUserFactory.create(account=account)
        factories.ServiceFactory.create(account=account)
        channel = factories.BookingChannelFactory.create(account=account)
        lodging = factories.LodgingFactory.create(account=account)
        booking = factories.BookingFactory.create(lodging=lodging)
        factories.BookingChannelSyncFactory(lodging=lodging, channel=channel)
        factories.ContractTemplateFactory.create(account=account)
        pricing = factories.PricingFactory.create(account=account)
        factories.SeasonalVariationFactory.create(pricing=pricing)
        factories.HolidaysFactory.create(account=account)
        factories.PaymentFactory.create(booking=booking)
        factories.ContractFactory.create(booking=booking)

        def assertItemsCount(endpoint, count):
            response = self.client.get(endpoint, **headers)
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            self.assertEqual(count, response.data["count"])

        headers = force_login(user)
        assertItemsCount("/api/pricing/", 1)
        assertItemsCount("/api/holidays/", 1)
        assertItemsCount("/api/seasonal_variation/", 1)
        assertItemsCount("/api/contract_template/", 1)
        assertItemsCount("/api/user/", 1)
        assertItemsCount("/api/booking_status/", 1)
        assertItemsCount("/api/booking_channel/", 1)
        assertItemsCount("/api/booking_channel_sync/", 1)
        assertItemsCount("/api/service/", 1)
        assertItemsCount("/api/lodging/", 1)
        assertItemsCount("/api/booking/", 1)
        assertItemsCount("/api/contract/", 1)
        assertItemsCount("/api/payment/", 1)

    def test_lodging_separation(self):
        account = models.Account.objects.get(name="Account")
        user = factories.StandardUserFactory.create(account=account)
        channel = models.BookingChannel.objects.filter(account=account).first()
        lodging = factories.LodgingFactory.create(account=account)
        user.lodgings.add(lodging)
        booking = factories.BookingFactory.create(lodging=lodging)
        factories.BookingChannelSyncFactory(lodging=lodging, channel=channel)
        factories.PaymentFactory.create(booking=booking)
        factories.ContractFactory.create(booking=booking)

        def assertItemsCount(endpoint, count):
            response = self.client.get(endpoint, **headers)
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            self.assertEqual(count, response.data["count"], response.data)

        def assertItemsCountNoPaginated(endpoint, count):
            response = self.client.get(endpoint, **headers)
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            self.assertEqual(count, len(response.data), response.data)

        headers = force_login(user)
        assertItemsCount("/api/pricing/", 1)
        assertItemsCount("/api/holidays/", 1)
        assertItemsCount("/api/seasonal_variation/", 1)
        assertItemsCount("/api/contract_template/", 1)
        assertItemsCount("/api/booking_status/", 4)
        assertItemsCount("/api/booking_channel/", 8)
        assertItemsCount("/api/booking_channel_sync/", 1)
        assertItemsCount("/api/service/", 6)
        assertItemsCount("/api/lodging/", 1)
        assertItemsCount("/api/booking/", 1)
        assertItemsCount("/api/contract/", 1)
        assertItemsCount("/api/payment/", 1)
        assertItemsCountNoPaginated("/api/booking/all_guests/", 1)
