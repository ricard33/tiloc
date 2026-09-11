import logging

import arrow
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Count, Q
from django.http import Http404, HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import get_object_or_404, render
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django_email_verification import default_token_generator
from django_email_verification.errors import NotAllFieldCompiled
from ics import Calendar, ContentLine, Event
from proxy.views import proxy_view
from rest_framework import exceptions as drf_exceptions
from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import set_rollback

from core import models
from core.models import status_no_stats
from core.stats import (
    get_booking_funnel_and_conversion,
    get_channel_revenue,
    get_filling_rate_and_turnover,
    get_payments_overview,
    get_season_breakdown,
)

logger = logging.getLogger("view")


# Same as default DRF handler, only adding `code` field from `APIException`
def exception_handler(exc, context):
    """
    Returns the response that should be used for any given exception.

    By default, we handle the REST framework `APIException`, and also
    Django's built-in `Http404` and `PermissionDenied` exceptions.

    Any unhandled exceptions may return `None`, which will cause a 500 error
    to be raised.
    """
    if isinstance(exc, Http404):
        exc = drf_exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = drf_exceptions.PermissionDenied()

    if isinstance(exc, drf_exceptions.APIException):
        headers = {}
        if getattr(exc, "auth_header", None):
            headers["WWW-Authenticate"] = exc.auth_header
        if getattr(exc, "wait", None):
            headers["Retry-After"] = "%d" % exc.wait

        if isinstance(exc.detail, (list, dict)):
            data = exc.detail
        else:
            data = {"detail": exc.detail, "code": exc.detail.code}

        set_rollback()
        return Response(data, status=exc.status_code, headers=headers)

    return None


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get("HTTP_ACCEPT")

        if not accept or "text/html" not in accept:
            raise Http404(_('"%(path)s" does not exist') % {"path": request.path})
        return super().get(request, *args, **kwargs)


@csrf_exempt
def loggly_proxy(request, path):
    extra_requests_args = {}
    remote_url = "http://logs-01.loggly.com/" + path
    return proxy_view(request, remote_url, extra_requests_args)


@never_cache
@transaction.atomic
def export_calendar(request, uid):
    lodging = get_object_or_404(models.Lodging, uid=uid)
    if lodging.account.is_free_plan:
        logger.warning("Calender request for a FREE account [%s]. Request rejected.", lodging.account)
        return HttpResponseForbidden("No calendar export for FREE account")
    source = request.GET.get("s")
    qs = lodging.booking_set.filter(end_date__gte=timezone.now(), cancelled=False, deleted=False)
    if source:
        sync = get_object_or_404(models.BookingChannelSync, id=source)
        qs = qs.exclude(source=sync.channel)
        logger.info("Calendar requested by channel [%s] for lodging [%s]", sync.channel.name, lodging.name)
        sync.last_export = arrow.utcnow().datetime
        sync.save(update_fields=["last_export"])
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
def export_calendar_for_lodgings_list(request):
    uids = request.GET.getlist("l")
    if not uids:
        return HttpResponseBadRequest("Lodging list is empty")
    for uid in uids:
        lodging = get_object_or_404(models.Lodging, uid=uid)
        if lodging.account.is_free_plan:
            logger.warning("Calender request for a FREE account [%s]. Request rejected.", lodging.account)
            return HttpResponseForbidden("No calendar export for FREE account")

    qs = models.Booking.objects.filter(
        lodgings__uid__in=uids, end_date__gte=timezone.now(), cancelled=False, deleted=False
    )
    lodging_names = models.Lodging.objects.filter(uid__in=uids).values_list("name", flat=True)
    logger.info("Full calendar requested for lodging [%s]", ", ".join(lodging_names))

    c = Calendar(creator="-//Ti'Gecko//Location")
    for booking in qs.order_by("begin_date", "lodgings__rank"):
        e = Event()
        e.uid = str(booking.uid)
        e.summary = booking.guest_name.split()[0]  # only first word (= first name)
        e.begin = booking.begin_date
        e.end = arrow.get(booking.end_date).date()
        e.make_all_day()
        c.events.append(e)
    response = HttpResponse(c.serialize() + "\n", content_type="text/calendar")
    response["Content-Disposition"] = 'attachment; filename="{}"'.format("planning.ics")
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
    if request.user.is_anonymous or request.user.account.is_free_plan:
        logger.warning("Calender request for a FREE account [%s]. Request rejected.", request.user.account)
        return HttpResponseForbidden("No calendar export for FREE account")
    qs = models.Booking.objects.for_user(request.user).filter(cancelled=False, deleted=False)
    logger.info("Full planning requested")

    c = Calendar(creator="-//Ti'Gecko//Location")
    for booking in qs.order_by("begin_date", "lodgings__rank"):
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


def _parse_lodging_ids(request) -> list[int] | None:
    raw = request.GET.get("lodging")
    return [int(v) for v in raw.split(",") if v] if raw else None


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
        request.user,
        begin,
        end,
        with_turnover=request.user.has_perm("core.view_prices"),
        lodging_ids=_parse_lodging_ids(request),
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
    lodging_ids = _parse_lodging_ids(request)
    filter = Q(booking__begin_date__range=dates_range) | Q(booking__end_date__range=dates_range)
    filter &= Q(booking__account=request.user.account)
    if not request.user.has_perm("core.administrator"):
        filter &= Q(booking__lodgings__in=request.user.lodgings.all())
    if lodging_ids:
        filter &= Q(booking__lodgings__id__in=lodging_ids)

    booking_count = Count(
        "booking",
        filter=filter
        & Q(booking__cancelled=False)
        & Q(booking__deleted=False)
        & ~Q(booking__status__in=status_no_stats),
    )  # noqa: E127
    channels = models.BookingChannel.objects.filter(Q(account=request.user.account) | Q(account__isnull=True)).annotate(
        booking_count=booking_count
    )
    for row in channels:
        data.append({"channel": row.name, "count": row.booking_count})
    direct_bookings_qs = models.Booking.objects.for_user(request.user).filter(
        cancelled=False,
        deleted=False,
        # status__in=status_finalized,
        source_id__isnull=True,
    )
    if lodging_ids:
        direct_bookings_qs = direct_bookings_qs.filter(lodgings__id__in=lodging_ids)
    data.append(
        {
            "channel": None,
            "count": direct_bookings_qs.exclude(status__in=status_no_stats).aggregate(count=Count("id"))["count"],
        }
    )
    if request.user.has_perm("core.view_prices"):
        revenue = get_channel_revenue(request.user, begin, end, lodging_ids=lodging_ids)
        for row in data:
            row["turnover"] = revenue.get(row["channel"], 0)
    return Response(data)


@api_view(
    [
        "GET",
    ]
)
@permission_classes([IsAuthenticated])
def booking_funnel(request, begin=None, end=None):
    if end is None:
        end = arrow.utcnow().shift(months=+1).replace(day=1).shift(days=-1)
    if begin is None:
        begin = arrow.utcnow().shift(months=-11).replace(day=1)
    return Response(
        get_booking_funnel_and_conversion(request.user, begin, end, lodging_ids=_parse_lodging_ids(request))
    )


@api_view(
    [
        "GET",
    ]
)
@permission_classes([IsAuthenticated])
def season_breakdown(request, begin=None, end=None):
    if end is None:
        end = arrow.utcnow().shift(months=+1).replace(day=1).shift(days=-1)
    if begin is None:
        begin = arrow.utcnow().shift(months=-11).replace(day=1)
    with_turnover = request.user.has_perm("core.view_prices")
    return Response(
        get_season_breakdown(
            request.user, begin, end, with_turnover=with_turnover, lodging_ids=_parse_lodging_ids(request)
        )
    )


@api_view(
    [
        "GET",
    ]
)
@permission_classes([IsAuthenticated])
def payments_overview(request, begin=None, end=None):
    if not request.user.has_perm("core.view_prices"):
        return Response(status=drf_status.HTTP_403_FORBIDDEN)
    if end is None:
        end = arrow.utcnow().shift(months=+1).replace(day=1).shift(days=-1)
    if begin is None:
        begin = arrow.utcnow().shift(months=-11).replace(day=1)
    return Response(get_payments_overview(request.user, begin, end, lodging_ids=_parse_lodging_ids(request)))


@permission_classes([IsAdminUser])
def preview_verification_email(request):
    user = request.user
    exp = default_token_generator.now() + 60 * 60
    token, expiry = default_token_generator.make_token(user, exp, kind="MAIL")
    context = {"token": token, "expiry": expiry, "user": user, "link": settings.EMAIL_PAGE_DOMAIN}
    return TemplateResponse(request, "signup/mail_body.html", context)


@permission_classes([IsAdminUser])
def preview_verified(request):
    try:
        template = settings.EMAIL_MAIL_PAGE_TEMPLATE
        return render(request, template, {"success": True, "user": request.user, "request": request})
    except (AttributeError, TypeError):
        raise NotAllFieldCompiled("EMAIL_MAIL_PAGE_TEMPLATE field not found")


def get_base_url(request):
    if request:
        return f"{request.scheme}://{request.get_host()}"
    else:
        return settings.EMAIL_PAGE_DOMAIN


@permission_classes([IsAdminUser])
def preview_welcome(request):
    return render(request, "signup/welcome_body.html", {"user": request.user, "base_url": get_base_url(request)})


@permission_classes([IsAdminUser])
def preview_reset_password(request):
    return render(
        request, "password/password_change_template.html", {"user": request.user, "base_url": get_base_url(request)}
    )


@permission_classes([IsAdminUser])
def preview_password_changed(request):
    return render(
        request, "password/password_changed_template.html", {"user": request.user, "base_url": get_base_url(request)}
    )
