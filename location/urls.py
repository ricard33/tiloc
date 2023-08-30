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
from django.conf.urls import include
from django.conf.urls.static import static
from django.urls import path, re_path
from django.views.decorators.cache import never_cache
from rest_framework import routers

from core import admin, api, views
from location.serve_static_file import serve_static_file

router = routers.DefaultRouter()
router.register(r"account", api.AccountViewSet, "account")
router.register(r"booking", api.BookingViewSet, "booking")
router.register(r"booking_status", api.BookingStatusViewSet, "booking_status")
router.register(r"booking_channel", api.BookingChannelViewSet, "booking_channel")
router.register(r"booking_channel_sync", api.BookingChannelSyncViewSet, "booking_channel_sync")
router.register(r"service", api.ServiceViewSet, "service")
router.register(r"lodging", api.LodgingViewSet, "lodging")
router.register(r"property", api.PropertyViewSet, "property")
router.register(r"holidays", api.HolidaysViewSet, "holidays")
router.register(r"pricing", api.PricingViewSet, "pricing")
router.register(r"seasonal_variation", api.SeasonalVariationViewSet, "seasonal_variation")
router.register(r"contract_template", api.ContractTemplateViewSet, "contract_template")
router.register(r"contract", api.ContractViewSet, "contract")
router.register(r"payment", api.PaymentViewSet, "payment")
router.register(r"comment", api.CommentViewSet, "comment")
router.register(r"user", api.UserViewSet, "user")

urlpatterns = [
    path("api/", include((router.urls, "drf"), namespace="api")),
    re_path(r"^api/info/", api.version_view, name="version"),
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    # re_path("^api/auth/register/$", api.RegistrationAPI.as_view()),
    re_path("^api/auth/login/$", api.LoginAPI.as_view()),
    re_path("^api/auth/logout/$", api.LogoutAPI.as_view()),
    re_path("^api/auth/user/$", api.CurrentUserAPI.as_view()),
    re_path(r"^api/auth/", include("knox.urls")),

    re_path(r'^api/my-account/$', api.CurrentAccountViewSet.as_view(), name='my-account'),

    path(r"calendar/<uuid:uid>/", views.export_calendar, name="calendar_sync"),
    path(r"calendar/<uuid:uid>.ics", views.export_calendar, name="calendar_sync"),
    # path(r'full_planning/', views.export_full_planning),
    # path(r'full_planning/<int:property_id>/', views.export_full_planning),
    # path(r'full_planning/fbf830a8-7e47-43c6-9f25-d1734d1fc07d/', views.export_full_planning),
    path(r"stats/filling_rate/", views.filling_rate),
    path(r"stats/filling_rate/<str:begin>/<str:end>/", views.filling_rate),
    path(r"stats/channel_distribution/", views.channel_distribution),
    path(r"stats/channel_distribution/<str:begin>/<str:end>/", views.channel_distribution),
    path("admin/", admin.site.urls),
    # path('', include('frontend.urls')),
    # re_path(r'^', IndexPage.as_view(template_name="index.html")),
    re_path("loggly/(?P<path>.*)", views.loggly_proxy),
]

if settings.ENV == "dev":
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # patch for static files from React (They are broken due to use of django dev server instead of Webpack one)
    public_path = os.path.join(settings.BASE_DIR, "frontend", "public")
    for root, dirs, files in os.walk(public_path, topdown=True):
        for name in files:
            fullpath = os.path.join(root, name)
            relative_path = os.path.relpath(fullpath, public_path)
            # print(relative_path)
            urlpatterns.insert(
                -1, re_path(relative_path, never_cache(serve_static_file), kwargs={"document_path": fullpath})
            )

urlpatterns.append(re_path(r"^", never_cache(serve_static_file),
                           kwargs={"document_path": os.path.join(settings.STATIC_ROOT, "index.html")},
                           name="home"))
