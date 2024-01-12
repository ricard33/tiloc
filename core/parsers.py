import json
import logging

from django.conf import settings
from django.http.multipartparser import MultiPartParser as DjangoMultiPartParser
from django.http.multipartparser import MultiPartParserError
from rest_framework.exceptions import ParseError
from rest_framework.parsers import BaseParser, DataAndFiles


class MultiPartJSONParser(BaseParser):
    """Special parser to handle multipart POST with nested related objects"""
    media_type = "multipart/form-data"

    def parse(self, stream, media_type=None, parser_context=None):
        parser_context = parser_context or {}
        request = parser_context["request"]
        encoding = parser_context.get("encoding", settings.DEFAULT_CHARSET)
        meta = request.META.copy()
        meta["CONTENT_TYPE"] = media_type
        upload_handlers = request.upload_handlers

        try:
            parser = DjangoMultiPartParser(meta, stream, upload_handlers, encoding)
            data, files = parser.parse()
            data = data.copy()
            for key in data:
                values = data.getlist(key)
                new_values = []
                for value in values:
                    try:
                        value = json.loads(value)
                        if isinstance(value, list) and len(values) == 1:
                            new_values = value
                        else:
                            new_values.append(value)
                    except ValueError:
                        new_values.append(value)
                        pass
                    except Exception:
                        logging.getLogger("parsers").exception("Error in JSON decoding")
                        new_values.append(value)
                data.setlist(key, new_values)

            return DataAndFiles(data, files)
        except MultiPartParserError as exc:
            raise ParseError("Multipart form parse error - %s" % exc)
