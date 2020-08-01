from django.contrib.auth import get_user_model
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
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'is_active')

    def get_full_name(self, user):
        return user.get_full_name()


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


class BookingChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BookingChannel
        fields = '__all__'


class BookingChannelSyncSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BookingChannelSync
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    status = BookingStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(source='status', queryset=models.BookingStatus.objects.all())
    lodging = LodgingSerializer(read_only=True)
    lodging_id = serializers.PrimaryKeyRelatedField(source='lodging', queryset=models.Lodging.objects.all(),
                                                    allow_null=True)
    source = BookingChannelSerializer(read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(source='source', queryset=models.BookingChannel.objects.all(),
                                                   required=False, allow_null=True)

    class Meta:
        model = models.Booking
        fields = '__all__'


class HolidaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Holidays
        fields = '__all__'


class PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Pricing
        fields = '__all__'


class SeasonalVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SeasonalVariation
        fields = '__all__'
