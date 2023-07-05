import logging

from django.contrib.auth import get_user_model
from django.db.models import Max
from rest_framework import serializers

from core import models

logger = logging.getLogger(__name__)

User = get_user_model()


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data["username"], None, validated_data["password"])
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
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        # fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'is_active')
        fields = "__all__"

    def get_full_name(self, user):
        return user.get_full_name()

    def get_permissions(self, user):
        return user.get_all_permissions()


class OwnerSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)
    signature = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)

    class Meta:
        model = models.Owner
        fields = "__all__"


class OwnerSubSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Owner
        fields = [
            "id",
            "name",
        ]


class LodgingSerializer(serializers.ModelSerializer):
    owner = OwnerSubSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source="owner", queryset=models.Owner.objects.all())
    rank = serializers.IntegerField(required=False)

    class Meta:
        model = models.Lodging
        fields = "__all__"

    def create(self, validated_data: dict):
        rank = validated_data.pop("rank", -1)
        if rank < 0:
            rank = (models.Lodging.objects.aggregate(Max("rank"))["rank__max"] or 0) + 1
        validated_data["rank"] = rank
        instance = super().create(validated_data)
        return instance


class LodgingSubSerializer(serializers.ModelSerializer):
    owner = OwnerSubSerializer(read_only=True)

    class Meta:
        model = models.Lodging
        fields = [
            "id",
            "uid",
            "active",
            "shown",
            "name",
            "owner_id",
            "owner",
            "rank",
            "daily_rate",
            "guaranty",
            "capacity",
            "information",
            "tourist_tax",
        ]


class BookingStatusSerializer(serializers.ModelSerializer):
    rank = serializers.IntegerField(required=False)

    class Meta:
        model = models.BookingStatus
        fields = "__all__"

    def create(self, validated_data: dict):
        rank = validated_data.pop("rank", -1)
        if rank < 0:
            rank = (models.BookingStatus.objects.aggregate(Max("rank"))["rank__max"] or 0) + 1
        validated_data["rank"] = rank
        instance = super().create(validated_data)
        return instance


class BookingChannelSerializer(serializers.ModelSerializer):
    default_booking_status = BookingStatusSerializer(read_only=True)
    default_booking_status_id = serializers.PrimaryKeyRelatedField(
        source="default_booking_status", queryset=models.BookingStatus.objects.all(),
        required=False, allow_null=True
    )

    class Meta:
        model = models.BookingChannel
        fields = "__all__"


class BookingChannelSyncSerializer(serializers.ModelSerializer):
    channel = BookingChannelSerializer(read_only=True)
    channel_id = serializers.PrimaryKeyRelatedField(source="channel", queryset=models.BookingChannel.objects.all())
    lodging = LodgingSubSerializer(read_only=True)
    lodging_id = serializers.PrimaryKeyRelatedField(source="lodging", queryset=models.Lodging.objects.all())
    url_for_remote = serializers.SerializerMethodField()

    class Meta:
        model = models.BookingChannelSync
        fields = [
            "id",
            "channel_id",
            "channel",
            "lodging_id",
            "lodging",
            "source_url",
            "url_for_remote",
            "active",
            "last_import",
            "last_export",
            "last_import_error",
        ]
        read_only_fields = [
            "id",
            "channel",
            "lodging",
            "url_for_remote",
            "last_import",
            "last_export",
            "last_import_error",
        ]

    def get_url_for_remote(self, obj: models.BookingChannelSync):
        return obj.url_for_remote(self.context['request'])


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = "__all__"


class BookedServiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="service.id")
    reference = serializers.ReadOnlyField(source="service.reference")
    designation = serializers.ReadOnlyField(source="service.designation")
    vat = serializers.ReadOnlyField(source="service.vat")
    # included_in_booking = serializers.ReadOnlyField(source="service.included_in_booking")
    not_included_in_price = serializers.ReadOnlyField(source="service.not_included_in_price")

    class Meta:
        model = models.BookedService
        fields = (
            "id",
            "reference",
            "designation",
            "unit_price",
            "vat",
            # "included_in_booking",
            "not_included_in_price",
            "is_flat_rate",
        )


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Payment
        fields = "__all__"


class PaymentSubSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Payment
        exclude = ["booking"]


class BookingSerializer(serializers.ModelSerializer):
    status = BookingStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(source="status", queryset=models.BookingStatus.objects.all())
    lodging = LodgingSubSerializer(read_only=True)
    lodging_id = serializers.PrimaryKeyRelatedField(source="lodging", queryset=models.Lodging.objects.all())
    source = BookingChannelSerializer(read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(
        source="source", queryset=models.BookingChannel.objects.all(), required=False, allow_null=True
    )
    options = BookedServiceSerializer(source="bookedservice_set", many=True, required=False)
    payments = PaymentSubSerializer(source="payment_set", many=True, required=False, read_only=True)
    total_payments = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    left_to_pay = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_with_options = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = models.Booking
        fields = "__all__"

    def create(self, validated_data: dict):
        options = validated_data.pop("bookedservice_set", [])
        instance = super().create(validated_data)
        for option in options:
            models.BookedService.objects.create(
                service_id=option["service"]["id"],
                booking_id=instance.id,
                unit_price=option["unit_price"],
                is_flat_rate=option["is_flat_rate"],
            )
        return instance

    def update(self, instance, validated_data):
        options = validated_data.pop("bookedservice_set", [])
        instance = super().update(instance, validated_data)
        existing_service_ids = instance.options.all().values_list("id", flat=True)
        all_service_ids = []
        for option in options:
            service_id = option["service"]["id"]
            all_service_ids.append(service_id)
            if service_id in existing_service_ids:
                booked_option = instance.bookedservice_set.get(service__id=service_id)
                booked_option.unit_price = option["unit_price"]
                booked_option.is_flat_rate = option["is_flat_rate"]
                booked_option.save(update_fields=("unit_price", "is_flat_rate"))
            else:
                models.BookedService.objects.create(
                    service_id=service_id,
                    booking_id=instance.id,
                    unit_price=option["unit_price"],
                    is_flat_rate=option["is_flat_rate"],
                )
        to_remove_service_ids = instance.options.exclude(id__in=all_service_ids).values_list("id", flat=True)
        instance.options.remove(*to_remove_service_ids)
        return instance


class BookingNoPriceSerializer(BookingSerializer):
    total_payments = None
    left_to_pay = None
    price_with_options = None

    class Meta:
        model = models.Booking
        exclude = ["price", "daily_rate", "is_flat_rate", "deposit", "guaranty", "commission_fees"]


class HolidaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Holidays
        fields = "__all__"


class PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Pricing
        fields = "__all__"


class SeasonalVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SeasonalVariation
        fields = "__all__"


class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ContractTemplate
        fields = "__all__"


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Contract
        fields = "__all__"


class GuestSerializer(serializers.Serializer):
    name = serializers.CharField(read_only=True)
    contact = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)


class NextEventSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    date = serializers.DateField(read_only=True)
    lodging_name = serializers.CharField(read_only=True)
    event_type = serializers.CharField(read_only=True)
    guest_name = serializers.CharField(read_only=True)
    booking_channel = serializers.CharField(read_only=True)
