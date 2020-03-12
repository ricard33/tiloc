"""location URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls import include, url
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from django.views.static import serve
from rest_framework import routers

from core import views
from location.serve_static_file import serve_static_file

router = routers.DefaultRouter()
router.register(r'booking', views.BookingViewSet)

urlpatterns = [
    path('api/', include((router.urls, 'drf'), namespace='api')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('admin/', admin.site.urls),
    path('grappelli/', include('grappelli.urls')),  # grappelli URLS
    path("", include("authentication.urls")),
    path("app/", include("app.urls")),
    # path('', include('frontend.urls')),
    url(r'^', TemplateView.as_view(template_name="index.html")),
]

# if settings.ENV == 'dev':
#     # to use index.html
#     urlpatterns.append(
#         url(r'^$', ensure_csrf_cookie(never_cache(serve_static_file)),
#             kwargs={'document_path': os.path.join(settings.BASE_DIR, 'frontend', '.tmp', 'index.html')})
#     )
#
#     # for all others static files
#     urlpatterns.extend(map(lambda x, y: url('^%s(?P<path>.+)$' % x, never_cache(serve),
#                                             kwargs={'document_root': os.path.join(settings.BASE_DIR, 'frontend', y),
#                                                     'show_indexes': False}), *zip(*[
#         ('node_modules', 'node_modules'),
#         ('.tmp', '.tmp'),
#         ('css', '.tmp'),        # for pdf templates
#         ('img', 'img'),
#         ('js', 'js'),
#         ('locales', './static/locales'),
#         ('fonts', './static/fonts'),
#         ('', 'app'),
#     ])))
# else:
#     FRONT_ROOT = os.path.join(settings.BASE_DIR, 'frontend', 'static')
#     urlpatterns.extend([
#         # to use index.html
#         url(r'^$', ensure_csrf_cookie(never_cache(serve_static_file)),
#             kwargs={'document_path': os.path.join(FRONT_ROOT, 'index.html')}),
#         # for all others static files
#         url(r'^(?P<path>.+)$', never_cache(serve),
#             kwargs={'document_root': FRONT_ROOT, 'show_indexes': False}),
#     ])
