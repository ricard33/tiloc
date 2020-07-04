import logging

import arrow
from django.db import transaction
from django.db.models import Q, Count
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from ics import Calendar, Event
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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


@api_view(['GET',])
def filling_rate(request, begin=arrow.utcnow().shift(years=-1), end=arrow.utcnow()):
    begin = arrow.get(begin).floor('month')
    end = arrow.get(end).ceil('month')
    data = {}
    dates_range = [begin.date(), end.date()]
    bookings = models.Booking.objects.filter(Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
                                             lodging__isnull=False)
    lodging_count = models.Lodging.objects.filter(active=True).count()
    for booking in bookings:
        print("Booking: %s -> %s" % (booking.begin_date, booking.end_date))
        for d1, d2 in arrow.Arrow.interval('month', begin.floor('month'), end.ceil('month')):
            days_in_month = d2.day
            d2 = d2.floor('day').shift(days=1)
            month = d1.format(fmt='YYYY-MM')
            print(min(d2, arrow.get(booking.end_date)), max(d1, arrow.get(booking.begin_date)))
            delta = (min(d2, arrow.get(booking.end_date)) - max(d1, arrow.get(booking.begin_date))).days
            print(d1, d2, delta)
            value = data.setdefault(month, {'date': month, 'days': 0, 'capacity': days_in_month * lodging_count})
            if delta > 0:
                value['days'] = value['days'] + delta

    keys = list(data.keys())
    keys.sort()
    sorted_data = []
    for k in keys:
        data[k]['rate'] = round(data[k]['days'] / data[k]['capacity'] * 100)
        sorted_data.append(data[k])
    return Response(sorted_data)


@api_view(['GET',])
def channel_distribution(request, begin=arrow.utcnow().shift(years=-1), end=arrow.utcnow()):
    begin = arrow.get(begin).floor('month')
    end = arrow.get(end).ceil('month')
    data = []
    dates_range = [begin.date(), end.date()]
    booking_count = Count('booking',
                          filter=(Q(booking__begin_date__range=dates_range) | Q(booking__end_date__range=dates_range))
                                 & Q(booking__lodging__isnull=False))
    channels = models.BookingChannel.objects.annotate(booking_count=booking_count)
    for row in channels:
        data.append({'channel': row.name, 'count': row.booking_count})
    return Response(data)
