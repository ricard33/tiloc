import logging

from anymail.message import AnymailMessage
from django.conf import settings
from django.core.mail import get_connection
from django.template.loader import render_to_string

from core import models

logger = logging.getLogger("mail_tools")


def get_email_backend(backend_name):
    if backend_name == "django":
        return "django.core.mail.backends.smtp.EmailBackend"
    elif backend_name in ("sendinblue", "mailjet"):
        return "anymail.backends.%s.EmailBackend" % backend_name
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured("Backend [%s] not implemented" % backend_name)


def get_email_templates(user: models.User, backend_name: str):
    return {
        "welcome": {
            "template_id": {"sendinblue": 1, "mailjet": "5448184"}.get(backend_name),
            "template_html": {"django": "signup/welcome_body.html"}.get(backend_name),
            "template_text": {"django": "signup/welcome_body.txt"}.get(backend_name),
            "subject": {"django": "Je vous souhaite la bienvenue à votre essai gratuit Tiloc"}.get(backend_name),
            "from": {"django": "Cédric de Tiloc <info@tiloc.fr>"}.get(backend_name),
            "data": {
                "first_name": user.first_name,
            },
        }
    }


def send_welcome_email(user: models.User, backend_name=None):
    send_generic_email("welcome", user, backend_name)


def send_generic_email(template_name, user: models.User, backend_name=None):
    if not backend_name:
        backend = settings.EMAIL_BACKEND
        backend_name = get_backend_name(backend)
    else:
        backend = get_email_backend(backend_name)
    logger.debug("Sending welcome using %s [%s]", backend_name, backend)
    template = get_email_templates(user, backend_name)[template_name]
    connection = get_connection(backend)
    text = html = None
    context = dict(user=user, base_url=settings.EMAIL_PAGE_DOMAIN, **template["data"])
    if template["template_text"]:
        text = render_to_string(template["template_text"], context)
    if template["template_html"]:
        html = render_to_string(template["template_html"], context)

    message = AnymailMessage(
        to=[user.email], connection=connection, subject=template["subject"], body=text
    )
    if html:
        message.attach_alternative(html, "text/html")
    message.from_email = template["from"]
    message.template_id = template["template_id"]
    message.merge_global_data = template["data"]

    message.send()

    status = message.anymail_status
    logger.info("[Sent welcome] %s", status)
    if status.recipients:
        logger.info("[Sent welcome] %s: %s", user.email, status.recipients[user.email].status)


def get_backend_name(backend):
    if backend.startswith("anymail.backends."):
        backend_name = backend.split(".")[2]
    else:
        backend_name = "django"
    return backend_name
