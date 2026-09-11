"""Tests for the advanced pricing engine (:mod:`core.pricing`) and the quote endpoint."""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from core import models
from core.pricing import compute_quote
from core.tests import factories
from core.tests.helpers import force_login

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("default_groups")]


def _lodging(daily_rate: str = "100.00", **kwargs) -> models.Lodging:
    return factories.LodgingFactory.create(daily_rate=Decimal(daily_rate), **kwargs)


def _sum_line_amounts(quote_lodging) -> Decimal:
    return sum((line.amount for line in quote_lodging.adjustments), Decimal(0))


# --------------------------------------------------------------------------- base rate


def test_flat_daily_rate_when_no_calendar() -> None:
    lodging = _lodging("80.00")
    quote = compute_quote(
        lodgings=[lodging], begin_date=date(2027, 3, 1), end_date=date(2027, 3, 6)
    )  # Mon 1 -> Sat 6 = 5 nights
    assert quote.nights == 5
    assert quote.total_price == Decimal("400.00")
    assert quote.effective_daily_rate == Decimal("80.00")
    assert all(n.rate_source == "lodging_default" for n in quote.lodgings[0].nights)


def test_weekend_override_hits_friday_and_saturday_nights() -> None:
    calendar = factories.SeasonCalendarFactory.create()
    season = factories.SeasonFactory.create(calendar=calendar, rank=0)
    factories.SeasonDateRangeFactory.create(season=season, begin_date=date(2027, 6, 1), end_date=date(2027, 6, 30))
    lodging = _lodging("100.00", season_calendar=calendar)
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=season, nightly_rate=Decimal("100.00"), weekend_rate=Decimal("150.00"), min_nights=None
    )
    # Thu 2027-06-03 -> Mon 2027-06-07: nights Thu, Fri, Sat, Sun
    quote = compute_quote(lodgings=[lodging], begin_date=date(2027, 6, 3), end_date=date(2027, 6, 7))
    rates = {n.date.isoformat(): n.applied_rate for n in quote.lodgings[0].nights}
    assert rates["2027-06-03"] == Decimal("100.00")  # Thursday
    assert rates["2027-06-04"] == Decimal("150.00")  # Friday
    assert rates["2027-06-05"] == Decimal("150.00")  # Saturday
    assert rates["2027-06-06"] == Decimal("100.00")  # Sunday
    assert quote.total_price == Decimal("500.00")


def test_season_matched_but_no_rate_row_falls_back_to_daily_rate() -> None:
    calendar = factories.SeasonCalendarFactory.create()
    season = factories.SeasonFactory.create(calendar=calendar)
    factories.SeasonDateRangeFactory.create(season=season, begin_date=date(2027, 7, 1), end_date=date(2027, 7, 31))
    lodging = _lodging("90.00", season_calendar=calendar)
    quote = compute_quote(lodgings=[lodging], begin_date=date(2027, 7, 10), end_date=date(2027, 7, 13))
    assert quote.total_price == Decimal("270.00")
    assert all(n.rate_source == "lodging_default" for n in quote.lodgings[0].nights)


def test_stay_spanning_two_seasons_splits_nights() -> None:
    calendar = factories.SeasonCalendarFactory.create()
    low = factories.SeasonFactory.create(calendar=calendar, name="Low", rank=1)
    high = factories.SeasonFactory.create(calendar=calendar, name="High", rank=0)
    factories.SeasonDateRangeFactory.create(season=low, begin_date=date(2027, 5, 1), end_date=date(2027, 5, 31))
    factories.SeasonDateRangeFactory.create(season=high, begin_date=date(2027, 6, 1), end_date=date(2027, 6, 30))
    lodging = _lodging("100.00", season_calendar=calendar)
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=low, nightly_rate=Decimal("80.00"), weekend_rate=None, min_nights=None
    )
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=high, nightly_rate=Decimal("200.00"), weekend_rate=None, min_nights=None
    )
    # 2027-05-30 -> 2027-06-02 : nights 05-30, 05-31 (low), 06-01 (high)
    quote = compute_quote(lodgings=[lodging], begin_date=date(2027, 5, 30), end_date=date(2027, 6, 2))
    assert quote.lodgings[0].nightly_subtotal == Decimal("360.00")
    assert quote.total_price == Decimal("360.00")


def test_overlapping_ranges_pick_lowest_rank_and_warn() -> None:
    calendar = factories.SeasonCalendarFactory.create()
    a = factories.SeasonFactory.create(calendar=calendar, name="A", rank=5)
    b = factories.SeasonFactory.create(calendar=calendar, name="B", rank=1)
    factories.SeasonDateRangeFactory.create(season=a, begin_date=date(2027, 8, 1), end_date=date(2027, 8, 20))
    factories.SeasonDateRangeFactory.create(season=b, begin_date=date(2027, 8, 10), end_date=date(2027, 8, 31))
    lodging = _lodging("100.00", season_calendar=calendar)
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=a, nightly_rate=Decimal("100.00"), weekend_rate=None, min_nights=None
    )
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=b, nightly_rate=Decimal("300.00"), weekend_rate=None, min_nights=None
    )
    quote = compute_quote(lodgings=[lodging], begin_date=date(2027, 8, 12), end_date=date(2027, 8, 14))
    assert quote.lodgings[0].nights[0].season == "B"  # lowest rank wins
    assert any(w["code"] == "season_overlap" for w in quote.warnings)


# --------------------------------------------------------------------------- length of stay


@pytest.mark.parametrize(
    "nights,expected_label",
    [(6, None), (7, "Weekly discount"), (27, "Weekly discount"), (28, "Monthly discount")],
)
def test_length_of_stay_discount_thresholds(nights: int, expected_label: str) -> None:
    lodging = _lodging("100.00")
    lodging.weekly_discount_percent = Decimal("10.00")
    lodging.monthly_discount_percent = Decimal("25.00")
    lodging.save()
    begin = date(2027, 4, 5)
    quote = compute_quote(lodgings=[lodging], begin_date=begin, end_date=begin + timedelta(days=nights))
    los_lines = [line for line in quote.lodgings[0].adjustments if line.type == "los_discount"]
    if expected_label is None:
        assert los_lines == []
        assert quote.total_price == Decimal(100 * nights)
    else:
        assert los_lines[0].label == expected_label
        pct = Decimal("25.00") if expected_label == "Monthly discount" else Decimal("10.00")
        gross = Decimal(100 * nights)
        assert quote.total_price == gross - (gross * pct / 100)


def test_los_discount_basis_is_pre_adjustment_subtotal() -> None:
    lodging = _lodging("100.00")
    lodging.weekly_discount_percent = Decimal("10.00")
    lodging.save()
    quote = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 15))  # 10 nights
    los = quote.lodgings[0].adjustments[0]
    assert los.basis == Decimal("1000.00")
    assert los.amount == Decimal("-100.00")


# --------------------------------------------------------------------------- adjustment rules


def _adjustment(account, **kwargs) -> models.PricingAdjustment:
    defaults = dict(
        name="rule",
        adjustment_type=models.PricingAdjustment.AdjustmentType.PERCENT,
        value=Decimal("-10.00"),
        priority=0,
        stackable=True,
        active=True,
    )
    defaults.update(kwargs)
    return factories.PricingAdjustmentFactory.create(account=account, **defaults)


def test_last_minute_rule_matches_on_days_before_arrival() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="Last minute", value=Decimal("-15.00"), max_days_before_arrival=7)
    begin = date(2027, 9, 10)
    # 7 days before -> applies
    q_in = compute_quote(
        lodgings=[lodging], begin_date=begin, end_date=begin + timedelta(days=3), booking_date=begin - timedelta(days=7)
    )
    assert q_in.total_price == Decimal("255.00")  # 300 - 15%
    # 8 days before -> does not apply
    q_out = compute_quote(
        lodgings=[lodging], begin_date=begin, end_date=begin + timedelta(days=3), booking_date=begin - timedelta(days=8)
    )
    assert q_out.total_price == Decimal("300.00")


def test_early_bird_rule_matches_on_min_days_before_arrival() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="Early bird", value=Decimal("-20.00"), min_days_before_arrival=90)
    begin = date(2027, 12, 1)
    q = compute_quote(
        lodgings=[lodging],
        begin_date=begin,
        end_date=begin + timedelta(days=2),
        booking_date=begin - timedelta(days=120),
    )
    assert q.total_price == Decimal("160.00")  # 200 - 20%


def test_stackable_rules_compound_in_priority_order() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="A -10%", value=Decimal("-10.00"), priority=1)
    _adjustment(lodging.account, name="B -20%", value=Decimal("-20.00"), priority=2)
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 8))  # 300
    # 300 -> -10% = 270 -> -20% = 216
    assert q.total_price == Decimal("216.00")
    assert [line.amount for line in q.lodgings[0].adjustments] == [Decimal("-30.00"), Decimal("-54.00")]


def test_non_stackable_rule_stops_lower_priority_rules() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="A -10%", value=Decimal("-10.00"), priority=1, stackable=True)
    _adjustment(lodging.account, name="B exclusive -30%", value=Decimal("-30.00"), priority=2, stackable=False)
    _adjustment(lodging.account, name="C -50%", value=Decimal("-50.00"), priority=3)
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 7))  # 200
    # 200 -> -10% = 180 -> -30% = 126 ; rule C never applied
    assert q.total_price == Decimal("126.00")
    assert len(q.lodgings[0].adjustments) == 2


def test_fixed_adjustment_and_surcharge() -> None:
    lodging = _lodging("100.00")
    _adjustment(
        lodging.account,
        name="Cleaning fee",
        adjustment_type=models.PricingAdjustment.AdjustmentType.FIXED,
        value=Decimal("45.00"),
    )
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 7))  # 200
    assert q.total_price == Decimal("245.00")


def test_price_is_clamped_to_zero() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="Crazy", value=Decimal("-150.00"))
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 7))
    assert q.total_price == Decimal("0.00")


def test_weekday_adjustment_only_targets_matching_nights() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="Sunday special", value=Decimal("-50.00"), applicable_weekdays=[6])
    # Fri 2027-04-09 -> Tue 2027-04-13 : nights Fri, Sat, Sun, Mon ; only Sunday discounted
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 9), end_date=date(2027, 4, 13))
    assert q.total_price == Decimal("350.00")  # 400 - 50% of one 100 night


def test_reconciliation_invariant() -> None:
    lodging = _lodging("123.45")
    lodging.weekly_discount_percent = Decimal("7.50")
    lodging.save()
    _adjustment(lodging.account, name="promo", value=Decimal("-12.50"))
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 15))
    ql = q.lodgings[0]
    assert ql.nightly_subtotal + _sum_line_amounts(ql) == ql.price


# --------------------------------------------------------------------------- deposit / min nights / multi-lodging


def test_deposit_rounded_to_nearest_ten() -> None:
    lodging = _lodging("97.00", deposit_percent=30)
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 12))  # 7 * 97 = 679
    # 30% of 679 = 203.7 -> nearest 10 = 200
    assert q.total_deposit == Decimal("200")


def test_min_nights_emits_non_blocking_warning() -> None:
    calendar = factories.SeasonCalendarFactory.create()
    season = factories.SeasonFactory.create(calendar=calendar)
    factories.SeasonDateRangeFactory.create(season=season, begin_date=date(2027, 7, 1), end_date=date(2027, 7, 31))
    lodging = _lodging("100.00", season_calendar=calendar, min_nights=2)
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=season, nightly_rate=Decimal("100.00"), weekend_rate=None, min_nights=5
    )
    q = compute_quote(lodgings=[lodging], begin_date=date(2027, 7, 10), end_date=date(2027, 7, 13))  # 3 nights
    warning = next(w for w in q.warnings if w["code"] == "min_nights")
    assert warning["required"] == 5
    assert warning["actual"] == 3
    assert q.total_price == Decimal("300.00")


def test_multi_lodging_sums_prices_and_deposits() -> None:
    account = factories.AccountFactory.create(name="multi")
    a = _lodging("100.00", account=account, deposit_percent=30)
    b = _lodging("200.00", account=account, deposit_percent=50)
    q = compute_quote(lodgings=[a, b], begin_date=date(2027, 4, 5), end_date=date(2027, 4, 8))  # 3 nights
    assert q.total_price == Decimal("900.00")  # 300 + 600
    assert {ql.lodging_id for ql in q.lodgings} == {a.id, b.id}
    # deposits: 30% of 300 = 90 ; 50% of 600 = 300
    assert q.total_deposit == Decimal("390")


def test_flat_rate_short_circuit() -> None:
    lodging = _lodging("100.00")
    _adjustment(lodging.account, name="ignored", value=Decimal("-90.00"))
    q = compute_quote(
        lodgings=[lodging],
        begin_date=date(2027, 4, 5),
        end_date=date(2027, 4, 10),
        is_flat_rate=True,
        flat_price=Decimal("777.00"),
    )
    assert q.total_price == Decimal("777.00")
    assert q.lodgings[0].adjustments[0].type == "flat_rate"


# --------------------------------------------------------------------------- quote endpoint


@pytest.fixture
def priced_client(default_groups) -> tuple:
    lodging = _lodging("100.00")
    user = factories.StandardUserFactory.create(account=lodging.account)
    user.lodgings.add(lodging)
    client = APIClient()
    client.credentials(**force_login(user, client))
    return client, lodging


def test_quote_endpoint_returns_breakdown(priced_client) -> None:
    client, lodging = priced_client
    response = client.post(
        "/api/booking/quote/",
        {"lodging_ids": [lodging.id], "begin_date": "2027-04-05", "end_date": "2027-04-08"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["total_price"] == "300.00"
    assert response.data["nights"] == 3
    assert len(response.data["lodgings"][0]["nights"]) == 3


def test_quote_endpoint_rejects_bad_dates(priced_client) -> None:
    client, lodging = priced_client
    response = client.post(
        "/api/booking/quote/",
        {"lodging_ids": [lodging.id], "begin_date": "2027-04-08", "end_date": "2027-04-05"},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_quote_endpoint_rejects_foreign_lodging(priced_client) -> None:
    client, _ = priced_client
    other = _lodging("100.00", account=factories.AccountFactory.create(name="foreign"))
    response = client.post(
        "/api/booking/quote/",
        {"lodging_ids": [other.id], "begin_date": "2027-04-05", "end_date": "2027-04-08"},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_quote_endpoint_requires_view_prices(default_groups) -> None:
    from django.contrib.auth.models import Permission

    lodging = _lodging("100.00")
    user = factories.StandardUserFactory.create(account=lodging.account)
    user.groups.clear()
    user.user_permissions.add(Permission.objects.get(codename="view_booking"))
    user.lodgings.add(lodging)
    user = models.User.objects.get(pk=user.pk)
    client = APIClient()
    client.credentials(**force_login(user, client))
    response = client.post(
        "/api/booking/quote/",
        {"lodging_ids": [lodging.id], "begin_date": "2027-04-05", "end_date": "2027-04-08"},
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --------------------------------------------------------------------------- booking serializer recompute


def test_booking_create_computes_price_from_engine(priced_client) -> None:
    client, lodging = priced_client
    response = client.post(
        "/api/booking/",
        {
            "lodging_ids": [lodging.id],
            "guest_name": "Ada",
            "guest_contact": "ada@example.com",
            "status": "option",
            "begin_date": "2027-04-05",
            "end_date": "2027-04-10",
            "duration": 5,
            "daily_rate": "999.00",  # read-only: must be ignored
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    booking = models.Booking.objects.get(pk=response.data["id"])
    assert booking.price == Decimal("500.00")
    assert booking.daily_rate == Decimal("100.00")  # engine value, not the submitted 999
    assert booking.price_details is not None
    assert booking.price_details["total_price"] == "500.00"


def test_booking_flat_rate_sets_effective_daily_rate(priced_client) -> None:
    client, lodging = priced_client
    response = client.post(
        "/api/booking/",
        {
            "lodging_ids": [lodging.id],
            "guest_name": "Flat",
            "guest_contact": "flat@example.com",
            "status": "option",
            "begin_date": "2027-04-05",
            "end_date": "2027-04-09",
            "duration": 4,
            "is_flat_rate": True,
            "price": "480.00",
            "daily_rate": "1.00",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    booking = models.Booking.objects.get(pk=response.data["id"])
    assert booking.price == Decimal("480.00")
    assert booking.daily_rate == Decimal("120.00")  # 480 / 4


def test_booking_flat_rate_keeps_client_price_but_stores_breakdown(priced_client) -> None:
    client, lodging = priced_client
    response = client.post(
        "/api/booking/",
        {
            "lodging_ids": [lodging.id],
            "guest_name": "Grace",
            "guest_contact": "grace@example.com",
            "status": "option",
            "begin_date": "2027-04-05",
            "end_date": "2027-04-10",
            "duration": 5,
            "is_flat_rate": True,
            "price": "420.00",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    booking = models.Booking.objects.get(pk=response.data["id"])
    assert booking.price == Decimal("420.00")
    assert booking.price_details["is_flat_rate"] is True


def test_booking_update_refreshes_price_details_on_date_change(priced_client) -> None:
    client, lodging = priced_client
    booking = factories.BookingFactory.create(lodgings=lodging, account=lodging.account)
    response = client.patch(
        f"/api/booking/{booking.id}/",
        {"begin_date": "2027-04-05", "end_date": "2027-04-09", "duration": 4},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    booking.refresh_from_db()
    assert booking.price == Decimal("400.00")
    assert booking.price_details["nights"] == 4


# --------------------------------------------------------------------------- season calendar API


@pytest.fixture
def admin_client(default_groups) -> tuple:
    lodging = _lodging("100.00")
    user = factories.AdminUserFactory.create(account=lodging.account)
    client = APIClient()
    client.credentials(**force_login(user, client))
    return client, lodging


def test_season_calendar_nested_create_and_update(admin_client) -> None:
    client, lodging = admin_client
    payload = {
        "name": "Standard",
        "seasons": [
            {
                "name": "High",
                "color": "#ff0000",
                "rank": 0,
                "date_ranges": [{"begin_date": "2027-07-01", "end_date": "2027-08-31"}],
            },
            {
                "name": "Low",
                "rank": 1,
                "date_ranges": [{"begin_date": "2027-01-01", "end_date": "2027-03-31"}],
            },
        ],
    }
    response = client.post("/api/season_calendar/", payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED, response.data
    calendar_id = response.data["id"]
    assert models.Season.objects.filter(calendar_id=calendar_id).count() == 2
    assert models.SeasonDateRange.objects.filter(season__calendar_id=calendar_id).count() == 2

    # drop the "Low" season on update
    high = models.Season.objects.get(calendar_id=calendar_id, name="High")
    response = client.put(
        f"/api/season_calendar/{calendar_id}/",
        {
            "name": "Standard",
            "seasons": [
                {
                    "id": high.id,
                    "name": "High",
                    "color": "#ff0000",
                    "rank": 0,
                    "date_ranges": [{"begin_date": "2027-07-01", "end_date": "2027-09-15"}],
                }
            ],
        },
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    assert models.Season.objects.filter(calendar_id=calendar_id).count() == 1
    assert models.SeasonDateRange.objects.get(season=high).end_date.isoformat() == "2027-09-15"


def test_season_calendar_rejects_overlapping_ranges(admin_client) -> None:
    client, lodging = admin_client
    payload = {
        "name": "Bad",
        "seasons": [
            {"name": "A", "date_ranges": [{"begin_date": "2027-07-01", "end_date": "2027-07-31"}]},
            {"name": "B", "date_ranges": [{"begin_date": "2027-07-15", "end_date": "2027-08-15"}]},
        ],
    }
    response = client.post("/api/season_calendar/", payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_lodging_accepts_and_clears_season_calendar(admin_client) -> None:
    client, lodging = admin_client
    calendar = factories.SeasonCalendarFactory.create(account=lodging.account)
    response = client.patch(f"/api/lodging/{lodging.id}/", {"season_calendar": calendar.id}, format="json")
    assert response.status_code == status.HTTP_200_OK, response.data
    lodging.refresh_from_db()
    assert lodging.season_calendar_id == calendar.id
    # empty string clears it
    response = client.patch(f"/api/lodging/{lodging.id}/", {"season_calendar": ""}, format="json")
    assert response.status_code == status.HTTP_200_OK, response.data
    lodging.refresh_from_db()
    assert lodging.season_calendar_id is None


def test_rate_calendar_endpoint_returns_per_day_rates(priced_client) -> None:
    client, lodging = priced_client
    calendar = factories.SeasonCalendarFactory.create(account=lodging.account)
    season = factories.SeasonFactory.create(calendar=calendar)
    factories.SeasonDateRangeFactory.create(season=season, begin_date=date(2027, 7, 1), end_date=date(2027, 7, 31))
    lodging.season_calendar = calendar
    lodging.save()
    factories.LodgingSeasonRateFactory.create(
        lodging=lodging, season=season, nightly_rate=Decimal("175.00"), weekend_rate=None, min_nights=None
    )
    response = client.get("/api/lodging/rate_calendar/?begin=2027-07-10&end=2027-07-13")
    assert response.status_code == status.HTTP_200_OK, response.data
    rows = response.data[str(lodging.id)] if str(lodging.id) in response.data else response.data[lodging.id]
    assert [row["rate"] for row in rows] == ["175.00", "175.00", "175.00"]
    assert rows[0]["season"] == season.name


def test_pricing_adjustment_crud_normalises_empty_optional_fields(admin_client) -> None:
    client, lodging = admin_client
    response = client.post(
        "/api/pricing_adjustment/",
        {
            "name": "Last minute",
            "lodging": "",
            "adjustment_type": "percent",
            "value": "-15.00",
            "max_days_before_arrival": 10,
            "min_nights": "",
            "stay_begin": "",
            "applicable_weekdays": "",
            "priority": 0,
            "stackable": True,
            "active": True,
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    rule = models.PricingAdjustment.objects.get(pk=response.data["id"])
    assert rule.lodging_id is None
    assert rule.min_nights is None
    assert rule.stay_begin is None
    assert rule.max_days_before_arrival == 10
    assert rule.account_id == lodging.account_id


def test_pricing_adjustment_rejects_foreign_lodging(admin_client) -> None:
    client, _ = admin_client
    other = _lodging("100.00", account=factories.AccountFactory.create(name="foreign-adj"))
    response = client.post(
        "/api/pricing_adjustment/",
        {"name": "x", "lodging": other.id, "adjustment_type": "percent", "value": "-5.00",
         "priority": 0, "stackable": True, "active": True},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_lodging_season_rate_rejects_season_from_another_calendar(admin_client) -> None:
    client, lodging = admin_client
    own_calendar = factories.SeasonCalendarFactory.create(account=lodging.account)
    lodging.season_calendar = own_calendar
    lodging.save()
    stray_season = factories.SeasonFactory.create(
        calendar=factories.SeasonCalendarFactory.create(account=lodging.account)
    )
    response = client.post(
        "/api/lodging_season_rate/",
        {"lodging": lodging.id, "season": stray_season.id, "nightly_rate": "120.00"},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
