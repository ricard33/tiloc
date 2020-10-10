import logging
import os
from time import time

import arrow
from django.conf import settings
from django_cron import CronJobBase, Schedule

from core import models
from core.imp_exp_resources import BookingResource
from core.sync import retrieve_and_synchronize_bookings

logger = logging.getLogger("cron")


class SyncBookingsJob(CronJobBase):
    RUN_EVERY_MINS = 5

    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'core.sync_bookings'    # a unique code

    def do(self):
        t0 = time()
        logger.info("Starting booking synchronizer")
        for sync in models.BookingChannelSync.objects.filter(active=True):
            logger.info("[%s] Synchronize bookings from [%s]", sync.lodging.name, sync.channel.name)
            try:
                retrieve_and_synchronize_bookings(sync)
            except:
                logging.exception("[%s] exception during bookings synchronization from [%s]",
                                  sync.lodging.name, sync.channel.name)
        logger.info("Booking synchronizer finished in %.2f seconds", time() - t0)


class ExportBookingsJob(CronJobBase):
    schedule = Schedule(run_at_times="02:00")
    code = 'core.export_bookings'    # a unique code
    PURGE_OLDER_THAN_DAYS = 30

    @staticmethod
    def make_filename(date):
        return "bookings-" + date.strftime("%Y-%m-%d_%H-%M-%S") + ".xlsx"

    def do(self):
        dataset = BookingResource().export()
        filename = os.path.join(settings.BACKUP_DIR, self.make_filename(arrow.utcnow()))
        with open(filename, 'wb') as f:
            f.write(dataset.xlsx)

        purge_date = arrow.utcnow().shift(days=-self.PURGE_OLDER_THAN_DAYS)
        max_filename = self.make_filename(purge_date)
        for filename in os.listdir(settings.BACKUP_DIR):
            fullpath = os.path.join(settings.BACKUP_DIR, filename)
            if os.path.isfile(fullpath) and filename < max_filename:
                os.remove(fullpath)
