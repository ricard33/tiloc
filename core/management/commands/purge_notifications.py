from django.core.management.base import BaseCommand

from core.cron import PurgeNotificationsJob


class Command(BaseCommand):
    help = "Delete old read/unread in-app notifications (was PurgeNotificationsJob)."

    def handle(self, *args, **options):
        PurgeNotificationsJob().do()
