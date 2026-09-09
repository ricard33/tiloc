import pytest

from core.auth_backend import EmailBackend
from core.tests import factories

pytestmark = pytest.mark.django_db

PASSWORD = "P@55w0rd"  # baked into ``_UserFactory``


@pytest.fixture
def backend() -> EmailBackend:
    return EmailBackend()


class TestEmailBackendAuthenticate:
    def test_valid_email_and_password_return_the_user(self, backend, default_groups):
        user = factories.StandardUserFactory()

        assert backend.authenticate(None, username=user.email, password=PASSWORD) == user

    def test_wrong_password_returns_none(self, backend, default_groups):
        user = factories.StandardUserFactory()

        assert backend.authenticate(None, username=user.email, password="wrong") is None

    def test_unknown_email_returns_none(self, backend, db):
        assert backend.authenticate(None, username="nobody@example.com", password=PASSWORD) is None

    def test_user_of_an_inactive_account_is_not_found(self, backend, default_groups):
        lodging = factories.LodgingFactory(account=factories.InactiveAccount())
        user = factories.StandardUserFactory(account=lodging.account)

        assert backend.authenticate(None, username=user.email, password=PASSWORD) is None

    def test_user_without_an_account_can_authenticate(self, backend, db):
        user = factories._UserFactory(account=None, email="global@example.com")

        assert backend.authenticate(None, username=user.email, password=PASSWORD) == user

    def test_inactive_user_with_an_active_account_still_authenticates(self, backend, default_groups):
        """The backend does not call ``user_can_authenticate``; ``LoginAPI`` is what blocks
        inactive users. This test pins that behaviour so a change to it is deliberate."""
        user = factories.StandardUserFactory(is_active=False)

        assert backend.authenticate(None, username=user.email, password=PASSWORD) == user


class TestEmailBackendPermissions:
    def test_get_all_permissions_delegates_to_modelbackend(self, backend, default_groups):
        user = factories.AdminUserFactory()

        perms = backend.get_all_permissions(user)

        assert perms  # the administrator group grants a non-empty permission set
        assert all("." in perm for perm in perms)
