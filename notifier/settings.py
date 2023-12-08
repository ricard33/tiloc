###############################################################################
## Imports
###############################################################################
# Python
from importlib import import_module

from django.conf import settings

# Django
from django.core.exceptions import ImproperlyConfigured

###############################################################################
## App Settings
###############################################################################
BACKENDS = getattr(
    settings,
    'NOTIFIER_BACKENDS',
    ('notifier.backends.EmailBackend',)
)

BACKEND_CLASSES = [getattr(import_module(mod), cls) for (mod, cls) in (backend.rsplit(".", 1) for backend in BACKENDS)]
