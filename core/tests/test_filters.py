import datetime

import pytest

from core.filters import BookingFilter, PaymentFilter
from core.models import Booking, Payment
from core.tests import factories

pytestmark = pytest.mark.django_db


class TestBookingForDatesFilter:
    def test_keeps_bookings_overlapping_the_range(self, default_groups):
        inside = factories.BookingFactory(
            begin_date=datetime.date(2024, 6, 10), end_date=datetime.date(2024, 6, 20)
        )
        factories.BookingFactory(begin_date=datetime.date(2024, 1, 1), end_date=datetime.date(2024, 1, 10))

        result = BookingFilter().for_dates_filter(Booking.objects.all(), "for_dates", "2024-06-15:2024-06-25")

        assert list(result) == [inside]

    def test_invalid_value_logs_a_warning_and_filters_nothing(self, default_groups, caplog):
        factories.BookingFactory()

        with caplog.at_level("WARNING"):
            result = BookingFilter().for_dates_filter(Booking.objects.all(), "for_dates", "not-a-range")

        assert result is None
        assert any("Badly formatted filter 'for_dates'" in record.message for record in caplog.records)

    def test_unparseable_dates_are_also_handled(self, default_groups, caplog):
        factories.BookingFactory()

        with caplog.at_level("WARNING"):
            result = BookingFilter().for_dates_filter(Booking.objects.all(), "for_dates", "2024-13-40:nope")

        assert result is None
        assert caplog.records


class TestPaymentForDatesFilter:
    def test_keeps_payments_inside_the_range(self, default_groups):
        inside = factories.PaymentFactory(date=datetime.date(2024, 6, 15))
        factories.PaymentFactory(date=datetime.date(2024, 1, 1))

        result = PaymentFilter().for_dates_filter(Payment.objects.all(), "for_dates", "2024-06-01:2024-06-30")

        assert list(result) == [inside]

    def test_invalid_value_logs_a_warning_and_filters_nothing(self, default_groups, caplog):
        factories.PaymentFactory()

        with caplog.at_level("WARNING"):
            result = PaymentFilter().for_dates_filter(Payment.objects.all(), "for_dates", "garbage")

        assert result is None
        assert any("Badly formatted filter 'for_dates'" in record.message for record in caplog.records)
