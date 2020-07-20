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

from core import api, views
from core.views import IndexPage
from location.serve_static_file import serve_static_file

router = routers.DefaultRouter()
router.register(r'booking', api.BookingViewSet, 'booking')
router.register(r'booking_status', api.BookingStatusViewSet, 'booking_status')
router.register(r'booking_channel', api.BookingChannelViewSet, 'booking_channel')
router.register(r'booking_channel_sync', api.BookingChannelSyncViewSet, 'booking_channel_sync')
router.register(r'lodging', api.LodgingViewSet, 'lodging')
router.register(r'owner', api.OwnerViewSet, 'owner')
router.register(r'holidays', api.HolidaysViewSet, 'holidays')
router.register(r'pricing', api.PricingViewSet, 'pricing')
router.register(r'seasonal_variation', api.SeasonalVariationViewSet, 'seasonal_variation')

urlpatterns = [
    path('api/', include((router.urls, 'drf'), namespace='api')),
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    # url("^api/auth/register/$", api.RegistrationAPI.as_view()),
    url("^api/auth/login/$", api.LoginAPI.as_view()),
    url("^api/auth/user/$", api.UserAPI.as_view()),
    url(r'^api/auth/', include('knox.urls')),

    path(r'calendar/<uuid:uid>/', views.export_calendar, name="calendar_sync"),
    path(r'calendar/<uuid:uid>.ics', views.export_calendar, name="calendar_sync"),
    path(r'full_planning/', views.export_full_planning),
    path(r'full_planning/<int:owner_id>/', views.export_full_planning),
    path(r'stats/filling_rate/', views.filling_rate),
    path(r'stats/filling_rate/<str:begin>/<str:end>/', views.filling_rate),
    path(r'stats/channel_distribution/', views.channel_distribution),
    path(r'stats/channel_distribution/<str:begin>/<str:end>/', views.channel_distribution),

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
            # print(relative_path)
            urlpatterns.insert(-1, url(relative_path, never_cache(serve_static_file),
                                       kwargs={'document_path': fullpath}))
