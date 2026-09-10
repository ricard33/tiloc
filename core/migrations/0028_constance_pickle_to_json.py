"""Rewrite constance values that were stored as base64 pickle (django-constance 3 +
django-picklefield) into the JSON format django-constance 4 expects.

constance 4 ships `0002_migrate_from_old_table` which only *moves* the rows
(`constance_config` -> `constance_constance`) keeping the pickled payload, so the
first `config.<key>` read after the upgrade blows up with a JSONDecodeError. This
converts each row in place; rows it can't decode are dropped (constance then falls
back to the CONSTANCE_CONFIG default -- the deploy runbook says to re-check
`CAN_SIGNUP` afterwards).

Only meaningful on the servers; the test DB never has pickled rows.
"""

import base64
import logging
import pickle

from django.db import migrations

logger = logging.getLogger(__name__)


def pickle_to_json(apps, schema_editor):
    from constance.codecs import dumps, loads

    Constance = apps.get_model("constance", "Constance")
    for row in Constance.objects.all():
        raw = row.value
        try:
            loads(raw)  # already JSON -> nothing to do
            continue
        except Exception:
            pass
        try:
            value = pickle.loads(base64.b64decode(raw))  # noqa: S301 - our own historical data
        except Exception:
            logger.warning("constance: dropping undecodable value for key %r", row.key)
            row.delete()
            continue
        row.value = dumps(value)
        row.save(update_fields=["value"])
        logger.info("constance: migrated key %r from pickle to JSON", row.key)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0027_booking_is_flat_rate_tourist_tax_and_more"),
        ("constance", "0003_drop_pickle"),
    ]

    operations = [
        migrations.RunPython(pickle_to_json, reverse_code=migrations.RunPython.noop),
    ]
