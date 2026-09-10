import arrow
import pytest
from django.core.management import call_command
from requests import HTTPError

from core import models
from core.cron import ExportBookingsJob, PurgeNotificationsJob, SyncBookingsJob
from core.tests import factories
from notifier.models import Backend, Notification, SentNotification

pytestmark = pytest.mark.django_db

SYNC_TARGET = "core.cron.retrieve_and_synchronize_bookings"


# --------------------------------------------------------------------------- #
# SyncBookingsJob
# --------------------------------------------------------------------------- #
@pytest.fixture
def eligible_sync(default_groups):
    """A sync that matches every filter of ``SyncBookingsJob``.

    ``BookingChannelSyncFactory`` -> ``LodgingFactory`` -> ``AccountFactory`` gives an
    active, non-demo account with an ``active`` subscription. ``last_import`` is set so the
    "stale since 6h" branch (cron.py) is not exercised by the happy-path tests.
    """
    return factories.BookingChannelSyncFactory.create(last_import=arrow.utcnow().datetime)


class TestSyncBookingsJob:
    def test_runs_synchronization_for_an_eligible_sync(self, eligible_sync, monkeypatch):
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == [eligible_sync]

    def test_demo_mode_skips_everything(self, eligible_sync, settings, monkeypatch):
        settings.IS_DEMO = True
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == []

    def test_skips_the_demo_account(self, default_groups, settings, monkeypatch):
        demo_account = factories.AccountFactory(name=settings.DEMO_ACCOUNT_NAME)
        lodging = factories.LodgingFactory(account=demo_account)
        factories.BookingChannelSyncFactory(lodging=lodging, last_import=arrow.utcnow().datetime)
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == []

    def test_skips_inactive_accounts(self, default_groups, monkeypatch):
        lodging = factories.LodgingFactory(account=factories.InactiveAccount())
        factories.BookingChannelSyncFactory(lodging=lodging, last_import=arrow.utcnow().datetime)
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == []

    def test_skips_accounts_without_an_active_or_trialing_subscription(self, default_groups, monkeypatch):
        sync = factories.BookingChannelSyncFactory(last_import=arrow.utcnow().datetime)
        models.Subscription.objects.filter(customer=sync.lodging.account).update(
            status=models.Subscription.Status.canceled.value
        )
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == []

    def test_trialing_subscriptions_are_synchronized(self, default_groups, monkeypatch):
        sync = factories.BookingChannelSyncFactory(last_import=arrow.utcnow().datetime)
        models.Subscription.objects.filter(customer=sync.lodging.account).update(
            status=models.Subscription.Status.trialing.value
        )
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == [sync]

    def test_skips_inactive_syncs(self, default_groups, monkeypatch):
        factories.BookingChannelSyncFactory(active=False, last_import=arrow.utcnow().datetime)
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == []

    def test_network_error_is_stored_on_the_sync(self, eligible_sync, monkeypatch):
        def boom(sync):
            raise HTTPError("503 Service Unavailable")

        monkeypatch.setattr(SYNC_TARGET, boom)

        SyncBookingsJob().do()  # must not propagate

        eligible_sync.refresh_from_db()
        assert "503 Service Unavailable" in eligible_sync.last_import_error

    def test_unexpected_error_is_swallowed(self, eligible_sync, monkeypatch):
        def boom(sync):
            raise ValueError("something unexpected")

        monkeypatch.setattr(SYNC_TARGET, boom)

        SyncBookingsJob().do()  # must not propagate

        eligible_sync.refresh_from_db()
        # an unexpected error is only logged, not recorded on the row
        assert not eligible_sync.last_import_error

    def test_sync_stale_for_more_than_6_hours_is_logged_as_error(self, default_groups, monkeypatch, caplog):
        factories.BookingChannelSyncFactory(last_import=arrow.utcnow().shift(hours=-7).datetime)
        monkeypatch.setattr(SYNC_TARGET, lambda sync: None)

        with caplog.at_level("ERROR"):
            SyncBookingsJob().do()

        assert any("in error since" in record.message for record in caplog.records)

    def test_sync_that_never_imported_does_not_crash_the_job(self, default_groups, monkeypatch):
        """A sync with ``last_import=None`` must not raise ``TypeError`` in the "stale since 6h" check."""
        sync = factories.BookingChannelSyncFactory(last_import=None)
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        SyncBookingsJob().do()

        assert calls == [sync]

    def test_management_command_runs_the_job_under_the_lock(self, eligible_sync, monkeypatch):
        calls = []
        monkeypatch.setattr(SYNC_TARGET, calls.append)

        call_command("sync_bookings")

        assert calls == [eligible_sync]


# --------------------------------------------------------------------------- #
# ExportBookingsJob
# --------------------------------------------------------------------------- #
EXPORTED_MODELS = {
    "Booking",
    "BookingChannel",
    "Comment",
    "ContractTemplate",
    "Lodging",
    "Payment",
    "Service",
    "User",
}


class TestExportBookingsJob:
    def test_exports_one_xlsx_file_per_resource(self, tmp_path, settings, default_groups):
        settings.BACKUP_DIR = str(tmp_path)
        factories.BookingFactory()  # a bit of data to export

        ExportBookingsJob().do()

        exported = {path.name.split("-", 1)[0] for path in tmp_path.glob("*.xlsx")}
        assert EXPORTED_MODELS <= exported

    def test_removes_exports_older_than_30_days(self, tmp_path, settings, default_groups):
        settings.BACKUP_DIR = str(tmp_path)
        stale = tmp_path / "Booking-2000-01-01_00-00-00.xlsx"
        stale.write_bytes(b"stale")
        recent = tmp_path / ("Booking-" + arrow.utcnow().strftime("%Y-%m-%d_%H-%M-%S") + ".xlsx")
        recent.write_bytes(b"recent")

        ExportBookingsJob().do()

        assert not stale.exists()
        assert recent.exists()

    def test_make_filename_is_sortable_by_date(self):
        older = ExportBookingsJob.make_filename("Booking", arrow.get("2024-01-01T00:00:00"))
        newer = ExportBookingsJob.make_filename("Booking", arrow.get("2024-06-01T00:00:00"))
        assert older < newer


# --------------------------------------------------------------------------- #
# PurgeNotificationsJob
# --------------------------------------------------------------------------- #
@pytest.fixture
def notification_env(default_groups):
    backend = Backend.objects.create(name="test-backend", klass="core.notifier_backend.NoopBackend")
    notification = Notification.objects.create(name="test-notification", display_name="Test notification")
    user = factories._UserFactory.create(email="purge-target@example.com")
    return backend, notification, user


def make_sent_notification(notification_env, *, read: bool, age_days: int) -> SentNotification:
    backend, notification, user = notification_env
    sent = SentNotification.objects.create(
        user=user, notification=notification, backend=backend, success=True, read=read
    )
    # ``created`` is auto_now_add, so it can only be back-dated with a raw UPDATE.
    SentNotification.objects.filter(pk=sent.pk).update(
        created=arrow.utcnow().shift(days=-age_days).datetime
    )
    return sent


class TestPurgeNotificationsJob:
    def test_deletes_read_notifications_older_than_7_days(self, notification_env):
        old = make_sent_notification(notification_env, read=True, age_days=8)
        fresh = make_sent_notification(notification_env, read=True, age_days=3)

        PurgeNotificationsJob().do()

        assert not SentNotification.objects.filter(pk=old.pk).exists()
        assert SentNotification.objects.filter(pk=fresh.pk).exists()

    def test_deletes_unread_notifications_only_after_180_days(self, notification_env):
        borderline = make_sent_notification(notification_env, read=False, age_days=179)
        expired = make_sent_notification(notification_env, read=False, age_days=181)

        PurgeNotificationsJob().do()

        assert SentNotification.objects.filter(pk=borderline.pk).exists()
        assert not SentNotification.objects.filter(pk=expired.pk).exists()

    def test_keeps_recent_unread_notification_that_would_be_purged_if_read(self, notification_env):
        unread = make_sent_notification(notification_env, read=False, age_days=8)

        PurgeNotificationsJob().do()

        assert SentNotification.objects.filter(pk=unread.pk).exists()
