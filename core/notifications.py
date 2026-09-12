from django.utils.translation import gettext_lazy as _

from notifier.models import Backend
from notifier.shortcuts import create_notification

defaults_backends = Backend.objects.filter(name="noop")
# customer-facing notifications also offer email, opt-in (see the new-user signal and the
# data migration that seed an explicit "email off" UserPrefs so nothing changes by default)
customer_backends = Backend.objects.filter(name__in=["noop", "email"])

# staff-only: sent to internal Tiloc users (`is_staff=True`), not shown in the user-facing
# notification preferences page (`public=False`)
create_notification("subscription-added", backends=defaults_backends, public=False)
create_notification("subscription-modified", backends=defaults_backends, public=False)

create_notification("trial_will_end", _("Trial ending soon"), backends=customer_backends)
create_notification("booking-added", _("Booking added"), backends=customer_backends)
create_notification("booking-modified", _("Booking modified"), backends=customer_backends, default_notify=False)
create_notification("booking-canceled", _("Booking canceled"), backends=customer_backends)
create_notification("booking-uncanceled", _("Booking uncanceled"), backends=customer_backends)
create_notification("booking-deleted", _("Booking deleted"), backends=customer_backends)
create_notification("comment-added", _("Comment added"), backends=customer_backends)
create_notification("comment-modified", _("Comment modified"), backends=customer_backends)
create_notification("comment-deleted", _("Comment deleted"), backends=customer_backends)
