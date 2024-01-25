from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import factories
from core.tests.helpers import force_login


class BookingTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.StandardUserFactory.create()
        self.user.lodgings.add(self.lodging)
        self.header = force_login(self.user, self.client)

    def test_add_comment(self):
        booking = factories.BookingFactory(lodgings=self.lodging)
        response = self.client.post("/api/comment/", {
            "booking_id": booking.id,
            "content": "test comment"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(1, booking.comments.count())
