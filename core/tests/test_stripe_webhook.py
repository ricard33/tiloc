"""Focused tests for ``core.api.stripe_webhook`` — signature/payload rejection and the
subscription/invoice event branches that the end-to-end simulator in ``test_stripe.py`` does
not exercise in isolation.
"""

import pytest
import stripe
from django.http import HttpRequest

from core import api, models
from core.tests import factories

pytestmark = pytest.mark.django_db

CUSTOMER = "cus_webhook_test"
TS = 1_700_000_000
MONTH = 30 * 24 * 3600


def make_request(event: dict) -> HttpRequest:
    request = HttpRequest()
    request._body = event
    request.META["HTTP_STRIPE_SIGNATURE"] = "whatever"
    return request


@pytest.fixture
def construct_event(monkeypatch):
    """Make ``stripe.Webhook.construct_event`` echo the payload back as a ``stripe.Event``."""
    monkeypatch.setattr(
        "stripe.Webhook.construct_event",
        lambda payload, sig, secret: stripe.Event.construct_from(payload, stripe.api_key),
    )


@pytest.fixture
def account():
    return factories.AccountFactory(name="stripe-webhook", stripe_customer_id=CUSTOMER, subscription_set=[])


def subscription_event(event_type: str, *, status: str = "active", sub_id: str = "sub_test") -> dict:
    return {
        "type": event_type,
        "data": {
            "object": {
                "id": sub_id,
                "customer": CUSTOMER,
                "created": TS,
                "start_date": TS,
                "current_period_start": TS,
                "current_period_end": TS + MONTH,
                "status": status,
                "latest_invoice": None,
                "default_payment_method": None,
                "cancel_at_period_end": False,
                "items": {"data": [{"price": {"lookup_key": None}}]},
            }
        },
    }


def invoice_event(event_type: str, *, inv_id: str = "in_test", status: str = "paid") -> dict:
    return {
        "type": event_type,
        "data": {
            "object": {
                "id": inv_id,
                "customer": CUSTOMER,
                "subscription": None,
                "total": 1200,
                "status": status,
                "hosted_invoice_url": "https://stripe.example/invoice",
                "period_start": TS,
                "period_end": TS + MONTH,
                "next_payment_attempt": None,
                "created": TS,
            }
        },
    }


# --------------------------------------------------------------------------- #
# Signature / payload verification
# --------------------------------------------------------------------------- #
class TestWebhookVerification:
    def test_invalid_payload_returns_400(self, monkeypatch, db):
        monkeypatch.setattr("stripe.Webhook.construct_event", lambda *a, **kw: (_ for _ in ()).throw(ValueError()))

        response = api.stripe_webhook(make_request({}))

        assert response.status_code == 400

    @pytest.mark.xfail(
        strict=True,
        reason="the SignatureVerificationError branch returns HttpResponse(400) — that sets the "
        "body to '400' and leaves the status at 200, so Stripe is told the delivery succeeded.",
    )
    def test_invalid_signature_returns_400(self, monkeypatch, db):
        def boom(*a, **kw):
            raise stripe.error.SignatureVerificationError("bad sig", "sig-header")

        monkeypatch.setattr("stripe.Webhook.construct_event", boom)

        response = api.stripe_webhook(make_request({}))

        assert response.status_code == 400


# --------------------------------------------------------------------------- #
# customer.subscription.updated / deleted
# --------------------------------------------------------------------------- #
class TestSubscriptionEvents:
    def test_updated_event_syncs_the_new_status(self, construct_event, account):
        factories.SubscriptionFactory(id="sub_test", customer=account, status="active")

        response = api.stripe_webhook(make_request(subscription_event("customer.subscription.updated", status="past_due")))

        assert response.status_code == 200
        assert models.Subscription.objects.get(id="sub_test").status == "past_due"

    def test_deleted_event_marks_the_subscription_canceled(self, construct_event, account):
        factories.SubscriptionFactory(id="sub_test", customer=account, status="active")

        response = api.stripe_webhook(
            make_request(subscription_event("customer.subscription.deleted", status="canceled"))
        )

        assert response.status_code == 200
        assert models.Subscription.objects.get(id="sub_test").status == "canceled"

    def test_updated_event_for_an_unknown_customer_is_ignored(self, construct_event, db):
        response = api.stripe_webhook(make_request(subscription_event("customer.subscription.updated")))

        assert response.status_code == 200
        assert not models.Subscription.objects.exists()


# --------------------------------------------------------------------------- #
# invoice.paid
# --------------------------------------------------------------------------- #
class TestInvoiceEvents:
    def test_invoice_paid_is_stored(self, construct_event, account):
        response = api.stripe_webhook(make_request(invoice_event("invoice.paid")))

        assert response.status_code == 200
        invoice = models.Invoice.objects.get(id="in_test")
        assert invoice.status == "paid"
        assert invoice.total == 12  # cents -> currency units

    def test_invoice_paid_for_an_unknown_customer_is_ignored(self, construct_event, db):
        response = api.stripe_webhook(make_request(invoice_event("invoice.paid")))

        assert response.status_code == 200
        assert not models.Invoice.objects.exists()
