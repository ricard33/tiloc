from unittest.mock import patch

import arrow
import stripe
from django.http import HttpRequest
from rest_framework.test import APITestCase

from core import api, models
from core.tests import factories
from core.tests.data.stripe_events import (
    customer_id,
    stripe_free_to_paid_plan_events,
    stripe_renew_subscription_events_1,
    stripe_renew_subscription_events_2,
)
from core.tests.helpers import force_login


class StripeSimulatorTestCase(APITestCase):
    fixtures = ["default-groups"]

    def setUp(self) -> None:
        self.account = factories.AccountFactory.create(stripe_customer_id=customer_id, subscription_set=[])
        self.user = factories.AdminUserFactory.create(account=self.account)
        self.header = force_login(self.user)

    def make_request(self, event):
        request = HttpRequest()
        request._body = event
        request.META["HTTP_STRIPE_SIGNATURE"] = "*"
        return request

    @patch("stripe.Webhook.construct_event")
    def test_subscription_creation_and_renewal(self, ConstructEventMock) -> None:
        self.assertEqual(0, models.Subscription.objects.count())
        self.assertEqual(0, models.Invoice.objects.count())
        ConstructEventMock.side_effect = lambda payload, sig, secret: stripe.Event.construct_from(
            payload, stripe.api_key
        )
        for event in stripe_free_to_paid_plan_events:
            response = api.stripe_webhook(self.make_request(event))
            self.assertEqual(200, response.status_code)

        self.assertEqual(len(stripe_free_to_paid_plan_events), ConstructEventMock.call_count)
        self.assertEqual(1, models.Subscription.objects.count())
        self.assertEqual("active", models.Subscription.objects.first().status)
        self.assertEqual(arrow.get(1706563607).datetime, models.Subscription.objects.first().current_period_end)
        self.assertEqual(1, models.Invoice.objects.count())
        self.assertEqual("paid", models.Invoice.objects.first().status)

        for event in stripe_renew_subscription_events_1:
            response = api.stripe_webhook(self.make_request(event))
            self.assertEqual(200, response.status_code)

        self.assertEqual(1, models.Subscription.objects.count())
        self.assertEqual("active", models.Subscription.objects.first().status)
        self.assertEqual(arrow.get(1709242007).datetime, models.Subscription.objects.first().current_period_end)
        self.assertEqual(2, models.Invoice.objects.count())
        self.assertEqual("draft", models.Invoice.objects.get(id="in_002").status)

        for event in stripe_renew_subscription_events_2:
            response = api.stripe_webhook(self.make_request(event))
            self.assertEqual(200, response.status_code)

        self.assertEqual(1, models.Subscription.objects.count())
        self.assertEqual("active", models.Subscription.objects.first().status)
        self.assertEqual(arrow.get(1709242007).datetime, models.Subscription.objects.first().current_period_end)
        self.assertEqual(2, models.Invoice.objects.count())
        self.assertEqual("paid", models.Invoice.objects.get(id="in_002").status)
