import logging

import arrow
import requests
from django.db import transaction
from ics import Calendar

from core import models
from core.models import BookingStatus
from location import __date__, __version__

logger = logging.getLogger("sync")


def retrieve_ical(url) -> str:
    logger.debug("Requesting ical from %s" % url)
    r = requests.get(
        url, headers={"User-agent": f'Tiloc {__version__} (build {__date__.isoformat(timespec="seconds")}'}
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
        logger.info("Receiving empty ical content.")
        c = Calendar()
    event_uids = []
    for event in c.events:
        event_uids.append(event.uid)

        # HACK Ignoring fake event created by Airbnb. Until we find other cases like this, we can keep this simple hack
        if event.summary in ["Airbnb (Not available)"]:
            continue

        if event.uid:
            qs = models.Booking.objects.filter(lodgings=lodging, source_uid=event.uid, cancelled=False, deleted=False)
            if qs.exists():
                logger.debug("Ignoring existing event [%s -> %s: %s]", event.begin, event.end, event.summary)
                models.SyncRemovedByExternal.objects.filter(sync=sync, booking__in=qs).delete()
                continue

        same_bookings = models.Booking.objects.filter(
            lodgings=lodging,
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
            booking._change_reason = "Updating source_uid"
            booking.save(update_fields=["source_uid"])
            continue

        # Temporary patch for buggy booking.com events
        same_bookings = models.Booking.objects.filter(
            lodgings=lodging,
            begin_date__lt=event.begin.date(),
            end_date=event.end.date(),
            cancelled=False,
            deleted=False,
        )
        if same_bookings.exists():
            booking = same_bookings.first()
            logger.warning("Found buggy booking.com event with modified start date for event [%s -> %s: %s]", event.begin, event.end, event.summary)
            booking.source_uid = event.uid
            booking._change_reason = "Updating source_uid due to buggy booking.com event"
            booking.save(update_fields=["source_uid"])
            continue
        # End of temporary patch

        logger.debug("Creating booking for event [%s -> %s: %s]", event.begin, event.end, event.summary)
        booking = models.Booking.objects.create(
            account=lodging.account,
            source=channel,
            source_uid=event.uid,
            guest_name=event.summary,
            status=BookingStatus.External.value,
            begin_date=event.begin.date(),
            end_date=event.end.date(),
            duration=(event.end.date() - event.begin.date()).days,
            notes=event.description,
            guests_distribution={
                lodging.id: {
                    "adults": 2,
                    "children": 0,
                    "babies": 0,
                }
            },
            price=0,
            deposit=0,
            custom_tourist_tax=0,  # OTA should collect tax for us
        )
        booking.lodgings.add(lodging)

    # try to detect booking that were cancelled by OTA
    for booking in models.Booking.objects.filter(
        source=channel,
        lodgings=lodging,
        end_date__gt=arrow.utcnow().date(),
        cancelled=False,
        deleted=False,
        source_uid__isnull=False,
    ):
        if booking.source_uid and booking.source_uid not in event_uids:
            obj, created = models.SyncRemovedByExternal.objects.get_or_create(sync=sync, booking=booking)
            if not created and obj.see_count >= 2:
                logger.info("Canceling booking {}".format(booking))
                booking.cancelled = True
                booking.notes = ("**CANCELLED by %s on %s\n" % (channel.name, arrow.utcnow().date())) + (
                    booking.notes or ""
                )
                booking._change_reason = "Canceled by %s on %s" % (channel.name, arrow.utcnow())
                booking.save(update_fields=["cancelled", "notes"])
                obj.delete()
            else:
                if not created:
                    obj.see_count += 1
                    obj.save(update_fields=["see_count"])
                logger.warning(
                    "Booking [%s] not found on channel %s (count %d)" % (booking, channel.name, obj.see_count)
                )

    sync.last_import = arrow.utcnow().datetime
    sync.last_import_error = ""
    sync.save()


def retrieve_and_synchronize_bookings(sync: models.BookingChannelSync):
    return synchronize_bookings(sync, retrieve_ical(sync.source_url))
