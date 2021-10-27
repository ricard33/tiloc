"""
WSGI config for location project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os

import newrelic.agent
from django.core.wsgi import get_wsgi_application
from smartconfigparser import Config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'location.settings')


config = Config()
config.read(os.path.join(os.path.dirname(__file__), '..', 'config', 'config.ini'))
if config.getboolean('NEWRELIC', 'ENABLED', True):
    newrelic.agent.initialize(os.path.join(os.path.dirname(__file__), '..', 'config', 'newrelic.ini'))
application = get_wsgi_application()
