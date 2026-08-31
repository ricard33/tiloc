import pytest
from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.test import APIClient

from core import models
from core.tests import factories
from core.tests.helpers import force_login

pytestmark = pytest.mark.django_db


@pytest.fixture
def lodging():
    return factories.LodgingFactory.create()


@pytest.fixture
def account_user(default_groups, lodging):
    user = factories.StandardUserFactory.create()
    user.lodgings.add(lodging)
    return user


@pytest.fixture
def client(account_user):
    return make_client(account_user)


def make_client(user):
    api_client = APIClient()
    api_client.credentials(**force_login(user, api_client))
    return api_client


def make_booking(lodging, **kwargs):
    """Create a booking and snapshot a first history row to diff later edits against.

    ``BookingFactory`` mutes ``post_save`` (factories.py), so a plain ``.create()`` records no
    history; an explicit ``save()`` outside the factory gives us the baseline revision.
    """
    booking = factories.BookingFactory.create(lodgings=lodging, **kwargs)
    booking.save()
    return booking


def get_history(api_client, booking_id):
    return api_client.get(f"/api/booking/{booking_id}/history/")


def changed_fields(entries):
    return {change["field"] for entry in entries for change in entry["changes"]}


def test_history_reports_changed_fields_and_author(client, account_user, lodging):
    booking = make_booking(lodging, status="option")

    response = client.patch(
        f"/api/booking/{booking.id}/",
        {"status": "paid", "notes": "updated note", "begin_date": "2031-01-05", "end_date": "2031-01-12"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data

    response = get_history(client, booking.id)
    assert response.status_code == status.HTTP_200_OK
    entries = response.data

    latest = entries[0]  # newest first
    assert latest["type"] == "~"
    changes = {change["field"]: change for change in latest["changes"]}
    assert changes["status"] == {"field": "status", "old": "option", "new": "paid"}
    assert changes["begin_date"]["new"] == "2031-01-05"
    assert changes["notes"]["old"] is None
    assert changes["notes"]["new"] == "updated note"
    assert latest["user"] == {
        "id": account_user.id,
        "full_name": account_user.get_full_name(),
        "email": account_user.email,
    }


def test_history_user_is_null_for_changes_made_outside_a_request(client, lodging):
    booking = make_booking(lodging, status="option")
    booking.status = "paid"
    booking.save()

    response = get_history(client, booking.id)
    changed = [entry for entry in response.data if entry["changes"]]
    assert changed, response.data
    assert changed[0]["changes"][0]["field"] == "status"
    assert changed[0]["user"] is None


def test_history_is_scoped_to_the_account(client, lodging):
    booking = make_booking(lodging)

    other_account = factories.AccountFactory(name="other-account")
    outsider = factories.StandardUserFactory.create(account=other_account, email="outsider@example.com")

    response = get_history(make_client(outsider), booking.id)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_history_requires_authentication(client, lodging):
    booking = make_booking(lodging)
    response = get_history(APIClient(), booking.id)
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


def test_history_hides_price_fields_without_view_prices(default_groups, lodging):
    priced_user = factories.StandardUserFactory.create()  # "standard" group has core.view_prices
    priced_user.lodgings.add(lodging)
    priced_client = make_client(priced_user)

    booking = make_booking(lodging)
    priced_client.patch(
        f"/api/booking/{booking.id}/",
        {"price": "999.00", "notes": "priced change"},
        format="json",
    )

    plain_user = factories._UserFactory.create(email="noprice@example.com")
    plain_user.user_permissions.add(Permission.objects.get(codename="view_booking"))
    plain_user.lodgings.add(lodging)
    plain_user = models.User.objects.get(pk=plain_user.pk)  # drop the permission cache

    priced = changed_fields(priced_client.get(f"/api/booking/{booking.id}/history/").data)
    plain = changed_fields(make_client(plain_user).get(f"/api/booking/{booking.id}/history/").data)

    assert "price" in priced
    assert "price" not in plain
    assert "notes" in plain
