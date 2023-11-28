from django.utils.translation import gettext_lazy as _
from notifier.shortcuts import create_notification

create_notification('subscription-added')
create_notification('subscription-modified')
create_notification('booking-added', _("Booking added"))
create_notification('booking-modified', _("Booking modified"), default_notify=False)
create_notification('booking-canceled', _("Booking canceled"))
create_notification('booking-uncanceled', _("Booking uncanceled"))
create_notification('booking-deleted', _("Booking deleted"))
create_notification('comment-added', _("Comment added"))
create_notification('comment-modified', _("Comment modified"))
create_notification('comment-deleted', _("Comment deleted"))
