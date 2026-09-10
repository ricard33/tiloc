from django.core.management.base import BaseCommand

from core.mail_tools import send_generic_email
from core.models import User


class Command(BaseCommand):
    help = "Send an email (for testing))"

    def add_arguments(self, parser):
        parser.add_argument("template", type=str)
        parser.add_argument(
            "user",
            help="email recipient",
        )
        parser.add_argument(
            "--backend",
            help="Backend to send email (django, brevo or mailjet)",
        )

    def handle(self, *args, **options):
        template = options["template"]
        user_email = options["user"]
        user = User.objects.get(email=user_email)
        backend = options["backend"]
        send_generic_email(template, user, backend)
