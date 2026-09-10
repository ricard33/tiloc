from django.core.management.base import BaseCommand

from core.cron import ExportBookingsJob


class Command(BaseCommand):
    help = "Dump the domain models to xlsx under BACKUP_DIR and purge old dumps (was ExportBookingsJob)."

    def handle(self, *args, **options):
        ExportBookingsJob().do()
