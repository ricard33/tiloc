# -*- encoding: utf-8 -*-

from django.urls import path, re_path

from app import views

urlpatterns = [
    # Matches any html file - to be used for gentella
    # Avoid using your .html in your resources.
    # Or create a separate django app.
    re_path(r'^.*\.html', views.pages, name='pages'),

    # The home page
    path('', views.index, name='home'),
    path('planning/', views.todo, name='planning'),
    path('message/', views.todo, name='messages'),
    path('booking/', views.BookingList.as_view(), name='bookings'),
    # path('booking/<int:pk>/', views.BookingDetail.as_view(), name='booking-detail'),
    path('booking/add/', views.BookingCreate.as_view(), name='booking-add'),
    path('booking/<int:pk>/', views.BookingUpdate.as_view(), name='booking-update'),
    path('booking/<int:pk>/delete/', views.BookingDelete.as_view(), name='booking-delete'),

    path('price/', views.todo, name='prices'),
    path('contact/', views.todo, name='contacts'),
]
