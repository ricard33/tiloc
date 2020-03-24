from rest_framework import serializers
from core import models


class LodgingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Lodging
        fields = '__all__'


class BookingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BookingStatus
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    status = BookingStatusSerializer()
    lodging = LodgingSerializer()

    class Meta:
        model = models.Booking
        fields = '__all__'

