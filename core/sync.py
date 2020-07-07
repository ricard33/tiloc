import logging

import arrow
import requests
from django.db import transaction
from ics import Calendar

from core import models

logger = logging.getLogger("sync")


def retrieve_ical(url) -> str:
    logger.debug("Requesting ical from %s" % url)
    r = requests.get(url)
    if r.status_code != 200:
        logger.error("HTTP Error requesting ical: [%d] %s", r.status_code, r.text)
        r.raise_for_status()
    return r.text


@transaction.atomic
def synchronize_bookings(sync: models.BookingChannelSync, ical_content: str):
    lodging = sync.lodging
    channel = sync.channel
    c = Calendar(ical_content)
    for event in c.events:

        # HACK Ignoring fake event created by Airbnb. Until we find other cases like this, we can keep this simple hack
        if event.name in ['Airbnb (Not available)']:
            continue

        if event.uid and models.Booking.objects.filter(lodging=lodging, source_uid=event.uid).exists():
            logger.debug("Ignoring existing event [%s -> %s: %s]", event.begin, event.end, event.name)
            continue

        same_bookings = models.Booking.objects.filter(lodging=lodging, source_uid__isnull=True,
                                                      begin_date=event.begin.date(), end_date=event.end.date())

        if same_bookings.exists():
            booking = same_bookings.first()
            logger.info("Found booking with same dates for event [%s -> %s: %s]", event.begin, event.end, event.name)
            booking.source_uid = event.uid
            booking.save()
            continue

        logger.debug("Creating booking for event [%s -> %s: %s]", event.begin, event.end, event.name)
        models.Booking.objects.create(lodging=lodging,
                                      source=channel,
                                      source_uid=event.uid,
                                      guest_name=event.name,
                                      status=channel.default_booking_status or models.BookingStatus.objects.first(),
                                      begin_date=event.begin.date(),
                                      end_date=event.end.date(),
                                      duration=(event.end.date()-event.begin.date()).days,
                                      price=0
                                      )
    sync.last_import = arrow.utcnow().datetime
    sync.save()


def retrieve_and_synchronize_bookings(sync: models.BookingChannelSync):
    return synchronize_bookings(sync, retrieve_ical(sync.source_url))
