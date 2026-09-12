import importlib

import pytest
from django.apps import apps
from rest_framework import status
from rest_framework.test import APIClient

from core.tests import factories
from core.tests.helpers import force_login
from notifier.models import Backend, Notification, UserPrefs

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("default_groups")]

seed_migration = importlib.import_module("core.migrations.0031_seed_notification_email_off")


def make_client(user):
    api_client = APIClient()
    api_client.credentials(**force_login(user, api_client))
    return api_client


def make_user():
    return factories.StandardUserFactory.create()


# --------------------------------------------------------------------------- notification types


def test_staff_only_types_are_hidden_from_public_listing():
    names = set(Notification.objects.filter(public=True).values_list("name", flat=True))
    assert "booking-added" in names
    assert "subscription-added" not in names
    assert "subscription-modified" not in names


# --------------------------------------------------------------------------- new-user default


def test_new_user_defaults_to_email_off_but_noop_on():
    user = make_user()
    notification = Notification.objects.get(name="booking-added")
    prefs = notification.get_user_prefs(user)
    prefs_by_name = {backend.name: enabled for backend, enabled in prefs.items()}
    assert prefs_by_name == {"noop": True, "email": False}


def test_new_user_gets_an_explicit_email_off_userprefs_row():
    user = make_user()
    notification = Notification.objects.get(name="booking-added")
    email_backend = Backend.objects.get(name="email")
    assert UserPrefs.objects.filter(user=user, notification=notification, backend=email_backend, notify=False).exists()


# --------------------------------------------------------------------------- data migration


def test_seed_email_off_migration_backfills_existing_users_without_overwriting_explicit_prefs():
    user = make_user()
    notification = Notification.objects.get(name="booking-added")
    email_backend = Backend.objects.get(name="email")
    # the new-user signal already created a "False" row; flip it to True to prove the
    # migration does not clobber an explicit existing preference
    UserPrefs.objects.filter(user=user, notification=notification, backend=email_backend).update(notify=True)

    seed_migration.seed_email_off(apps, None)

    userpref = UserPrefs.objects.get(user=user, notification=notification, backend=email_backend)
    assert userpref.notify is True


def test_seed_email_off_migration_noops_without_email_backend(monkeypatch):
    def raise_does_not_exist(*args, **kwargs):
        raise Backend.DoesNotExist

    # `Backend` rows can't actually be deleted (guarded by a pre_delete signal), so simulate
    # the "email backend not created yet" case (a fresh/test database) by patching the lookup
    monkeypatch.setattr(Backend.objects, "get", raise_does_not_exist)
    # must not raise
    seed_migration.seed_email_off(apps, None)


# --------------------------------------------------------------------------- API endpoint


def test_notification_preference_list_excludes_staff_only_types():
    user = make_user()
    response = make_client(user).get("/api/notification_preference/")
    assert response.status_code == status.HTTP_200_OK
    names = {row["name"] for row in response.data}
    assert "booking-added" in names
    assert "subscription-added" not in names


def test_notification_preference_list_reflects_defaults():
    user = make_user()
    response = make_client(user).get("/api/notification_preference/")
    row = next(r for r in response.data if r["name"] == "booking-added")
    assert row["backends"] == {"noop": True, "email": False}


def test_notification_preference_update_flips_email_on():
    user = make_user()
    client = make_client(user)
    response = client.patch("/api/notification_preference/booking-added/", {"backends": {"email": True}}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["backends"]["email"] is True

    response = client.get("/api/notification_preference/")
    row = next(r for r in response.data if r["name"] == "booking-added")
    assert row["backends"]["email"] is True


def test_notification_preference_update_ignores_unknown_backend():
    user = make_user()
    client = make_client(user)
    response = client.patch("/api/notification_preference/booking-added/", {"backends": {"sms": True}}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert "sms" not in response.data["backends"]


def test_notification_preference_update_unknown_notification_is_404():
    user = make_user()
    response = make_client(user).patch(
        "/api/notification_preference/does-not-exist/", {"backends": {"email": True}}, format="json"
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_notification_preference_update_staff_only_type_is_404():
    user = make_user()
    response = make_client(user).patch(
        "/api/notification_preference/subscription-added/", {"backends": {"email": True}}, format="json"
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
