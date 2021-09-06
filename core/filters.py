import logging

import arrow
import django_filters
from django_filters import rest_framework as filters

from core.models import Booking

logger = logging.getLogger("core.filters")


class BookingFilter(filters.FilterSet):
    for_dates = django_filters.CharFilter(method='for_dates_filter')

    class Meta:
        model = Booking
        fields = {
            'id':         ['exact'],
            'lodging':    ['exact'],
            'begin_date': ['lte', 'gte'],
            'end_date':   ['lte', 'gte'],
        }

    def for_dates_filter(self, queryset, name, value):
        """Filter all bookings between 2 dates.
        Value should be like this: Begin:End, with Begin and End as ISO formatted dates"""
        try:
            begin, end = value.split(':', 1)
            begin = arrow.get(begin)
            end = arrow.get(end)
            return queryset.filter(begin_date__lte=end.date(),
                                   end_date__gte=begin.date())
        except:
            logger.warning("Badly formatted filter 'for_dates' for 'booking' request: %s", value)
