from django.contrib.auth import authenticate
from django.db import transaction
from knox.models import AuthToken
from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response

from . import models
from .serializers import (BookingChannelSerializer, BookingChannelSyncSerializer, BookingSerializer,
                          BookingStatusSerializer, CreateUserSerializer, HolidaysSerializer, LodgingSerializer,
                          LoginUserSerializer, OwnerSerializer, PricingSerializer, SeasonalVariationSerializer,
                          UserSerializer)


class RegistrationAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CreateUserSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        auth_token, token = AuthToken.objects.create(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token
        })


class LoginAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(**serializer.validated_data)
        if not user or not user.is_active:
            raise AuthenticationFailed()
        auth_token, token = AuthToken.objects.create(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token
        })


class UserAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows bookings to be viewed or edited.
    """
    queryset = models.Booking.objects.all().order_by('-begin_date')
    serializer_class = BookingSerializer


class BookingStatusViewSet(viewsets.ModelViewSet):
    queryset = models.BookingStatus.objects.all()
    serializer_class = BookingStatusSerializer


class BookingChannelViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannel.objects.all()
    serializer_class = BookingChannelSerializer


class BookingChannelSyncViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannelSync.objects.all()
    serializer_class = BookingChannelSyncSerializer


class LodgingViewSet(viewsets.ModelViewSet):
    queryset = models.Lodging.objects.all().order_by('name')
    serializer_class = LodgingSerializer


class OwnerViewSet(viewsets.ModelViewSet):
    queryset = models.Owner.objects.all().order_by('name')
    serializer_class = OwnerSerializer


class HolidaysViewSet(viewsets.ModelViewSet):
    queryset = models.Holidays.objects.all().order_by('begin_date')
    serializer_class = HolidaysSerializer


class PricingViewSet(viewsets.ModelViewSet):
    queryset = models.Pricing.objects.all().order_by('name')
    serializer_class = PricingSerializer


class SeasonalVariationViewSet(viewsets.ModelViewSet):
    queryset = models.SeasonalVariation.objects.all().order_by('begin_date')
    serializer_class = SeasonalVariationSerializer
