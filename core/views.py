from rest_framework import viewsets

# Create your views here.
from core.serializers import BookingSerializer
from core.models import Booking


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Booking.objects.all().order_by('-begin_date')
    serializer_class = BookingSerializer
