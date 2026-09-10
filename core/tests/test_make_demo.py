"""Tests for the advanced-pricing part of the ``make_demo`` management command."""

from decimal import Decimal

import pytest

from core import models
from core.management.commands.make_demo import Command
from core.tests import factories

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("default_groups")]


def test_setup_advanced_pricing_seeds_calendar_rates_and_rules() -> None:
    account = factories.AccountFactory.create(name="__demo__")
    lodgings = [
        factories.LodgingFactory.create(account=account, daily_rate=Decimal("100.00")),
        factories.LodgingFactory.create(account=account, daily_rate=Decimal("80.00")),
    ]

    Command()._setup_advanced_pricing(account, lodgings)

    calendar = models.SeasonCalendar.objects.get(account=account)
    assert calendar.seasons.count() == 3
    assert models.SeasonDateRange.objects.filter(season__calendar=calendar).exists()

    for lodging in lodgings:
        lodging.refresh_from_db()
        assert lodging.season_calendar_id == calendar.id
        assert lodging.weekly_discount_percent == Decimal("10")
        assert lodging.season_rates.count() == 3

    assert account.pricingadjustment_set.filter(max_days_before_arrival=15).exists()
    assert account.pricingadjustment_set.filter(min_days_before_arrival=120).exists()


def test_setup_advanced_pricing_is_idempotent() -> None:
    account = factories.AccountFactory.create(name="__demo__")
    lodging = factories.LodgingFactory.create(account=account, daily_rate=Decimal("100.00"))

    Command()._setup_advanced_pricing(account, [lodging])
    Command()._setup_advanced_pricing(account, [lodging])

    assert models.SeasonCalendar.objects.filter(account=account).count() == 1
    assert account.pricingadjustment_set.count() == 2
    assert lodging.season_rates.count() == 3
