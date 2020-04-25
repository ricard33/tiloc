from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from core import models

User = get_user_model()


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data['username'],
                                        None,
                                        validated_data['password'])
        return user


class LoginUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    # def validate(self, data):
    #     user = authenticate(**data)
    #     if user and user.is_active:
    #         return user
    #     raise serializers.ValidationError("Unable to log in with provided credentials.")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')


class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Owner
        fields = '__all__'


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

