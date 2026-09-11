import arrow
import pytest
from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.test import APIClient

from core import models
from core.stats import (
    LEAD_TIME_BUCKETS,
    LENGTH_OF_STAY_BUCKETS,
    bucket_values,
    get_booking_funnel_and_conversion,
    get_channel_revenue,
    get_filling_rate_and_turnover,
    get_payments_overview,
    get_season_breakdown,
)
from core.tests import factories
from core.tests.helpers import force_login

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("default_groups")]


def make_client(user):
    api_client = APIClient()
    api_client.credentials(**force_login(user, api_client))
    return api_client


def make_user(with_lodging=None):
    user = factories.StandardUserFactory.create()
    if with_lodging is not None:
        user.lodgings.add(with_lodging)
    return user


def make_plain_user(with_lodging=None):
    """A user with `view_booking` but not `core.view_prices` (unlike the "standard" group)."""
    user = factories._UserFactory.create(email="noprice@example.com")
    user.user_permissions.add(Permission.objects.get(codename="view_booking"))
    if with_lodging is not None:
        user.lodgings.add(with_lodging)
    return models.User.objects.get(pk=user.pk)  # drop the permission cache


def set_created(booking, when):
    booking.created = when
    booking.save(update_fields=["created"])


# --------------------------------------------------------------------------- bucket_values


def test_bucket_values_places_edges_correctly():
    buckets = [("low", 1, 3), ("high", 4, None)]
    result = bucket_values([1, 3, 4, 100], buckets)
    assert result == [{"label": "low", "count": 2}, {"label": "high", "count": 2}]


def test_bucket_values_unbounded_low_edge():
    result = bucket_values([-5, -1, 0], [("negative", None, -1), ("zero", 0, 0)])
    assert result == [{"label": "negative", "count": 2}, {"label": "zero", "count": 1}]


def test_bucket_values_value_outside_every_bucket_is_dropped():
    result = bucket_values([1, 50], [("low", 1, 3)])
    assert result == [{"label": "low", "count": 1}]


# --------------------------------------------------------------------------- get_booking_funnel_and_conversion


def test_funnel_no_bookings_in_period_returns_zeroes_and_none():
    user = make_user()
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_bookings"] == 0
    assert result["cancellation_rate"] is None
    assert result["signature_rate"] is None
    assert result["average_length_of_stay"] is None
    assert result["average_lead_time"] is None
    assert all(row["count"] == 0 for row in result["funnel"])
    assert result["length_of_stay_distribution"] == bucket_values([], LENGTH_OF_STAY_BUCKETS)
    assert result["lead_time_distribution"] == bucket_values([], LEAD_TIME_BUCKETS)


def test_funnel_counts_by_status_and_ignores_not_available():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    factories.BookingFactory(
        lodgings=lodging,
        status="option",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    factories.BookingFactory(
        lodgings=lodging,
        status="not available",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_bookings"] == 2
    counts = {row["status"]: row["count"] for row in result["funnel"]}
    assert counts["paid"] == 1
    assert counts["option"] == 1


def test_cancelled_bookings_excluded_from_funnel_but_counted_in_cancellation_rate():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        status="paid",
        cancelled=True,
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    factories.BookingFactory(
        lodgings=lodging,
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_bookings"] == 1
    counts = {row["status"]: row["count"] for row in result["funnel"]}
    assert counts["paid"] == 1
    assert result["cancelled_bookings"] == 1
    assert result["cancellation_rate"] == 50.0


def test_deleted_bookings_are_excluded():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        status="paid",
        deleted=True,
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_bookings"] == 0
    assert result["cancelled_bookings"] == 0


def test_signature_rate_only_counts_contracts_with_pdf_created():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    booking_sent_and_signed = factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    factories.ContractFactory(
        booking=booking_sent_and_signed,
        pdf_created=arrow.get("2030-05-01").datetime,
        signed=arrow.get("2030-05-02").datetime,
    )
    booking_sent_only = factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    factories.ContractFactory(booking=booking_sent_only, pdf_created=arrow.get("2030-05-01").datetime)
    booking_never_sent = factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    factories.ContractFactory(booking=booking_never_sent)

    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["contracts_sent"] == 2
    assert result["contracts_signed"] == 1
    assert result["signature_rate"] == 50.0


def test_length_of_stay_bucketing_at_edges():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    for duration in (3, 4, 13, 14, 21):
        factories.BookingFactory(
            lodgings=lodging,
            duration=duration,
            begin_date=arrow.get("2030-06-01").date(),
            end_date=arrow.get("2030-06-01").shift(days=duration).date(),
        )
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    counts = {row["label"]: row["count"] for row in result["length_of_stay_distribution"]}
    assert counts["1-3"] == 1
    assert counts["4-6"] == 1
    assert counts["7-13"] == 1
    assert counts["14-20"] == 1
    assert counts["21+"] == 1


def test_lead_time_uses_created_date_vs_begin_date():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    booking = factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-15").date(), end_date=arrow.get("2030-06-20").date()
    )
    set_created(booking, arrow.get("2030-06-01").datetime)
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["average_lead_time"] == 14.0
    counts = {row["label"]: row["count"] for row in result["lead_time_distribution"]}
    assert counts["8-30"] == 1


def test_multi_lodging_booking_counted_once_in_funnel():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=[lodging1, lodging2],
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    result = get_booking_funnel_and_conversion(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_bookings"] == 1
    counts = {row["status"]: row["count"] for row in result["funnel"]}
    assert counts["paid"] == 1


# --------------------------------------------------------------------------- get_channel_revenue / channel_distribution view


def test_channel_revenue_direct_and_named_channel():
    factories.BookingChannelFactory.create_batch(8)
    lodging = factories.LodgingFactory(daily_rate=100)
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
        source=models.BookingChannel.objects.get(name="airbnb"),
    )
    revenue = get_channel_revenue(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert revenue[None] == 1600
    assert revenue["airbnb"] == 1600


def test_channel_revenue_multi_lodging_booking_not_doubled():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=[lodging1, lodging2],
        begin_date=arrow.get("2020-08-02").date(),
        end_date=arrow.get("2020-08-18").date(),
        duration=16,
        price=2000,
    )
    revenue = get_channel_revenue(user, arrow.get("2020-01-01"), arrow.get("2020-09-30"))
    assert revenue[None] == 2000


def test_channel_distribution_view_hides_turnover_without_view_prices():
    lodging = factories.LodgingFactory(daily_rate=100)
    plain_user = make_plain_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    response = make_client(plain_user).get("/stats/channel_distribution/2030-01-01/2030-12-31/")
    assert response.status_code == status.HTTP_200_OK
    assert all("turnover" not in row for row in response.data)


def test_channel_distribution_view_exposes_turnover_with_view_prices():
    lodging = factories.LodgingFactory(daily_rate=100)
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    response = make_client(user).get("/stats/channel_distribution/2030-01-01/2030-12-31/")
    assert response.status_code == status.HTTP_200_OK
    direct_row = next(row for row in response.data if row["channel"] is None)
    assert direct_row["turnover"] == 1600


# --------------------------------------------------------------------------- get_season_breakdown


def test_season_breakdown_no_calendar_is_unassigned():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    result = get_season_breakdown(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert "unassigned" in result
    assert result["unassigned"]["bookings"] == 1


def test_season_breakdown_buckets_by_season_at_begin_date():
    calendar = factories.SeasonCalendarFactory()
    season = factories.SeasonFactory(calendar=calendar, name="High")
    factories.SeasonDateRangeFactory(
        season=season, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-30").date()
    )
    lodging = factories.LodgingFactory(season_calendar=calendar, daily_rate=100)
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-06-10").date(),
        end_date=arrow.get("2030-06-15").date(),
        duration=5,
        price=500,
    )
    result = get_season_breakdown(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["High"]["bookings"] == 1
    assert result["High"]["days"] == 5
    assert result["High"]["turnover"] == 500


def test_season_breakdown_gap_in_coverage_falls_back_to_unassigned():
    calendar = factories.SeasonCalendarFactory()
    season = factories.SeasonFactory(calendar=calendar, name="High")
    factories.SeasonDateRangeFactory(
        season=season, begin_date=arrow.get("2030-01-01").date(), end_date=arrow.get("2030-01-31").date()
    )
    lodging = factories.LodgingFactory(season_calendar=calendar)
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-10").date(), end_date=arrow.get("2030-06-15").date(), duration=5
    )
    result = get_season_breakdown(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert "unassigned" in result
    assert "High" not in result or result["High"]["bookings"] == 0


def test_season_breakdown_without_turnover_permission():
    calendar = factories.SeasonCalendarFactory()
    season = factories.SeasonFactory(calendar=calendar, name="High")
    factories.SeasonDateRangeFactory(
        season=season, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-30").date()
    )
    lodging = factories.LodgingFactory(season_calendar=calendar, daily_rate=100)
    user = make_user(lodging)
    factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-10").date(), end_date=arrow.get("2030-06-15").date(), duration=5
    )
    result = get_season_breakdown(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"), with_turnover=False)
    assert "turnover" not in result["High"]
    assert result["High"]["bookings"] == 1


# --------------------------------------------------------------------------- get_payments_overview


def test_payments_overview_empty_period_returns_zeroes():
    user = make_user()
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["payment_methods"] == []
    assert result["total_collected"] == 0
    assert result["total_outstanding"] == 0
    assert result["total_tourist_tax"] == 0
    assert result["total_guests"] == 0
    assert result["bookings_count"] == 0


def test_payments_overview_groups_by_method():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    booking = factories.BookingFactory(
        lodgings=lodging, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    factories.PaymentFactory(
        booking=booking, amount=150, method=models.Payment.PaymentMethod.TRANSFER, date=arrow.get("2030-06-01").date()
    )
    factories.PaymentFactory(
        booking=booking, amount=50, method=models.Payment.PaymentMethod.CASH, date=arrow.get("2030-06-02").date()
    )
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    methods = {row["method"]: row["total"] for row in result["payment_methods"]}
    assert methods["transfer"] == 150
    assert methods["cash"] == 50
    assert result["total_collected"] == 200


def test_payments_overview_outstanding_reflects_left_to_pay():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    booking = factories.BookingFactory(
        lodgings=lodging,
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
        duration=7,
        price=700,
    )
    factories.PaymentFactory(
        booking=booking, amount=200, method=models.Payment.PaymentMethod.TRANSFER, date=arrow.get("2030-06-01").date()
    )
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_outstanding"] == booking.left_to_pay


def test_payments_overview_total_guests_sums_multi_lodging_distribution():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    booking = factories.BookingFactory(
        lodgings=[lodging1, lodging2],
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    booking.guests_distribution = {
        str(lodging1.id): {"adults": 2, "children": 1, "babies": 0},
        str(lodging2.id): {"adults": 1, "children": 0, "babies": 1},
    }
    booking.save(update_fields=["guests_distribution"])
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_guests"] == booking.guests


def test_payments_overview_endpoint_forbidden_without_view_prices():
    lodging = factories.LodgingFactory()
    plain_user = make_plain_user(lodging)
    response = make_client(plain_user).get("/stats/payments_overview/2030-01-01/2030-12-31/")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_payments_overview_endpoint_ok_with_view_prices():
    lodging = factories.LodgingFactory()
    user = make_user(lodging)
    response = make_client(user).get("/stats/payments_overview/2030-01-01/2030-12-31/")
    assert response.status_code == status.HTTP_200_OK


def test_payments_overview_filters_by_account():
    other_account = factories.AccountFactory(name="other-account-payments")
    other_lodging = factories.LodgingFactory(account=other_account)
    other_booking = factories.BookingFactory(account=other_account, lodgings=other_lodging)
    factories.PaymentFactory(booking=other_booking, amount=999, date=arrow.get("2030-06-01").date())

    user = make_user()
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"))
    assert result["total_collected"] == 0


# --------------------------------------------------------------------------- booking_funnel endpoint


def test_booking_funnel_endpoint_needs_no_view_prices_permission():
    lodging = factories.LodgingFactory()
    plain_user = make_plain_user(lodging)
    factories.BookingFactory(
        lodgings=lodging,
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    response = make_client(plain_user).get("/stats/booking_funnel/2030-01-01/2030-12-31/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["total_bookings"] == 1


# --------------------------------------------------------------------------- lodging filter


def test_filling_rate_lodging_filter_restricts_to_selected_lodging():
    lodging1 = factories.LodgingFactory(daily_rate=100)
    lodging2 = factories.LodgingFactory(daily_rate=100)
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=lodging1,
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
        duration=7,
        price=700,
    )
    factories.BookingFactory(
        lodgings=lodging2,
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
        duration=7,
        price=700,
    )
    result = get_filling_rate_and_turnover(
        user, arrow.get("2030-06-01"), arrow.get("2030-06-30"), lodging_ids=[lodging1.id]
    )
    row = result[0]
    assert row["lodgings"] == [lodging1.id]
    assert str(lodging2.id) not in row
    assert row["days"] == 7


def test_booking_funnel_lodging_filter_restricts_to_selected_lodging():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=lodging1,
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    factories.BookingFactory(
        lodgings=lodging2,
        status="paid",
        begin_date=arrow.get("2030-06-01").date(),
        end_date=arrow.get("2030-06-08").date(),
    )
    result = get_booking_funnel_and_conversion(
        user, arrow.get("2030-01-01"), arrow.get("2030-12-31"), lodging_ids=[lodging1.id]
    )
    assert result["total_bookings"] == 1


def test_channel_revenue_lodging_filter_restricts_to_selected_lodging():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=lodging1,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    factories.BookingFactory(
        lodgings=lodging2,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=800,
    )
    revenue = get_channel_revenue(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"), lodging_ids=[lodging1.id])
    assert revenue[None] == 1600


def test_channel_distribution_view_lodging_filter():
    lodging1 = factories.LodgingFactory(daily_rate=100)
    lodging2 = factories.LodgingFactory(daily_rate=100)
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=lodging1,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    factories.BookingFactory(
        lodgings=lodging2,
        begin_date=arrow.get("2030-08-02").date(),
        end_date=arrow.get("2030-08-18").date(),
        duration=16,
        price=1600,
    )
    response = make_client(user).get(f"/stats/channel_distribution/2030-01-01/2030-12-31/?lodging={lodging1.id}")
    assert response.status_code == status.HTTP_200_OK
    direct_row = next(row for row in response.data if row["channel"] is None)
    assert direct_row["count"] == 1
    assert direct_row["turnover"] == 1600


def test_season_breakdown_lodging_filter_excludes_unselected_lodging_from_multi_lodging_booking():
    calendar1 = factories.SeasonCalendarFactory()
    season1 = factories.SeasonFactory(calendar=calendar1, name="High")
    factories.SeasonDateRangeFactory(
        season=season1, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-30").date()
    )
    calendar2 = factories.SeasonCalendarFactory()
    season2 = factories.SeasonFactory(calendar=calendar2, name="Low")
    factories.SeasonDateRangeFactory(
        season=season2, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-30").date()
    )
    lodging1 = factories.LodgingFactory(season_calendar=calendar1, daily_rate=100)
    lodging2 = factories.LodgingFactory(season_calendar=calendar2, daily_rate=100)
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    factories.BookingFactory(
        lodgings=[lodging1, lodging2],
        begin_date=arrow.get("2030-06-10").date(),
        end_date=arrow.get("2030-06-15").date(),
        duration=5,
        price=1000,
    )
    result = get_season_breakdown(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"), lodging_ids=[lodging1.id])
    assert "High" in result
    assert "Low" not in result
    # the unselected lodging is dropped from the split, so the full turnover attributes to lodging1
    assert result["High"]["turnover"] == 1000


def test_payments_overview_lodging_filter_restricts_to_selected_lodging():
    lodging1 = factories.LodgingFactory()
    lodging2 = factories.LodgingFactory()
    user = make_user(lodging1)
    user.lodgings.add(lodging2)
    booking1 = factories.BookingFactory(
        lodgings=lodging1, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    booking2 = factories.BookingFactory(
        lodgings=lodging2, begin_date=arrow.get("2030-06-01").date(), end_date=arrow.get("2030-06-08").date()
    )
    factories.PaymentFactory(
        booking=booking1, amount=150, method=models.Payment.PaymentMethod.TRANSFER, date=arrow.get("2030-06-01").date()
    )
    factories.PaymentFactory(
        booking=booking2, amount=250, method=models.Payment.PaymentMethod.TRANSFER, date=arrow.get("2030-06-01").date()
    )
    result = get_payments_overview(user, arrow.get("2030-01-01"), arrow.get("2030-12-31"), lodging_ids=[lodging1.id])
    assert result["total_collected"] == 150
    assert result["bookings_count"] == 1
