from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.fields import empty

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


class LodgingSubSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Lodging
        fields = ['id', 'uid', 'active', 'shown', 'name', 'owner', 'rank', 'daily_rate', 'guaranty', 'cleaning_fee',
                  'capacity', 'information', 'tourist_tax']


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


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = '__all__'


class BookedServiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='service.id')
    reference = serializers.ReadOnlyField(source='service.reference')
    designation = serializers.ReadOnlyField(source='service.designation')
    unit_price_ht = serializers.ReadOnlyField(source='service.unit_price_ht')
    vat = serializers.ReadOnlyField(source='service.vat')
    is_flat_rate = serializers.ReadOnlyField(source='service.is_flat_rate')
    included_in_booking = serializers.ReadOnlyField(source='service.included_in_booking')
    not_included_in_price = serializers.ReadOnlyField(source='service.not_included_in_price')

    class Meta:
        model = models.BookedService
        fields = ('id', 'reference', 'designation', 'unit_price_ht', 'vat',
                  'included_in_booking', 'not_included_in_price', 'is_flat_rate', 'quantity')


class BookingSerializer(serializers.ModelSerializer):
    status = BookingStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(source='status', queryset=models.BookingStatus.objects.all())
    lodging = LodgingSubSerializer(read_only=True)
    lodging_id = serializers.PrimaryKeyRelatedField(source='lodging', queryset=models.Lodging.objects.all(),
                                                    allow_null=True)
    source = BookingChannelSerializer(read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(source='source', queryset=models.BookingChannel.objects.all(),
                                                   required=False, allow_null=True)
    options = BookedServiceSerializer(source='bookedservice_set', many=True, required=False)

    class Meta:
        model = models.Booking
        fields = '__all__'

    def create(self, validated_data: dict):
        options = validated_data.pop('bookedservice_set', [])
        instance = super().create(validated_data)
        for option in options:
            models.BookedService.objects.create(service_id=option['service']['id'], booking_id=instance.id, quantity=option['quantity'])
        return instance

    def update(self, instance, validated_data):
        options = validated_data.pop('bookedservice_set', [])
        instance = super().update(instance, validated_data)
        existing_service_ids = instance.options.all().values_list('id', flat=True)
        all_service_ids = []
        for option in options:
            service_id = option['service']['id']
            all_service_ids.append(service_id)
            if service_id in existing_service_ids:
                booked_option = instance.bookedservice_set.get(service__id=service_id)
                booked_option.quantity = option['quantity']
                booked_option.save(update_fields=('quantity',))
            else:
                models.BookedService.objects.create(service_id=service_id, booking_id=instance.id, quantity=option['quantity'])
        to_remove_service_ids = instance.options.exclude(id__in=all_service_ids).values_list('id', flat=True)
        instance.options.remove(*to_remove_service_ids)
        return instance


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


class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ContractTemplate
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Contract
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Payment
        fields = '__all__'
