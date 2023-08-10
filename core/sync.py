import logging

import arrow
import requests
from django.db import transaction
from ics import Calendar

from core import models
from location import __date__, __version__

logger = logging.getLogger("sync")


def retrieve_ical(url) -> str:
    logger.debug("Requesting ical from %s" % url)
    r = requests.get(
        url, headers={"User-agent": f'TiLoc {__version__} (build {__date__.isoformat(timespec="seconds")}'}
    )
    if r.status_code != 200:
        logger.warning("HTTP Error requesting ical @ [%s]: [%d] %s", url, r.status_code, r.text)
        r.raise_for_status()
    return r.text


@transaction.atomic
def synchronize_bookings(sync: models.BookingChannelSync, ical_content: str):
    lodging = sync.lodging
    channel = sync.channel
    if ical_content:
        c = Calendar(ical_content)
    else:
        # Some OTA (like Booking) return empty string for empty calendar
        c = Calendar()
    event_uids = []
    for event in c.events:
        event_uids.append(event.uid)

        # HACK Ignoring fake event created by Airbnb. Until we find other cases like this, we can keep this simple hack
        if event.summary in ["Airbnb (Not available)"]:
            continue

        if (
            event.uid
            and models.Booking.objects.filter(
                lodging=lodging, source_uid=event.uid, cancelled=False, deleted=False
            ).exists()
        ):
            logger.debug("Ignoring existing event [%s -> %s: %s]", event.begin, event.end, event.summary)
            continue

        same_bookings = models.Booking.objects.filter(
            lodging=lodging,
            source_uid__isnull=True,
            begin_date=event.begin.date(),
            end_date=event.end.date(),
            cancelled=False,
            deleted=False,
        )

        if same_bookings.exists():
            booking = same_bookings.first()
            logger.info("Found booking with same dates for event [%s -> %s: %s]", event.begin, event.end, event.summary)
            booking.source_uid = event.uid
            booking.save()
            continue

        logger.debug("Creating booking for event [%s -> %s: %s]", event.begin, event.end, event.summary)
        models.Booking.objects.create(
            lodging=lodging,
            source=channel,
            source_uid=event.uid,
            guest_name=event.summary,
            status=channel.default_booking_status or models.BookingStatus.objects.filter(account=lodging.property.account).first(),
            begin_date=event.begin.date(),
            end_date=event.end.date(),
            duration=(event.end.date() - event.begin.date()).days,
            notes=event.description,
            price=0,
            deposit=0,
        )

    # try to detect booking that were cancelled by OTA
    for booking in models.Booking.objects.filter(
        source=channel, lodging=lodging, end_date__gt=arrow.utcnow().date(), cancelled=False, deleted=False
    ):
        if booking.source_uid not in event_uids:
            booking.cancelled = True
            booking.notes = ("**CANCELLED by %s on %s\n" % (channel.name, arrow.utcnow().date())) + (booking.notes or "")
            booking.save(update_fields=["cancelled", "notes"])

    sync.last_import = arrow.utcnow().datetime
    sync.last_import_error = ""
    sync.save()


def retrieve_and_synchronize_bookings(sync: models.BookingChannelSync):
    return synchronize_bookings(sync, retrieve_ical(sync.source_url))
