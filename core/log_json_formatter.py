import logging

import json_log_formatter

# Keys that django-request-logging attaches to every ``django.request`` record via
# ``extra``. They hold the live request/response objects, which must never reach the
# JSON serializer: walking them pulls in lazy QuerySets that get evaluated (hitting the
# DB) while the request is still being processed, which can deadlock the response.
_DROP_KEYS = ("request", "response")


class CustomisedJSONFormatter(json_log_formatter.JSONFormatter):
    def json_record(self, message: str, extra: dict, record: logging.LogRecord) -> dict:

        # Include builtins
        extra["level"] = record.levelname
        extra["name"] = record.name
        extra["filename"] = record.filename
        extra["lineno"] = record.lineno
        extra["funcName"] = record.funcName

        # remove unwanted fields
        for key in _DROP_KEYS:
            extra.pop(key, None)

        return super().json_record(message, extra, record)
