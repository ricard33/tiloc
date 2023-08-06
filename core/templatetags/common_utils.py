from django import template
from django.contrib import admin

from core import models

register = template.Library()


class CustomRequest:
    def __init__(self, user):
        self.user = user


@register.simple_tag(takes_context=True)
def get_app_list(context, **kwargs):
    custom_request = CustomRequest(context["request"].user)
    app_list = admin.site.get_app_list(custom_request)
    return app_list


@register.simple_tag(takes_context=True)
def get_accounts_list(context, **kwargs):
    account_list = models.Account.objects.filter(is_active=True)
    return account_list
