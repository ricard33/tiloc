import logging

import arrow
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Count, Q
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from ics import Calendar, Event
from proxy.views import proxy_view
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core import models

logger = logging.getLogger('view')


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get('HTTP_ACCEPT')

        if not accept or 'text/html' not in accept:
            raise Http404(_('"%(path)s" does not exist') % {'path': request.path})
        return super().get(request, *args, **kwargs)


@csrf_exempt
def loggly_proxy(request, path):
    extra_requests_args = {}
    remote_url = 'http://logs-01.loggly.com/' + path
    return proxy_view(request, remote_url, extra_requests_args)


@never_cache
@transaction.atomic
def export_calendar(request, uid):
    lodging = get_object_or_404(models.Lodging, uid=uid)
    source = request.GET.get('s')
    qs = lodging.booking_set.filter(end_date__gte=timezone.now())
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
        e.end = arrow.get(booking.end_date).shift(days=-1)  # make_all_day() will add 1 day
        e.make_all_day()
        c.events.add(e)
    response = HttpResponse(c, content_type="text/calendar")
    response['Content-Disposition'] = 'attachment; filename="{}"'.format("%s.ics" % uid)
    return response


@never_cache
@transaction.atomic
def export_full_planning(request, owner_id=None):
    # user = None
    # if not request.user.is_authenticated:
    #     auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    #     if auth_header:
    #         token_type, _, credentials = auth_header.partition(' ')
    #         import base64
    #         username, password = base64.b64decode(credentials).decode().split(':', 1)
    #         user = authenticate(request, username=username, password=password)
    #     if not user:
    #         r = HttpResponse(status=401)
    #         r['WWW-Authenticate'] = 'Basic realm="Need authentication"'
    #         return r
    owner = owner_id and get_object_or_404(models.Owner, id=owner_id) or None
    if owner and owner_id != request.user.id and not request.user.is_superuser:
        raise Http404('No owner matches the given query.')

    qs = models.Booking.objects.filter(lodging__isnull=False)
    if owner:
        qs = qs.filter(lodging__owner=owner)
        logger.info("Full planning requested for owner [%s]", owner.name)
    else:
        logger.info("Full planning requested")

    c = Calendar(creator="-//Gecko Conception//Location")
    for booking in qs.order_by('begin_date', 'lodging__rank'):
        e = Event()
        e.uid = str(booking.uid)
        e.name = booking.guest_name
        e.location = booking.lodging.name
        e.begin = booking.begin_date
        e.end = booking.end_date
        e.description = booking.notes
        e.make_all_day()
        c.events.add(e)
    response = HttpResponse(c, content_type="text/calendar")
    response['Content-Disposition'] = 'attachment; filename="{}"'.format("planning.ics")
    return response


@api_view(['GET', ])
def filling_rate(request, begin=arrow.utcnow().shift(years=-1), end=arrow.utcnow()):
    begin = arrow.get(begin).floor('month')
    end = arrow.get(end).ceil('month')
    data = {}
    dates_range = [begin.date(), end.date()]
    bookings = models.Booking.objects.filter(Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
                                             lodging__isnull=False)
    lodging_count = models.Lodging.objects.filter(active=True).count()
    for booking in bookings:
        for d1, d2 in arrow.Arrow.interval('month', begin.floor('month'), end.ceil('month')):
            days_in_month = d2.day
            d2 = d2.floor('day').shift(days=1)
            month = d1.format(fmt='YYYY-MM')
            delta = (min(d2, arrow.get(booking.end_date)) - max(d1, arrow.get(booking.begin_date))).days
            value = data.setdefault(month, {'date':     month, 'days': 0, 'turnover': 0,
                                            'capacity': days_in_month * lodging_count})
            if delta > 0:
                value['days'] = value['days'] + delta
                if booking.duration > 0:
                    value['turnover'] = value['turnover'] + delta * booking.price / booking.duration

    keys = list(data.keys())
    keys.sort()
    sorted_data = []
    for k in keys:
        data[k]['rate'] = round(data[k]['days'] / data[k]['capacity'] * 100)
        sorted_data.append(data[k])
    return Response(sorted_data)


@api_view(['GET', ])
def channel_distribution(request, begin=arrow.utcnow().shift(years=-1), end=arrow.utcnow()):
    begin = arrow.get(begin).floor('month')
    end = arrow.get(end).ceil('month')
    data = []
    dates_range = [begin.date(), end.date()]
    booking_count = Count('booking',
                          filter=(Q(booking__begin_date__range=dates_range) | Q(booking__end_date__range=dates_range))
                                & Q(booking__lodging__isnull=False))  # noqa: E127
    channels = models.BookingChannel.objects.annotate(booking_count=booking_count)
    for row in channels:
        data.append({'channel': row.name, 'count': row.booking_count})
    return Response(data)
