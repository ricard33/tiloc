import logging
import os
from datetime import timedelta
from ssl import SSLError
from time import time

import arrow
import urllib3
from django.conf import settings
from django.db import transaction
from import_export.resources import modelresource_factory
from requests import HTTPError

from core import models
from core.imp_exp_resources import BookingResource, CommentResource, UserResource
from core.sync import retrieve_and_synchronize_bookings
from notifier.models import SentNotification

logger = logging.getLogger("cron")

# These jobs used to be django-cron CronJobBase classes; django-cron is unmaintained and its
# migrations break on Django >= 5.1. They are now plain classes invoked by the management
# commands in core/management/commands/ (scheduled by the host's cron).


class SyncBookingsJob:
    RUN_EVERY_MINS = 5

    def do(self):
        if settings.IS_DEMO:
            return
        t0 = time()
        logger.info("Starting booking synchronizer")
        for sync in (
            models.BookingChannelSync.objects.exclude(lodging__account__name=settings.DEMO_ACCOUNT_NAME)
            .exclude(lodging__account__is_active=False)
            .filter(lodging__account__subscription__status__in=[models.Subscription.Status.active.value,
                                                                models.Subscription.Status.trialing.value])
            .filter(active=True)
        ):
            logger.info("[%s] Synchronize bookings from [%s]", sync.lodging.name, sync.channel.name)
            try:
                retrieve_and_synchronize_bookings(sync)
            except (HTTPError, SSLError, urllib3.exceptions.HTTPError, ConnectionError) as ex:
                logging.warning(
                    "[%s] Request error [%s] during bookings synchronization from [%s]",
                    sync.lodging.name,
                    ex,
                    sync.channel.name,
                )
                with transaction.atomic():
                    sync.last_import_error = str(ex)
                    sync.save(update_fields=["last_import_error"])
            except Exception:
                logging.exception(
                    "[%s] exception during bookings synchronization from [%s]", sync.lodging.name, sync.channel.name
                )
            if sync.last_import and (arrow.utcnow().datetime - sync.last_import) > timedelta(hours=6):
                logging.error(
                    "[%s] bookings synchronization from [%s] in error since %d hours",
                    sync.lodging.name,
                    sync.channel.name,
                    (arrow.utcnow().datetime - sync.last_import).total_seconds() / 3600,
                )
        logger.info("Booking synchronizer finished in %.2f seconds", time() - t0)


class ExportBookingsJob:
    PURGE_OLDER_THAN_DAYS = 30

    @staticmethod
    def make_filename(model_name, date):
        return model_name + "-" + date.strftime("%Y-%m-%d_%H-%M-%S") + ".xlsx"

    def do(self):
        for Resource in [
            BookingResource,
            modelresource_factory(models.BookingChannel),
            CommentResource,
            modelresource_factory(models.ContractTemplate),
            modelresource_factory(models.Lodging),
            modelresource_factory(models.Payment),
            modelresource_factory(models.Service),
            UserResource,
        ]:
            self.export_ressource(Resource)

    def export_ressource(self, Resource):
        model_name = Resource._meta.model.__name__
        dataset = Resource().export()
        filename = os.path.join(settings.BACKUP_DIR, self.make_filename(model_name, arrow.utcnow()))
        with open(filename, "wb") as f:
            try:
                f.write(dataset.xlsx)
            except Exception:
                logger.exception("Exception during export")

        purge_date = arrow.utcnow().shift(days=-self.PURGE_OLDER_THAN_DAYS)
        max_filename = self.make_filename(model_name, purge_date)
        for filename in os.listdir(settings.BACKUP_DIR):
            if filename.startswith(model_name + "-"):
                fullpath = os.path.join(settings.BACKUP_DIR, filename)
                if os.path.isfile(fullpath) and filename < max_filename:
                    os.remove(fullpath)


class PurgeNotificationsJob:
    READ_NOTIFICATIONS_MAX_DAYS = 7
    UNREAD_NOTIFICATIONS_MAX_DAYS = 180

    def do(self):
        logger.info("Purge old notifications")
        SentNotification.objects.filter(read=True,
                                        created__lte=arrow.utcnow().shift(days=-self.READ_NOTIFICATIONS_MAX_DAYS).datetime
                                        ).delete()
        SentNotification.objects.filter(read=False,
                                        created__lte=arrow.utcnow().shift(days=-self.UNREAD_NOTIFICATIONS_MAX_DAYS).datetime
                                        ).delete()
