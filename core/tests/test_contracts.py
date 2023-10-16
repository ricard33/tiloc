from rest_framework import status
from rest_framework.test import APITestCase

from core.contracts import generate_contract, generate_empty_contract
from core.tests import factories
from core.tests.helpers import force_login


class ContractTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        for name in ["option", "contract sent", "deposit paid", "paid"]:
            factories.BookingStatusFactory.create(name=name)

    def test_generate_contract(self):
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}..."
        )
        booking = factories.BookingFactory.create(lodging__contract_template=contract_template)
        generate_contract(booking)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertIn(booking.lodging.name, booking.contract.content)

    def test_generate_contract_without_template(self):
        booking = factories.BookingFactory.create(lodging__contract_template=None)
        generate_contract(booking)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertEqual("", booking.contract.content)

    def test_generate_contract_with_api(self):
        user = factories.StandardUserFactory.create()
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}..."
        )
        booking = factories.BookingFactory.create(lodging__contract_template=contract_template)
        user.lodgings.add(booking.lodging)
        header = force_login(user)
        response = self.client.post("/api/booking/%d/generate_contract/" % booking.id, **header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertEqual(booking.contract.id, response.data["id"])
        self.assertIn(booking.lodging.name, booking.contract.content)

    # @override_settings(MEDIA_ROOT="/www/", MEDIA_URL="http://mediaserv.com/myapp/")
    # def test_make_pdf(self):


class ContractTemplateTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        for name in ["option", "contract sent", "deposit paid", "paid"]:
            factories.BookingStatusFactory.create(name=name)

    def test_generate_contract(self):
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date|format_date('full') }} to {{ booking.end_date|format_date('full') }}..."
        )
        lodging = factories.LodgingFactory.create(contract_template=contract_template)
        content = generate_empty_contract(lodging)
        self.assertIn(lodging.name, content)
        self.assertIn("......../......../................", content)
