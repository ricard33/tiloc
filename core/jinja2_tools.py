import jinja2
from babel.dates import format_date
from babel.numbers import format_decimal
from django.conf import settings
from django.utils import translation


def render_template(template, context):
    with translation.override('fr'):
        # jinja2 template
        template_env = jinja2.Environment()
        template_env.filters['format_date'] = my_format_date
        template_env.filters['format_decimal'] = my_format_decimal
        template = template_env.from_string(template)
    return template.render(context)


def my_format_decimal(value, format=None, locale=settings.LANGUAGE_CODE):
    return format_decimal(value or 0, format=format, locale=locale)


def my_format_date(value, format='medium', locale=settings.LANGUAGE_CODE):
    if value:
        return format_date(value, format, locale=locale)
    return "......../......../................"
