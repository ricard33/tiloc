import pytest
from rest_framework import status
from rest_framework.test import APIClient

from core import models
from core.tests import factories

pytestmark = pytest.mark.django_db

PASSWORD = "P@55w0rd"  # the password baked into ``_UserFactory``

# ``AuthenticationFailed`` renders as 403 (not 401) here: the only authentication class is
# ``SessionAuthentication``, which offers no ``WWW-Authenticate`` header, so DRF downgrades 401 -> 403.
AUTH_FAILED = status.HTTP_403_FORBIDDEN


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def sent_emails(monkeypatch):
    """Capture the users passed to the (otherwise threaded / external) mail helpers in ``core.api``.

    ``django_email_verification`` sends on a background thread by default and ``send_generic_email``
    talks to an ESB, so asserting on ``mail.outbox`` is racy. We record the recipients instead.
    """
    calls: dict[str, list] = {"verification": [], "reset": [], "generic": []}
    monkeypatch.setattr("core.api.send_verification_email", lambda user, **kw: calls["verification"].append(user))
    monkeypatch.setattr("core.api.send_reset_password", lambda user, **kw: calls["reset"].append(user))
    monkeypatch.setattr("core.api.send_generic_email", lambda template, user, *a, **kw: calls["generic"].append(user))
    return calls


# --------------------------------------------------------------------------- #
# LoginAPI  --  POST /api/auth/login/
# --------------------------------------------------------------------------- #
class TestLoginAPI:
    def test_valid_credentials_return_a_token(self, api_client, default_groups):
        user = factories.StandardUserFactory()

        response = api_client.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["token"]

    def test_wrong_password_is_rejected(self, api_client, default_groups):
        user = factories.StandardUserFactory()

        response = api_client.post("/api/auth/login/", {"email": user.email, "password": "nope"})

        assert response.status_code == AUTH_FAILED

    def test_unknown_email_is_rejected(self, api_client, db):
        response = api_client.post("/api/auth/login/", {"email": "ghost@example.com", "password": PASSWORD})

        assert response.status_code == AUTH_FAILED

    def test_user_of_an_inactive_account_cannot_log_in(self, api_client, default_groups):
        lodging = factories.LodgingFactory(account=factories.InactiveAccount())
        user = factories.StandardUserFactory(account=lodging.account)

        response = api_client.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})

        assert response.status_code == AUTH_FAILED

    def test_inactive_user_cannot_log_in(self, api_client, default_groups):
        user = factories.StandardUserFactory(is_active=False)

        response = api_client.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})

        assert response.status_code == AUTH_FAILED

    def test_missing_fields_return_400(self, api_client, db):
        response = api_client.post("/api/auth/login/", {"email": "someone@example.com"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --------------------------------------------------------------------------- #
# LogoutAPI  --  POST /api/auth/logout/
# --------------------------------------------------------------------------- #
class TestLogoutAPI:
    def test_logout_while_authenticated(self, api_client, default_groups):
        user = factories.StandardUserFactory()
        api_client.force_authenticate(user=user)

        response = api_client.post("/api/auth/logout/")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_logout_while_anonymous_is_a_noop(self, api_client, db):
        response = api_client.post("/api/auth/logout/")

        assert response.status_code == status.HTTP_204_NO_CONTENT


# --------------------------------------------------------------------------- #
# SignUpAPI  --  POST /api/signup/
# --------------------------------------------------------------------------- #
SIGNUP_PAYLOAD = {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "password": "s3cr3t-p4ss",
}


class TestSignUpAPI:
    def test_creates_account_user_and_sends_verification_email(self, api_client, default_groups, sent_emails):
        response = api_client.post("/api/signup/", SIGNUP_PAYLOAD)

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["token"]

        user = models.User.objects.get(email=SIGNUP_PAYLOAD["email"])
        assert user.account is not None
        assert list(user.groups.values_list("name", flat=True)) == ["administrator"]
        assert sent_emails["verification"] == [user]
        assert sent_emails["generic"] == [user]  # the welcome email

    def test_duplicate_email_returns_409(self, api_client, default_groups, sent_emails):
        factories.StandardUserFactory(email=SIGNUP_PAYLOAD["email"])

        response = api_client.post("/api/signup/", SIGNUP_PAYLOAD)

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["code"] == "EMAIL_ALREADY_IN_USE"

    def test_missing_fields_return_400(self, api_client, default_groups):
        response = api_client.post("/api/signup/", {"email": "half@example.com"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not models.User.objects.filter(email="half@example.com").exists()

    def test_ignores_an_unknown_plan(self, api_client, default_groups, sent_emails):
        response = api_client.post("/api/signup/", {**SIGNUP_PAYLOAD, "plan": "does-not-exist"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert models.User.objects.filter(email=SIGNUP_PAYLOAD["email"]).exists()


# --------------------------------------------------------------------------- #
# ResetPasswordAPI  --  POST /api/auth/reset_password/
# --------------------------------------------------------------------------- #
class TestResetPasswordAPI:
    def test_sends_a_reset_link_to_a_known_user(self, api_client, default_groups, sent_emails):
        user = factories.StandardUserFactory()

        response = api_client.post("/api/auth/reset_password/", {"email": user.email})

        assert response.status_code == status.HTTP_200_OK
        assert sent_emails["reset"] == [user]

    def test_unknown_email_still_returns_200_and_sends_nothing(self, api_client, db, sent_emails):
        response = api_client.post("/api/auth/reset_password/", {"email": "ghost@example.com"})

        assert response.status_code == status.HTTP_200_OK
        assert sent_emails["reset"] == []

    @pytest.mark.xfail(
        strict=True,
        reason="ResetPasswordAPI reads request.data['email'] directly; a missing key raises "
        "KeyError and returns 500 instead of a 400.",
    )
    def test_missing_email_returns_400(self, api_client, db):
        response = api_client.post("/api/auth/reset_password/", {})

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --------------------------------------------------------------------------- #
# resend_verification  --  POST /api/auth/resend_verification/
# --------------------------------------------------------------------------- #
class TestResendVerification:
    def test_authenticated_user_gets_a_fresh_verification_email(self, api_client, default_groups, sent_emails):
        user = factories.StandardUserFactory()
        api_client.force_authenticate(user=user)

        response = api_client.post("/api/auth/resend_verification/")

        assert response.status_code == status.HTTP_200_OK
        assert sent_emails["verification"] == [user]

    def test_anonymous_request_is_rejected(self, api_client, db, sent_emails):
        response = api_client.post("/api/auth/resend_verification/")

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert sent_emails["verification"] == []
