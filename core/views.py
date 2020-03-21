from django.http import Http404
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from rest_framework import viewsets

from core.models import Booking
from core.serializers import BookingSerializer


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get('HTTP_ACCEPT')

        if 'text/html' not in accept:
            raise Http404(_('"%(path)s" does not exist') % {'path': request.path})
        return super().get(request, *args, **kwargs)


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows bookings to be viewed or edited.
    """
    queryset = Booking.objects.all().order_by('-begin_date')
    serializer_class = BookingSerializer
