import logging

import json_log_formatter


class CustomisedJSONFormatter(json_log_formatter.JSONFormatter):
    def json_record(self, message: str, extra: dict, record: logging.LogRecord) -> dict:

        # Include builtins
        extra["level"] = record.levelname
        extra["name"] = record.name
        extra["filename"] = record.filename
        extra["lineno"] = record.lineno
        extra["funcName"] = record.funcName

        # remove unwanted fields
        if "request" in extra:
            del extra["request"]

        return super().json_record(message, extra, record)
