# -*- encoding: utf-8 -*-

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import generic

from app import forms
from core import models


@login_required(login_url="/login/")
def index(request):
    return render(request, "ui/index.html")


def todo(request):
    return render(request, "ui/pages/page-blank.html")


@login_required(login_url="/login/")
def pages(request):
    context = {}
    # All resource paths end in .html.
    # Pick out the html file name from the url. And load that template.
    try:
        load_template = request.path.split('/')[-1]
        template = loader.get_template('ui/pages/' + load_template)
        return HttpResponse(template.render(context, request))

    except:
        template = loader.get_template('ui/pages/error-404.html')
        return HttpResponse(template.render(context, request))


@method_decorator(login_required, name='dispatch')
class BookingList(generic.ListView):
    template_name = 'ui/core/booking_list.html'
    context_object_name = 'bookings'

    def get_queryset(self):
        """Return the bookings."""
        return models.Booking.objects.all()


@method_decorator(login_required, name='dispatch')
class BookingDetail(generic.DetailView):
    template_name = 'ui/core/booking_form.html'
    context_object_name = 'booking'
    queryset = models.Booking.objects.all()


class BookingCreate(generic.CreateView):
    template_name = 'ui/core/booking_form.html'
    model = models.Booking
    form_class = forms.BookingForm
    # fields = ['status', 'lodging', 'guest_name', 'guest_contact', 'guest_address', ]


class BookingUpdate(generic.UpdateView):
    template_name = 'ui/core/booking_form.html'
    model = models.Booking
    form_class = forms.BookingForm
    # fields = ['status', 'lodging', 'guest_name', 'guest_contact', 'guest_address', ]


class BookingDelete(generic.DeleteView):
    model = models.Booking
    success_url = reverse_lazy('booking-list')
