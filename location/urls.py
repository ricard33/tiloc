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

from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin
from django.urls import path
from django.views.decorators.cache import never_cache
from rest_framework import routers

from core import views
from core.views import IndexPage
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
    url(r'^', IndexPage.as_view(template_name="index.html")),
]

if settings.ENV == 'dev':
    # patch for static files from React (They are broken due to use of django dev server instead of Webpack one)
    public_path = os.path.join(settings.BASE_DIR, 'frontend', 'public')
    for root, dirs, files in os.walk(public_path, topdown=True):
        for name in files:
            fullpath = os.path.join(root, name)
            relative_path = os.path.relpath(fullpath, public_path)
            print(relative_path)
            urlpatterns.insert(-1, url(relative_path, never_cache(serve_static_file),
                                       kwargs={'document_path': fullpath}))
