import logging

import arrow
from django.db import transaction
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from ics import Calendar, Event

from core import models

logger = logging.getLogger('view')


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get('HTTP_ACCEPT')

        if 'text/html' not in accept:
            raise Http404(_('"%(path)s" does not exist') % {'path': request.path})
        return super().get(request, *args, **kwargs)


@transaction.atomic
def export_calendar(request, uid):
    lodging = get_object_or_404(models.Lodging, uid=uid)
    source = request.GET.get('s')
    qs = lodging.booking_set.all()
    if source:
        sync = get_object_or_404(models.BookingChannelSync, id=source)
        qs = qs.exclude(source=sync.channel)
        logger.info("Calendar requested by channel [%s] for lodging [%s]", sync.channel.name, lodging.name)
        sync.last_export = arrow.utcnow().datetime
        sync.save()
    else:
        logger.info("Full calendar requested for lodging [%s]", lodging.name)
    c = Calendar(creator="-//Gecko Conception//Location")
    for booking in qs.order_by('begin_date'):
        e = Event()
        e.uid = str(booking.uid)
        e.name = booking.guest_name.split()[0]  # only first word (= first name)
        e.begin = booking.begin_date
        e.end = booking.end_date
        e.make_all_day()
        c.events.add(e)
    response = HttpResponse(c, content_type="text/calendar")
    response['Content-Disposition'] = 'attachment; filename="{}"'.format("%s.ics" % uid)
    return response
