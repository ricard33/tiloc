from django.conf import settings as django_settings


def settings(context):
    return {'settings': django_settings}
