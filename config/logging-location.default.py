import os
import sys

from smartconfigparser import Config

CONFIG_FOLDER = os.path.dirname(__file__)
LOG_FOLDER = os.path.normpath(os.path.join(CONFIG_FOLDER, '..', 'log'))
config = Config()
config.read(os.path.join(CONFIG_FOLDER, 'config.ini'))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(name)-12s: %(asctime)s %(levelname)-8s [%(threadName)s] %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'json': {
            '()': 'core.log_json_formatter.CustomisedJSONFormatter'
        }
    },
    #'filters': {
    #    'special': {
    #        '()': 'project.logging.SpecialFilter',
    #        'foo': 'bar',
    #    },
    #},
    'handlers': {
        'console': {
            'level': 'NOTSET',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': sys.stdout,
        },
        'file': {
            'level': 'NOTSET',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'verbose',
            'filename': os.path.join(LOG_FOLDER, 'location.log'),
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 10,
        },
        'loggly': {
            'class': 'loggly.handlers.HTTPSHandler',
            'level': 'INFO',
            'formatter': 'json',
            'url': 'https://logs-01.loggly.com/inputs/%(key)s/tag/%(tag)s' % {
                'key': config.get('LOGGLY', 'API_KEY', ''),
                'tag': config.get('LOGGLY', 'TAG', 'python')
            }
        }


        # 'mail_admins': {
        #     'level': 'ERROR',
        #     'class': 'logging.handlers.SMTPHandler',
        #     'mailhost': 'mail.example.org',
        #     'fromaddr': 'app@tiloc.fr',
        #     'toaddrs': ['alerts@example.org',],
        #     'subject': "ALERT form Ti Loc",
        #     'credentials': ['username', 'password'],
        #     'secure': False,
        #     #'filters': ['special']
        # }
    },
    'root': {
        'handlers': ['console', 'file'] + (config.getboolean('LOGGLY', 'ACTIVE', True) and ['loggly'] or []),
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'level': 'DEBUG',
        },
        'django.db.backends': {
            'level': 'INFO',
            'propagate': True,
        },
        'django.utils.autoreload': {
            'level': 'INFO',
            'propagate': True,
        },
        'django.template': {
            'level': 'INFO',
        },
        'urllib3': {
            'level': 'INFO',
        },
        'asyncio': {
            'level': 'INFO',
        },
        'factory': {
            'level': 'INFO',
        },
        'PIL.Image': {
            'level':    'INFO',
        },
    },

}
