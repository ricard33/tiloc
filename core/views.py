import logging

import arrow
from django.db import transaction
from django.db.models import Count, Q
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from django_email_verification import send_email
from ics import Calendar, ContentLine, Event
from proxy.views import proxy_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core import models
from core.stats import get_filling_rate_and_turnover

logger = logging.getLogger("view")


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get("HTTP_ACCEPT")

        if not accept or "text/html" not in accept:
            raise Http404(_('"%(path)s" does not exist') % {"path": request.path})
        return super().get(request, *args, **kwargs)


class CreateAccountClassView(FormView):

    def form_valid(self, form):
        user = form.save()
        return_val = super(CreateAccountClassView, self).form_valid(form)
        send_email(user)
        return return_val


@csrf_exempt
def loggly_proxy(request, path):
    extra_requests_args = {}
    remote_url = "http://logs-01.loggly.com/" + path
    return proxy_view(request, remote_url, extra_requests_args)


@never_cache
@transaction.atomic
def export_calendar(request, uid):
    lodging = get_object_or_404(models.Lodging, uid=uid)
    source = request.GET.get("s")
    qs = lodging.booking_set.filter(end_date__gte=timezone.now(), cancelled=False, deleted=False)
    if source:
        sync = get_object_or_404(models.BookingChannelSync, id=source)
        qs = qs.exclude(source=sync.channel)
        logger.info("Calendar requested by channel [%s] for lodging [%s]", sync.channel.name, lodging.name)
        sync.last_export = arrow.utcnow().datetime
        sync.save()
    else:
        logger.info("Full calendar requested for lodging [%s]", lodging.name)
    c = Calendar(creator="-//Ti'Gecko//Tiloc//EN")
    c.extra.extend([ContentLine(name="CALSCALE", value="GREGORIAN")])
    c.extra_params["PRODID"] = {"X-RICAL-TZSOURCE": ["TZINFO"]}
    for booking in qs.order_by("begin_date"):
        e = Event()
        e.uid = str(booking.uid)
        e.summary = booking.guest_name.split()[0]  # only first word (= first name)
        e.begin = booking.begin_date
        e.end = arrow.get(booking.end_date).date()
        e.make_all_day()
        c.events.append(e)
    response = HttpResponse(c.serialize() + "\n", content_type="text/calendar")
    response["Content-Disposition"] = 'attachment; filename="{}"'.format("%s.ics" % uid)
    return response


@never_cache
@transaction.atomic
def export_full_planning(request):
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
    qs = models.Booking.objects.for_user(request.user).filter(cancelled=False, deleted=False)
    logger.info("Full planning requested")

    c = Calendar(creator="-//Ti'Gecko//Location")
    for booking in qs.order_by("begin_date", "lodging__rank"):
        e = Event()
        e.uid = str(booking.uid)
        e.name = booking.guest_name
        e.location = booking.lodging.name
        e.begin = booking.begin_date
        e.end = booking.end_date
        e.description = booking.notes
        e.make_all_day()
        c.events.append(e)
    response = HttpResponse(c, content_type="text/calendar")
    response["Content-Disposition"] = 'attachment; filename="{}"'.format("planning.ics")
    return response


@api_view(
    [
        "GET",
    ]
)
@permission_classes([IsAuthenticated])
def filling_rate(request, begin=None, end=arrow.utcnow()):
    if end is None:
        end = arrow.utcnow().shift(months=+1).replace(day=1).shift(days=-1)
    if begin is None:
        begin = arrow.utcnow().shift(months=-11).replace(day=1)
    sorted_data = get_filling_rate_and_turnover(
        request.user, begin, end, with_turnover=request.user.has_perm("core.view_prices")
    )
    return Response(sorted_data)


@api_view(
    [
        "GET",
    ]
)
@permission_classes([IsAuthenticated])
def channel_distribution(request, begin=arrow.utcnow().shift(years=-5), end=arrow.utcnow().shift(years=5)):
    begin = arrow.get(begin).floor("month")
    end = arrow.get(end).ceil("month")
    data = []
    dates_range = [begin.date(), end.date()]
    filter = Q(booking__begin_date__range=dates_range) | Q(booking__end_date__range=dates_range)
    filter &= Q(booking__lodging__account=request.user.account)
    if not request.user.has_perm('core.administrator'):
        filter &= Q(booking__lodging__in=request.user.lodgings.all())

    booking_count = Count(
        "booking",
        filter=filter
        & Q(booking__cancelled=False)
        & Q(booking__deleted=False)
        & Q(booking__status__no_stats=False),
    )  # noqa: E127
    channels = models.BookingChannel.objects.filter(account=request.user.account).annotate(booking_count=booking_count)
    for row in channels:
        data.append({"channel": row.name, "count": row.booking_count})
    data.append(
        {
            "channel": None,
            "count": models.Booking.objects.for_user(request.user).filter(
                cancelled=False,
                deleted=False,
                status__no_stats=False,
                status__finalized=True,
                source_id__isnull=True,
            ).aggregate(count=Count("id"))["count"],
        }
    )
    return Response(data)
