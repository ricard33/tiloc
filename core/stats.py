from collections import Counter, defaultdict
from decimal import Decimal
from typing import Callable

import arrow
from django.db.models import Count, Q, Sum

from core import models
from core.models import status_no_stats

# bucket edges as (label, low_inclusive, high_inclusive); None means unbounded on that side
LENGTH_OF_STAY_BUCKETS = [
    ("1-3", 1, 3),
    ("4-6", 4, 6),
    ("7-13", 7, 13),
    ("14-20", 14, 20),
    ("21+", 21, None),
]
LEAD_TIME_BUCKETS = [
    ("<0", None, -1),
    ("0-7", 0, 7),
    ("8-30", 8, 30),
    ("31-90", 31, 90),
    ("90+", 91, None),
]

FUNNEL_STATUSES = [
    models.BookingStatus.Option,
    models.BookingStatus.ContractSent,
    models.BookingStatus.DepositPaid,
    models.BookingStatus.PaymentOnArrival,
    models.BookingStatus.Paid,
    models.BookingStatus.External,
]


def bucket_values(values: list[int], buckets: list[tuple[str, int | None, int | None]]) -> list[dict]:
    result = [{"label": label, "count": 0} for label, _low, _high in buckets]
    for value in values:
        for row, (_label, low, high) in zip(result, buckets):
            if (low is None or value >= low) and (high is None or value <= high):
                row["count"] += 1
                break
    return result


def aggregate_month_for_range(
    begin: arrow.Arrow,
    end: arrow.Arrow,
    lodging_ids: list[int],
    aggregation_fn: Callable[[str, int, models.Booking, int, dict], dict],
) -> list:
    begin = arrow.get(begin).floor("month")
    end = arrow.get(end).ceil("month")
    data = {}
    dates_range = [begin.date(), end.date()]
    bookings = (
        models.Booking.objects.prefetch_related("lodgings")
        .filter(
            Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
            lodgings__id__in=lodging_ids,
            cancelled=False,
            deleted=False,
        )
        .exclude(status__in=status_no_stats)
        .distinct()
    )
    for booking in bookings:
        for d1, d2 in arrow.Arrow.interval("month", begin.floor("month").datetime, end.ceil("month").datetime):
            days_in_month = d2.day
            d2 = d2.floor("day").shift(days=1)
            month = d1.format(fmt="YYYY-MM")
            booked_days = (min(d2, arrow.get(booking.end_date)) - max(d1, arrow.get(booking.begin_date))).days
            value = data.get(month, {})
            data[month] = aggregation_fn(month, days_in_month, booking, booked_days, value)

    keys = list(data.keys())
    keys.sort()
    sorted_data = []
    for k in keys:
        sorted_data.append(data[k])
    return sorted_data


def fill_rate_and_turnover(value: dict[str, int], booking: models.Booking, booked_days: int, capacity: int, turnover):
    if booked_days > 0:
        value["days"] = value["days"] + booked_days
        if turnover > 0 and booking.duration > 0:
            value["turnover"] = (
                value.get("turnover", 0) + booked_days * booking.price / booking.duration / booking.lodgings.count()
            )
    value["rate"] = round(value["days"] / capacity * 100)


def _scope_lodging_ids(user: models.User, requested_ids: list[int] | None) -> list[int]:
    qs = models.Lodging.objects.for_user(user).filter(active=True)
    if requested_ids:
        qs = qs.filter(id__in=requested_ids)
    return list(qs.values_list(flat=True))


def get_filling_rate_and_turnover(
    user: models.User,
    begin: arrow.Arrow,
    end: arrow.Arrow,
    with_turnover: bool = True,
    lodging_ids: list[int] | None = None,
):
    lodging_ids = _scope_lodging_ids(user, lodging_ids)
    lodging_count = len(lodging_ids)

    def aggregate(month: str, days_in_month: int, booking: models.Booking, booked_days: int, value: dict):
        booked_lodgings_count = booking.lodgings.count()
        turnover = with_turnover and (booked_days * booking.price / booking.duration) or 0
        if not value:
            value = {"date": month, "days": 0, "capacity": days_in_month * lodging_count, "lodgings": lodging_ids}
        fill_rate_and_turnover(
            value, booking, booked_days * booked_lodgings_count, days_in_month * lodging_count, turnover
        )
        # split turnover between lodgings in booking
        for lodging in booking.lodgings.all():
            lodging_value = value.setdefault(str(lodging.id), {"days": 0})
            fill_rate_and_turnover(lodging_value, booking, booked_days, days_in_month, turnover / booked_lodgings_count)

        return value

    return aggregate_month_for_range(begin, end, lodging_ids, aggregate)


def _overlap_days(begin: arrow.Arrow, end: arrow.Arrow, booking: models.Booking) -> int:
    return (min(end, arrow.get(booking.end_date)) - max(begin, arrow.get(booking.begin_date))).days


def get_booking_funnel_and_conversion(
    user: models.User, begin: arrow.Arrow, end: arrow.Arrow, lodging_ids: list[int] | None = None
) -> dict:
    """Booking-status funnel plus cancellation/signature/duration/lead-time figures. No pricing data."""
    begin = arrow.get(begin).floor("day")
    end = arrow.get(end).ceil("day")
    dates_range = [begin.date(), end.date()]

    base_qs = models.Booking.objects.for_user(user).filter(
        Q(begin_date__range=dates_range) | Q(end_date__range=dates_range)
    )
    if lodging_ids:
        base_qs = base_qs.filter(lodgings__id__in=lodging_ids)
    # materialize once: `for_user()` already applies `.distinct()`, which only dedupes correctly
    # when selecting full rows (as here), not when chained into `.values_list()` on a single field
    bookings = list(base_qs.filter(deleted=False, cancelled=False).exclude(status__in=status_no_stats))
    cancelled_count = base_qs.filter(deleted=False, cancelled=True).exclude(status__in=status_no_stats).count()

    status_counts = Counter(booking.status for booking in bookings)
    funnel = [{"status": s.value, "count": status_counts.get(s.value, 0)} for s in FUNNEL_STATUSES]

    total = len(bookings)
    # cancellation rate is over every non-"not available" booking, cancelled or not
    cancellation_rate = (
        round(cancelled_count / (total + cancelled_count) * 100, 1) if (total + cancelled_count) else None
    )

    contracts = models.Contract.objects.filter(booking_id__in=[b.id for b in bookings], pdf_created__isnull=False)
    contracts_sent = contracts.count()
    contracts_signed = contracts.filter(signed__isnull=False).count()
    signature_rate = round(contracts_signed / contracts_sent * 100, 1) if contracts_sent else None

    durations = [booking.duration for booking in bookings]
    lead_times = [(booking.begin_date - booking.created.date()).days for booking in bookings]

    return {
        "funnel": funnel,
        "total_bookings": total,
        "cancelled_bookings": cancelled_count,
        "cancellation_rate": cancellation_rate,
        "contracts_sent": contracts_sent,
        "contracts_signed": contracts_signed,
        "signature_rate": signature_rate,
        "average_length_of_stay": round(sum(durations) / len(durations), 1) if durations else None,
        "length_of_stay_distribution": bucket_values(durations, LENGTH_OF_STAY_BUCKETS),
        "average_lead_time": round(sum(lead_times) / len(lead_times), 1) if lead_times else None,
        "lead_time_distribution": bucket_values(lead_times, LEAD_TIME_BUCKETS),
    }


def get_channel_revenue(
    user: models.User, begin: arrow.Arrow, end: arrow.Arrow, lodging_ids: list[int] | None = None
) -> dict:
    """Turnover per booking channel (`None` key = direct bookings), prorated like `fill_rate_and_turnover`."""
    begin = arrow.get(begin).floor("day")
    end = arrow.get(end).ceil("day")
    dates_range = [begin.date(), end.date()]

    channel_names = dict(
        models.BookingChannel.objects.filter(Q(account=user.account) | Q(account__isnull=True)).values_list(
            "id", "name"
        )
    )

    bookings = (
        models.Booking.objects.for_user(user)
        .filter(
            Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
            cancelled=False,
            deleted=False,
        )
        .exclude(status__in=status_no_stats)
    )
    if lodging_ids:
        bookings = bookings.filter(lodgings__id__in=lodging_ids)

    revenue: dict = defaultdict(lambda: Decimal(0))
    for booking in bookings:
        if booking.duration <= 0:
            continue
        overlap_days = _overlap_days(begin, end, booking)
        if overlap_days <= 0:
            continue
        revenue[channel_names.get(booking.source_id)] += Decimal(overlap_days) * booking.price / booking.duration

    return {channel: round(amount, 2) for channel, amount in revenue.items()}


def get_season_breakdown(
    user: models.User,
    begin: arrow.Arrow,
    end: arrow.Arrow,
    with_turnover: bool = True,
    lodging_ids: list[int] | None = None,
) -> dict:
    """Occupied days / bookings / turnover per season, bucketed by each lodging's season at check-in.

    v1 simplification: a booking is attributed to the season active on its `begin_date` — a stay
    straddling a season boundary is not split day by day (unlike the month-bucketing above).
    """
    begin = arrow.get(begin).floor("day")
    end = arrow.get(end).ceil("day")
    dates_range = [begin.date(), end.date()]

    scoped_lodging_ids = set(_scope_lodging_ids(user, lodging_ids))
    lodgings = list(
        models.Lodging.objects.for_user(user)
        .filter(active=True, id__in=scoped_lodging_ids)
        .only("id", "season_calendar_id")
    )
    calendar_by_lodging = {lodging.id: lodging.season_calendar_id for lodging in lodgings}
    calendar_ids = [calendar_id for calendar_id in calendar_by_lodging.values() if calendar_id]

    ranges_by_calendar = defaultdict(list)
    for date_range in models.SeasonDateRange.objects.filter(season__calendar_id__in=calendar_ids).select_related(
        "season"
    ):
        ranges_by_calendar[date_range.season.calendar_id].append(
            (date_range.begin_date, date_range.end_date, date_range.season.name)
        )

    def season_name_for(lodging_id, day):
        calendar_id = calendar_by_lodging.get(lodging_id)
        if not calendar_id:
            return "unassigned"
        for range_begin, range_end, name in ranges_by_calendar.get(calendar_id, []):
            if range_begin <= day <= range_end:
                return name
        return "unassigned"

    bookings = (
        models.Booking.objects.for_user(user)
        .filter(
            Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
            cancelled=False,
            deleted=False,
        )
        .exclude(status__in=status_no_stats)
        .prefetch_related("lodgings")
    )
    if lodging_ids:
        bookings = bookings.filter(lodgings__id__in=scoped_lodging_ids)

    data: dict = defaultdict(lambda: {"days": 0, "bookings": 0, "turnover": Decimal(0)})
    for booking in bookings:
        booked_lodgings = list(booking.lodgings.all())
        if lodging_ids:
            booked_lodgings = [lodging for lodging in booked_lodgings if lodging.id in scoped_lodging_ids]
        if not booked_lodgings or booking.duration <= 0:
            continue
        overlap_days = _overlap_days(begin, end, booking)
        if overlap_days <= 0:
            continue
        per_lodging_turnover = (
            with_turnover
            and Decimal(overlap_days) * booking.price / booking.duration / len(booked_lodgings)
            or Decimal(0)
        )
        for lodging in booked_lodgings:
            bucket = data[season_name_for(lodging.id, booking.begin_date)]
            bucket["days"] += overlap_days
            bucket["bookings"] += 1
            bucket["turnover"] += per_lodging_turnover

    result = {}
    for season_name, bucket in data.items():
        result[season_name] = {"days": bucket["days"], "bookings": bucket["bookings"]}
        if with_turnover:
            result[season_name]["turnover"] = round(bucket["turnover"], 2)
    return result


def get_payments_overview(
    user: models.User, begin: arrow.Arrow, end: arrow.Arrow, lodging_ids: list[int] | None = None
) -> dict:
    """Payment-method breakdown for payments received in the period, plus booking-level totals
    (outstanding balance, tourist tax, guests) for stays overlapping the period.

    `total_collected`/`payment_methods` measure cash actually received during the period (by
    `Payment.date`); `total_outstanding`/`total_tourist_tax`/`total_guests` describe the bookings
    whose stay overlaps the period, regardless of when they were paid.
    """
    begin = arrow.get(begin)
    end = arrow.get(end)
    dates_range = [begin.date(), end.date()]

    # `Payment._lodging_qs_path` goes through the `booking__lodgings` M2M, so `for_user()`'s join can
    # duplicate rows for a multi-lodging booking; `id` is a safe `.distinct()` field (it's the PK) but
    # `method`/`amount` aren't, so scope through already-deduped booking ids instead of `for_user()` here.
    visible_bookings_qs = models.Booking.objects.for_user(user)
    if lodging_ids:
        visible_bookings_qs = visible_bookings_qs.filter(lodgings__id__in=lodging_ids)
    visible_booking_ids = visible_bookings_qs.values_list("id", flat=True)
    payments = models.Payment.objects.filter(booking_id__in=visible_booking_ids, date__range=dates_range)
    payment_methods = list(
        payments.values("method").annotate(count=Count("id"), total=Sum("amount")).order_by("method")
    )
    total_collected = payments.aggregate(total=Sum("amount"))["total"] or Decimal(0)

    bookings_qs = models.Booking.objects.for_user(user).filter(
        Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
        cancelled=False,
        deleted=False,
    )
    if lodging_ids:
        bookings_qs = bookings_qs.filter(lodgings__id__in=lodging_ids)
    bookings = list(bookings_qs.exclude(status__in=status_no_stats).prefetch_related("payment_set"))

    total_outstanding = sum((booking.left_to_pay for booking in bookings), Decimal(0))
    total_tourist_tax = sum((booking.tourist_tax for booking in bookings), Decimal(0))
    total_guests = sum(booking.guests for booking in bookings)

    return {
        "payment_methods": payment_methods,
        "total_collected": total_collected,
        "total_outstanding": round(total_outstanding, 2),
        "total_tourist_tax": round(total_tourist_tax, 2),
        "total_guests": total_guests,
        "bookings_count": len(bookings),
    }
