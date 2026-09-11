"""Advanced pricing engine.

Given one or more lodgings and a stay, :func:`compute_quote` resolves a nightly
rate for every night (season rate, then weekend override), applies the
length-of-stay discount, then the matching :class:`~core.models.PricingAdjustment`
rules, and returns a :class:`Quote` carrying the total and a full breakdown.

The engine is pure: it reads the database but never writes. All money is handled
as :class:`~decimal.Decimal`; rounding goes through
:func:`core.tools.round_half_up`.
"""

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Iterable, Optional

from django.db.models import Q

from core.models import LodgingSeasonRate, PricingAdjustment, SeasonDateRange
from core.tools import round_half_up

logger = logging.getLogger(__name__)

WEEKEND_WEEKDAYS = frozenset({4, 5})  # Friday, Saturday (a night belongs to its start date)
WEEKLY_MIN_NIGHTS = 7
MONTHLY_MIN_NIGHTS = 28
DEPOSIT_ROUNDING = 10  # deposit rounded to the nearest multiple of this
CURRENCY = "EUR"

ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Round a positive-or-negative amount to 2 decimals, half away from zero."""
    value = Decimal(value)
    if value < 0:
        return -round_half_up(-value, 2)
    return round_half_up(value, 2)


def _s(value) -> str:
    return f"{Decimal(value):.2f}"


@dataclass
class QuoteNight:
    date: date
    weekday: int
    season: Optional[str]
    rate_source: str  # "season_rate" | "lodging_default"
    base_rate: Decimal
    applied_rate: Decimal
    is_weekend: bool

    def as_dict(self) -> dict:
        return {
            "date": self.date.isoformat(),
            "weekday": self.weekday,
            "season": self.season,
            "rate_source": self.rate_source,
            "base_rate": _s(self.base_rate),
            "applied_rate": _s(self.applied_rate),
            "is_weekend": self.is_weekend,
        }


@dataclass
class QuoteLine:
    type: str  # "los_discount" | "rule" | "flat_rate"
    label: str
    amount: Decimal
    basis: Optional[Decimal] = None
    percent: Optional[Decimal] = None
    rule_id: Optional[int] = None
    kind: Optional[str] = None
    value: Optional[Decimal] = None
    stackable: Optional[bool] = None

    def as_dict(self) -> dict:
        data = {"type": self.type, "label": self.label, "amount": _s(self.amount)}
        if self.basis is not None:
            data["basis"] = _s(self.basis)
        if self.percent is not None:
            data["percent"] = _s(self.percent)
        if self.rule_id is not None:
            data["rule_id"] = self.rule_id
        if self.kind is not None:
            data["kind"] = self.kind
        if self.value is not None:
            data["value"] = _s(self.value)
        if self.stackable is not None:
            data["stackable"] = self.stackable
        return data


@dataclass
class QuoteLodging:
    lodging_id: int
    lodging_name: str
    season_calendar_id: Optional[int]
    nightly_subtotal: Decimal
    price: Decimal
    deposit: Decimal
    nights: list = field(default_factory=list)
    adjustments: list = field(default_factory=list)
    warnings: list = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "lodging_id": self.lodging_id,
            "lodging_name": self.lodging_name,
            "season_calendar_id": self.season_calendar_id,
            "nightly_subtotal": _s(self.nightly_subtotal),
            "price": _s(self.price),
            "deposit": _s(self.deposit),
            "nights": [n.as_dict() for n in self.nights],
            "adjustments": [a.as_dict() for a in self.adjustments],
            "warnings": self.warnings,
        }


@dataclass
class Quote:
    begin_date: date
    end_date: date
    nights: int
    booking_date: date
    total_price: Decimal
    total_deposit: Decimal
    effective_daily_rate: Decimal
    is_flat_rate: bool
    lodgings: list = field(default_factory=list)
    warnings: list = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "begin_date": self.begin_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "nights": self.nights,
            "booking_date": self.booking_date.isoformat(),
            "currency": CURRENCY,
            "total_price": _s(self.total_price),
            "total_deposit": _s(self.total_deposit),
            "effective_daily_rate": _s(self.effective_daily_rate),
            "is_flat_rate": self.is_flat_rate,
            "warnings": self.warnings,
            "lodgings": [lodging.as_dict() for lodging in self.lodgings],
        }


def _night_dates(begin_date: date, end_date: date) -> list:
    return [begin_date + timedelta(days=n) for n in range((end_date - begin_date).days)]


def _resolve_nights(lodging, night_dates: list, season_ranges=None, rates_by_season=None):
    """Return ``(night_lines, min_nights_required, overlap_dates)`` for one lodging.

    ``season_ranges`` / ``rates_by_season`` may be pre-fetched by the caller (see
    :func:`resolve_rate_calendar`) to resolve many lodgings without a per-lodging query;
    left as ``None`` they are fetched here, as before.
    """
    if season_ranges is None:
        season_ranges = []
        if lodging.season_calendar_id:
            season_ranges = list(
                SeasonDateRange.objects.filter(
                    season__calendar_id=lodging.season_calendar_id,
                    begin_date__lte=night_dates[-1],
                    end_date__gte=night_dates[0],
                ).select_related("season")
            )
    if rates_by_season is None:
        rates_by_season = {
            rate.season_id: rate for rate in LodgingSeasonRate.objects.filter(lodging=lodging).select_related("season")
        }

    default_min_nights = lodging.min_nights or 1
    lines = []
    min_nights_required = default_min_nights
    overlap_dates = []

    for day in night_dates:
        matches = [r for r in season_ranges if r.begin_date <= day <= r.end_date]
        season = None
        if matches:
            matches.sort(key=lambda r: (r.season.rank, r.season_id, r.id))
            season = matches[0].season
            if len({r.season_id for r in matches}) > 1:
                overlap_dates.append(day.isoformat())

        rate = rates_by_season.get(season.id) if season else None
        if rate is not None:
            base_rate = rate.nightly_rate
            weekend_rate = rate.weekend_rate
            night_min = rate.min_nights or default_min_nights
            rate_source = "season_rate"
        else:
            base_rate = lodging.daily_rate
            weekend_rate = None
            night_min = default_min_nights
            rate_source = "lodging_default"

        min_nights_required = max(min_nights_required, night_min)

        is_weekend = day.weekday() in WEEKEND_WEEKDAYS
        if is_weekend and weekend_rate and weekend_rate > 0:
            applied_rate = weekend_rate
        else:
            applied_rate = base_rate

        lines.append(
            QuoteNight(
                date=day,
                weekday=day.weekday(),
                season=season.name if season else None,
                rate_source=rate_source,
                base_rate=Decimal(base_rate),
                applied_rate=Decimal(applied_rate),
                is_weekend=is_weekend,
            )
        )

    return lines, min_nights_required, overlap_dates


def resolve_rate_calendar(lodgings: Iterable, begin_date: date, end_date: date) -> dict:
    """Per-night base rate (season / weekend, no length-of-stay or adjustment discounts)
    for several lodgings over one window, e.g. for a planning calendar.

    Unlike calling :func:`compute_quote` once per lodging, this resolves every lodging in a
    constant number of queries (independent of the lodging count): one for every matching
    ``SeasonDateRange`` across all the lodgings' calendars, one for every ``LodgingSeasonRate``
    across all the lodgings.

    Returns ``{lodging_id: [{"date", "rate", "season", "is_weekend"}, ...]}``.
    """
    lodgings = list(lodgings)
    night_dates = _night_dates(begin_date, end_date)
    if not night_dates or not lodgings:
        return {lodging.id: [] for lodging in lodgings}

    calendar_ids = {lodging.season_calendar_id for lodging in lodgings if lodging.season_calendar_id}
    ranges_by_calendar: dict = {}
    if calendar_ids:
        for date_range in SeasonDateRange.objects.filter(
            season__calendar_id__in=calendar_ids,
            begin_date__lte=night_dates[-1],
            end_date__gte=night_dates[0],
        ).select_related("season"):
            ranges_by_calendar.setdefault(date_range.season.calendar_id, []).append(date_range)

    rates_by_lodging: dict = {}
    for rate in LodgingSeasonRate.objects.filter(lodging__in=lodgings).select_related("season"):
        rates_by_lodging.setdefault(rate.lodging_id, {})[rate.season_id] = rate

    result = {}
    for lodging in lodgings:
        night_lines, _, _ = _resolve_nights(
            lodging,
            night_dates,
            season_ranges=ranges_by_calendar.get(lodging.season_calendar_id, []),
            rates_by_season=rates_by_lodging.get(lodging.id, {}),
        )
        result[lodging.id] = [
            {
                "date": night.date.isoformat(),
                "rate": f"{night.applied_rate:.2f}",
                "season": night.season,
                "is_weekend": night.is_weekend,
            }
            for night in night_lines
        ]
    return result


def _los_discount(lodging, night_count: int, nightly_subtotal: Decimal):
    percent = None
    label = None
    if night_count >= MONTHLY_MIN_NIGHTS and lodging.monthly_discount_percent:
        percent = Decimal(lodging.monthly_discount_percent)
        label = "Monthly discount"
    elif night_count >= WEEKLY_MIN_NIGHTS and lodging.weekly_discount_percent:
        percent = Decimal(lodging.weekly_discount_percent)
        label = "Weekly discount"
    if not percent:
        return None
    amount = -_money(nightly_subtotal * percent / 100)
    return QuoteLine(
        type="los_discount",
        label=label,
        amount=amount,
        basis=_money(nightly_subtotal),
        percent=-percent,
    )


def _adjustment_matches(adj, night_count: int, begin_date: date, booking_date: date) -> bool:
    days_before = (begin_date - booking_date).days
    if adj.min_nights is not None and night_count < adj.min_nights:
        return False
    if adj.max_nights is not None and night_count > adj.max_nights:
        return False
    if adj.min_days_before_arrival is not None and days_before < adj.min_days_before_arrival:
        return False
    if adj.max_days_before_arrival is not None and days_before > adj.max_days_before_arrival:
        return False
    if adj.stay_begin is not None and begin_date < adj.stay_begin:
        return False
    if adj.stay_end is not None and begin_date > adj.stay_end:
        return False
    if adj.booking_begin is not None and booking_date < adj.booking_begin:
        return False
    if adj.booking_end is not None and booking_date > adj.booking_end:
        return False
    return True


def _apply_adjustments(
    lodging, night_lines, night_count, begin_date, booking_date, nightly_subtotal, subtotal_after_los
):
    candidates = (
        PricingAdjustment.objects.filter(account_id=lodging.account_id, active=True)
        .filter(Q(lodging=lodging) | Q(lodging__isnull=True))
        .order_by("priority", "id")
    )
    los_ratio = (subtotal_after_los / nightly_subtotal) if nightly_subtotal else Decimal(1)
    running = subtotal_after_los
    lines = []
    for adj in candidates:
        if not _adjustment_matches(adj, night_count, begin_date, booking_date):
            continue
        if adj.applicable_weekdays:
            weekdays = set(adj.applicable_weekdays)
            weekday_base = sum((n.applied_rate for n in night_lines if n.weekday in weekdays), Decimal(0))
            basis = _money(weekday_base * los_ratio)
        else:
            basis = running

        if adj.adjustment_type == PricingAdjustment.AdjustmentType.PERCENT:
            amount = _money(basis * Decimal(adj.value) / 100)
        else:
            amount = _money(adj.value)

        running += amount
        lines.append(
            QuoteLine(
                type="rule",
                label=adj.name,
                amount=amount,
                basis=_money(basis),
                rule_id=adj.id,
                kind=adj.adjustment_type,
                value=Decimal(adj.value),
                stackable=adj.stackable,
            )
        )
        if not adj.stackable:
            break

    return lines, running


def _deposit(price: Decimal, deposit_percent) -> Decimal:
    if not deposit_percent:
        return ZERO
    raw = price * Decimal(deposit_percent) / 100 / DEPOSIT_ROUNDING
    return round_half_up(raw, 0) * DEPOSIT_ROUNDING


def _quote_lodging_flat(lodging, flat_price: Decimal) -> QuoteLodging:
    price = _money(flat_price)
    return QuoteLodging(
        lodging_id=lodging.id,
        lodging_name=lodging.name,
        season_calendar_id=lodging.season_calendar_id,
        nightly_subtotal=price,
        price=price,
        deposit=_deposit(price, lodging.deposit_percent),
        nights=[],
        adjustments=[QuoteLine(type="flat_rate", label="Flat rate", amount=price)],
        warnings=[],
    )


def _quote_lodging(lodging, begin_date, end_date, booking_date, night_dates, apply_adjustments):
    night_lines, min_nights_required, overlap_dates = _resolve_nights(lodging, night_dates)
    night_count = len(night_lines)
    nightly_subtotal = sum((n.applied_rate for n in night_lines), Decimal(0))

    adjustments = []
    los_line = _los_discount(lodging, night_count, nightly_subtotal)
    if los_line is not None:
        adjustments.append(los_line)
    subtotal_after_los = nightly_subtotal + (los_line.amount if los_line else Decimal(0))

    running = subtotal_after_los
    if apply_adjustments:
        rule_lines, running = _apply_adjustments(
            lodging, night_lines, night_count, begin_date, booking_date, nightly_subtotal, subtotal_after_los
        )
        adjustments.extend(rule_lines)

    price = max(ZERO, _money(running))

    warnings = []
    for day in overlap_dates:
        warnings.append({"code": "season_overlap", "date": day, "lodging_id": lodging.id})
    if night_count < min_nights_required:
        warnings.append(
            {
                "code": "min_nights",
                "required": min_nights_required,
                "actual": night_count,
                "lodging_id": lodging.id,
            }
        )

    return QuoteLodging(
        lodging_id=lodging.id,
        lodging_name=lodging.name,
        season_calendar_id=lodging.season_calendar_id,
        nightly_subtotal=_money(nightly_subtotal),
        price=price,
        deposit=_deposit(price, lodging.deposit_percent),
        nights=night_lines,
        adjustments=adjustments,
        warnings=warnings,
    )


def compute_quote(
    *,
    lodgings: Iterable,
    begin_date: date,
    end_date: date,
    booking_date: Optional[date] = None,
    is_flat_rate: bool = False,
    flat_price=None,
    apply_adjustments: bool = True,
) -> Quote:
    """Compute a :class:`Quote` for a stay in one or more lodgings.

    ``end_date`` is the checkout date (exclusive); the stay has
    ``(end_date - begin_date).days`` nights. ``booking_date`` defaults to today
    and is used for the last-minute / early-booking rules.
    """
    lodgings = list(lodgings)
    booking_date = booking_date or date.today()
    night_dates = _night_dates(begin_date, end_date)
    night_count = len(night_dates)
    if night_count < 1:
        raise ValueError("A stay needs at least one night")

    flat = is_flat_rate and flat_price is not None

    quote_lodgings = []
    for index, lodging in enumerate(lodgings):
        if flat:
            # The whole booking carries one manager-entered total; attribute it to the first lodging.
            quote_lodgings.append(_quote_lodging_flat(lodging, Decimal(flat_price) if index == 0 else ZERO))
        else:
            quote_lodgings.append(
                _quote_lodging(lodging, begin_date, end_date, booking_date, night_dates, apply_adjustments)
            )

    if flat:
        total_price = _money(flat_price)
    else:
        total_price = sum((ql.price for ql in quote_lodgings), Decimal(0))
    total_deposit = sum((ql.deposit for ql in quote_lodgings), Decimal(0))
    effective_daily_rate = _money(total_price / night_count) if night_count else ZERO

    warnings = []
    for ql in quote_lodgings:
        warnings.extend(ql.warnings)

    return Quote(
        begin_date=begin_date,
        end_date=end_date,
        nights=night_count,
        booking_date=booking_date,
        total_price=_money(total_price),
        total_deposit=_money(total_deposit),
        effective_daily_rate=effective_daily_rate,
        is_flat_rate=is_flat_rate,
        lodgings=quote_lodgings,
        warnings=warnings,
    )
