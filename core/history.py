"""Build a human-readable modification history for a ``Booking``.

The data comes from ``django-simple-history`` (``Booking.history``); this module turns the raw
``HistoricalBooking`` rows into a list of entries describing, for every change, when it happened,
what changed (field by field, old -> new) and who made it.

Known limitations (django-simple-history does not track them): changes to the many-to-many
relations ``Booking.lodgings`` and ``Booking.options`` do not appear, and neither do changes to
related ``Payment`` / ``Comment`` rows.
"""
import datetime
from decimal import Decimal
from typing import Any, Iterable, Optional

# Fields that never carry meaningful "what changed" information for the end user.
_DENYLIST = {"modified", "created", "id", "account", "history_change_reason"}

# Price-related fields, hidden from users lacking the ``core.view_prices`` permission
# (mirrors ``BookingViewSet.get_serializer_class``).
PRICE_FIELDS = {
    "price",
    "daily_rate",
    "is_flat_rate",
    "deposit",
    "guaranty",
    "commission_fees",
    "custom_tourist_tax",
    "max_daily_tourist_tax",
    "tourist_tax_rate",
    "is_flat_rate_tourist_tax",
    "tourist_tax_included_in_payment",
}

_HISTORY_TYPE_LABELS = {"+": "created", "~": "changed", "-": "deleted"}


def _serialize_value(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return str(value)


def _serialize_user(user) -> Optional[dict]:
    if user is None:
        return None
    return {"id": user.id, "full_name": user.get_full_name(), "email": user.email}


def build_booking_history(records: Iterable, *, include_prices: bool) -> list[dict]:
    """Turn ``HistoricalBooking`` rows (newest first) into a list of history entries.

    Each entry has the shape::

        {
            "history_id": int,
            "date": str,                # ISO 8601
            "type": "+" | "~" | "-",
            "type_label": "created" | "changed" | "deleted",
            "user": {"id", "full_name", "email"} | None,
            "changes": [{"field": str, "old": Any, "new": Any}],
        }

    ``changes`` is empty for the creation entry. A "changed" entry whose changes are all
    filtered out (e.g. only price fields changed for a user without ``view_prices``) is omitted.
    """
    entries: list[dict] = []
    for record in records:
        changes: list[dict] = []
        previous = record.prev_record if record.history_type == "~" else None
        if previous is not None:
            delta = record.diff_against(
                previous, excluded_fields=_DENYLIST, foreign_keys_are_objs=True
            )
            visible = [c for c in delta.changes if include_prices or c.field not in PRICE_FIELDS]
            if not visible:
                # Nothing meaningful to show: an empty duplicate revision (the booking
                # serializer re-sends ``post_save``), or every changed field is a price
                # hidden from this user.
                continue
            changes = [
                {"field": c.field, "old": _serialize_value(c.old), "new": _serialize_value(c.new)}
                for c in visible
            ]

        entries.append(
            {
                "history_id": record.history_id,
                "date": record.history_date.isoformat(),
                "type": record.history_type,
                "type_label": _HISTORY_TYPE_LABELS.get(record.history_type, record.history_type),
                "user": _serialize_user(record.history_user),
                "changes": changes,
            }
        )
    return entries
