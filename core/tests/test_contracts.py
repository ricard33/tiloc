from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import factories


class ContractTestCase(APITestCase):
    def setUp(self) -> None:
        for name in ['option', 'contract sent', 'deposit paid', 'paid']:
            factories.BookingStatusFactory(name=name)

    def test_generate_contract(self):
        contract_template = factories.ContractTemplateFactory(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}...")
        booking = factories.BookingFactory(lodging__contract_template=contract_template)
        booking.generate_contract()
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertIn(booking.lodging.name, booking.contract.content)

    def test_generate_contract_without_template(self):
        booking = factories.BookingFactory(lodging__contract_template=None)
        booking.generate_contract()
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertEqual("", booking.contract.content)

    def test_generate_contract_with_api(self):
        user = factories.AdminFactory()
        contract_template = factories.ContractTemplateFactory(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}...")
        booking = factories.BookingFactory(lodging__contract_template=contract_template)
        self.client.force_login(user)
        response = self.client.post('/api/booking/%d/generate_contract/' % booking.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertEqual(booking.contract.id, response.data['id'])
        self.assertIn(booking.lodging.name, booking.contract.content)

    # @override_settings(MEDIA_ROOT="/www/", MEDIA_URL="http://mediaserv.com/myapp/")
    # def test_make_pdf(self):
