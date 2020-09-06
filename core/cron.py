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
            retrieve_and_synchronize_bookings(sync)
        logger.info("Booking synchronizer finished in %.2f seconds", time() - t0)


class ExportBookingsJob(CronJobBase):
    schedule = Schedule(run_at_times="02:00")
    code = 'core.export_bookings'    # a unique code

    def do(self):
        dataset = BookingResource().export()
        filename = os.path.join(settings.BACKUP_DIR, "bookings-" + arrow.utcnow().isoformat(sep='_') + ".xlsx")
        with open(filename, 'wb') as f:
            f.write(dataset.xlsx)
