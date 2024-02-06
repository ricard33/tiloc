from unittest import TestCase

from rest_framework import status
from rest_framework.test import APITestCase

from core.contracts import format_decimal, generate_contract, generate_preview_contract
from core.tests import factories
from core.tests.helpers import force_login


class ContractTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        pass

    def test_generate_contract(self):
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}..."
        )
        booking = factories.BookingFactory.create(lodgings__contract_template=contract_template)
        generate_contract(booking)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertIn(booking.lodging.name, booking.contract.content)

    def test_generate_contract_without_template(self):
        booking = factories.BookingFactory.create(lodgings__contract_template=None)
        generate_contract(booking)
        self.assertIsNotNone(booking.contract)
        self.assertIsNotNone(booking.contract.id)
        self.assertIn(booking.lodging.name, booking.contract.content)

    def test_generate_contract_with_api(self):
        user = factories.StandardUserFactory.create()
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ lodging.name }}: {{ booking.guest_name }} from {{ booking.begin_date }} to {{ booking.end_date }}..."
        )
        booking = factories.BookingFactory.create(lodgings__contract_template=contract_template)
        user.lodgings.add(booking.lodging)
        header = force_login(user, self.client)
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
        pass

    def test_generate_contract(self):
        contract_template = factories.ContractTemplateFactory.create(
            content="{{ Logement_NOM }}: {{ Voyageur_NOM_COMPLET }} from {{ Réservation_DATE_ARRIVEE }} to {{ Réservation_DATE_DEPART }}..."
        )
        lodging = factories.LodgingFactory.create(contract_template=contract_template)
        booking = factories.BookingFactory.create(lodgings=lodging)
        content = generate_contract(booking, lodgings=[lodging]).content
        self.assertIn(lodging.name, content)
        self.assertIn(booking.guest_name, content)

    def test_generate_preview_contract(self):
        content = "{{ Logement_NOM }}: {{ Voyageur_NOM_COMPLET }} from {{ Réservation_DATE_ARRIVEE }} to {{ Réservation_DATE_DEPART }}..."
        lodging = factories.LodgingFactory.create()
        content = generate_preview_contract(content, lodging)
        self.assertIn(lodging.name, content)


class FormatDecimalTestCase(TestCase):
    def test_integer(self):
        self.assertEqual("1", format_decimal(1))
        self.assertEqual("0", format_decimal(0))
        self.assertEqual("10", format_decimal(10))
        self.assertEqual("100", format_decimal(100))
        self.assertEqual("1\u202f000", format_decimal(1000))
        self.assertEqual("-1\u202f000", format_decimal(-1000))

    def test_decimal(self):
        self.assertEqual("1,13", format_decimal(1.13, "fr"))
        self.assertEqual("0,11", format_decimal(0.11, "fr"))
        self.assertEqual("23,01", format_decimal(23.01, "fr"))
        self.assertEqual("23,10", format_decimal(23.1, "fr"))
        self.assertEqual("2\u202f453,10", format_decimal(2453.1, "fr"))
        self.assertEqual("-2\u202f453,10", format_decimal(-2453.1, "fr"))
