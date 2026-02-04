from typing import Callable

import arrow
from django.db.models import Q

from core import models
from core.models import status_no_stats


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
    bookings = models.Booking.objects.prefetch_related(
        'lodgings'
    ).filter(
        Q(begin_date__range=dates_range) | Q(end_date__range=dates_range),
        lodgings__id__in=lodging_ids,
        cancelled=False,
        deleted=False,
    ).exclude(status__in=status_no_stats).distinct()
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


def fill_rate_and_turnover(
    value: dict[str, int], booking: models.Booking, booked_days: int, capacity: int, turnover
):
    if booked_days > 0:
        value["days"] = value["days"] + booked_days
        if turnover > 0 and booking.duration > 0:
            value["turnover"] = value.get("turnover", 0) + booked_days * booking.price / booking.duration / booking.lodgings.count()
    value["rate"] = round(value["days"] / capacity * 100)


def get_filling_rate_and_turnover(
    user: models.User, begin: arrow.Arrow, end: arrow.Arrow, with_turnover: bool = True
):
    lodging_ids = list(models.Lodging.objects.for_user(user).filter(active=True).values_list(flat=True))
    lodging_count = len(lodging_ids)

    def aggregate(month: str, days_in_month: int, booking: models.Booking, booked_days: int, value: dict):
        booked_lodgings_count = booking.lodgings.count()
        turnover = with_turnover and (booked_days * booking.price / booking.duration) or 0
        if not value:
            value = {"date": month, "days": 0, "capacity": days_in_month * lodging_count, "lodgings": lodging_ids}
        fill_rate_and_turnover(value, booking, booked_days * booked_lodgings_count, days_in_month * lodging_count, turnover)
        # split turnover between lodgings in booking
        for lodging in booking.lodgings.all():
            lodging_value = value.setdefault(str(lodging.id), {"days": 0})
            fill_rate_and_turnover(lodging_value, booking, booked_days, days_in_month, turnover / booked_lodgings_count)

        return value

    return aggregate_month_for_range(begin, end, lodging_ids, aggregate)
