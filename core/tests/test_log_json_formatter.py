import json
import logging

from core.log_json_formatter import CustomisedJSONFormatter


def _record(**extra):
    record = logging.LogRecord(
        name="django.request",
        level=logging.ERROR,
        pathname=__file__,
        lineno=1,
        msg="GET /api/ - 403",
        args=(),
        exc_info=None,
    )
    for key, value in extra.items():
        setattr(record, key, value)
    return record


class _Exploding:
    """Stands in for the live request/response objects, which transitively reference
    lazy QuerySets. Any attempt to introspect or serialize this blows up -- the
    formatter must drop it untouched before handing the record to ``json.dumps``."""

    def __getattr__(self, name):
        raise AssertionError("the formatter must not introspect the request/response")

    def __iter__(self):
        raise AssertionError("the formatter must not evaluate the request/response")

    def __repr__(self):
        raise AssertionError("the formatter must not repr the request/response")


def test_request_and_response_are_dropped_before_serialization():
    formatted = CustomisedJSONFormatter().format(
        _record(request=_Exploding(), response=_Exploding(), referral_code="52d6ce")
    )

    payload = json.loads(formatted)
    assert "request" not in payload
    assert "response" not in payload
    assert payload["referral_code"] == "52d6ce"
    assert payload["name"] == "django.request"
    assert payload["level"] == "ERROR"


def test_plain_record_still_serializes():
    payload = json.loads(CustomisedJSONFormatter().format(_record()))

    assert payload["message"] == "GET /api/ - 403"
    assert payload["name"] == "django.request"
    assert "lineno" in payload and "funcName" in payload
