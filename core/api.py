from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response

from knox.models import AuthToken

from .models import Booking
from .serializers import CreateUserSerializer, UserSerializer, BookingSerializer, LoginUserSerializer


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
    queryset = Booking.objects.all().order_by('-begin_date')
    serializer_class = BookingSerializer
