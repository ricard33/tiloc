import errno
import fcntl
import logging
import os
import tempfile

from django.core.management.base import BaseCommand

from core.cron import SyncBookingsJob

logger = logging.getLogger("cron")

# django-cron gave us "don't start a second run while one is in progress" for free via its
# CronJobLog. This job runs every 5 minutes and a slow OTA feed can take longer, so keep an
# advisory lock.
_LOCK_PATH = os.path.join(tempfile.gettempdir(), "tiloc-sync-bookings.lock")


class Command(BaseCommand):
    help = "Pull remote iCal feeds and reconcile bookings (was SyncBookingsJob)."

    def handle(self, *args, **options):
        lock = open(_LOCK_PATH, "w")
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as ex:
            if ex.errno in (errno.EACCES, errno.EAGAIN):
                logger.warning("sync_bookings: a previous run is still active, skipping")
                return
            raise
        try:
            SyncBookingsJob().do()
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)
            lock.close()
