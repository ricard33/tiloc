from django.utils.translation import gettext_lazy as _

from notifier.shortcuts import create_notification
from notifier.models import Backend

defaults_backends = Backend.objects.filter(name="noop")

create_notification('subscription-added', backends=defaults_backends)
create_notification('subscription-modified', backends=defaults_backends)
create_notification('trial_will_end', backends=defaults_backends)
create_notification('booking-added', _("Booking added"), backends=defaults_backends)
create_notification('booking-modified', _("Booking modified"), backends=defaults_backends, default_notify=False)
create_notification('booking-canceled', _("Booking canceled"), backends=defaults_backends)
create_notification('booking-uncanceled', _("Booking uncanceled"), backends=defaults_backends)
create_notification('booking-deleted', _("Booking deleted"), backends=defaults_backends)
create_notification('comment-added', _("Comment added"), backends=defaults_backends)
create_notification('comment-modified', _("Comment modified"), backends=defaults_backends)
create_notification('comment-deleted', _("Comment deleted"), backends=defaults_backends)
