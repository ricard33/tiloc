import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Max
from rest_framework import serializers

from core import models
from core.models import Account, Lodging

logger = logging.getLogger(__name__)

User = get_user_model()


class AccountSerializer(serializers.ModelSerializer):
    is_initialized = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "is_active",
            "is_initialized",
            "invoice_label",
            "deposit_label",
        ]

    def get_is_initialized(self, account):
        return account.lodging_set.count() > 0


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data["email"], None, validated_data["password"])
        return user


class LoginUserSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    # def validate(self, data):
    #     user = authenticate(**data)
    #     if user and user.is_active:
    #         return user
    #     raise serializers.ValidationError("Unable to log in with provided credentials.")


class SignUpSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    password = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    account = AccountSerializer(read_only=True)
    logo = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)
    signature = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)
    permissions = serializers.SerializerMethodField(read_only=True)
    groups = serializers.SlugRelatedField(many=True, queryset=Group.objects.all(), slug_field="name")
    lodgings = serializers.SlugRelatedField(
        many=True, queryset=Lodging.objects.all(), slug_field="name", required=False
    )

    class Meta:
        model = User
        # fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'is_active')
        read_only_fields = ("id", "first_name", "verified")
        exclude = ["user_permissions", "is_superuser", "is_staff"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        # Need to call create() function to hash the password
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        lodgings = validated_data.pop("lodgings", [])
        groups = validated_data.pop("groups", [])
        instance = User.objects.create_user(email, password, **validated_data)
        if groups:
            instance.groups.set(Group.objects.filter(name__in=groups))
        if lodgings:
            # instance.lodgings.set(lodgings)
            instance.lodgings.set(Lodging.objects.filter(account=instance.account, name__in=lodgings))
        return instance

    def update(self, instance, validated_data):
        password = None
        if "password" in validated_data:
            password = validated_data.pop("password")
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def get_full_name(self, user):
        return user.get_full_name()

    def get_permissions(self, user):
        return user.get_all_permissions()

    # def validate_lodgings(self, value):
    #     if not value:
    #         return []
    #     account = self.context["request"].user.account
    #     lodgings = []
    #     values = isinstance(value, list) and value or value.split(",")
    #     for name in values:
    #         lodging = models.Lodging.objects.get(account=account, name=name+"test")
    #         # raise serializers.ValidationError("Blog post is not about Django")
    #         lodgings.append(lodging)
    #     return lodgings


class UserSubSerializer(UserSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email"]


class LodgingSerializer(serializers.ModelSerializer):
    owner = UserSubSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source="owner", queryset=models.User.objects.all())
    rank = serializers.IntegerField(required=False)

    class Meta:
        model = models.Lodging
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        rank = validated_data.pop("rank", -1)
        if rank < 0:
            rank = (models.Lodging.objects.aggregate(Max("rank"))["rank__max"] or 0) + 1
        validated_data["rank"] = rank
        instance = super().create(validated_data)
        return instance


class LodgingSubSerializer(serializers.ModelSerializer):
    owner = UserSubSerializer(read_only=True)

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
        exclude = ["account"]

    def create(self, validated_data: dict):
        validated_data["account"] = self.context["request"].user.account
        rank = validated_data.pop("rank", -1)
        if rank < 0:
            rank = (models.BookingStatus.objects.aggregate(Max("rank"))["rank__max"] or 0) + 1
        validated_data["rank"] = rank
        instance = super().create(validated_data)
        return instance


class BookingChannelSerializer(serializers.ModelSerializer):
    default_booking_status = BookingStatusSerializer(read_only=True)
    default_booking_status_id = serializers.PrimaryKeyRelatedField(
        source="default_booking_status", queryset=models.BookingStatus.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = models.BookingChannel
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance


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
        return obj.url_for_remote(self.context["request"])


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        exclude = ["account"]

    def create(self, validated_data: dict):
        validated_data["account"] = self.context["request"].user.account
        return super().create(validated_data)


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


class BookingSubSerializer(serializers.ModelSerializer):
    status = BookingStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(source="status", queryset=models.BookingStatus.objects.all())
    lodging = LodgingSubSerializer(read_only=True)
    lodging_id = serializers.PrimaryKeyRelatedField(source="lodging", queryset=models.Lodging.objects.all())
    source = BookingChannelSerializer(read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(
        source="source", queryset=models.BookingChannel.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = models.Booking
        fields = [
            "id",
            "status",
            "status_id",
            "lodging",
            "lodging_id",
            "guest_name",
            "source",
            "source_id",
            "begin_date",
            "end_date",
            "duration",
            "price",
            "deposit",
            "guaranty",
            "commission_fees",
            "commission_fees",
            "cancelled",
            "deleted",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingSubSerializer(read_only=True)
    booking_id = serializers.PrimaryKeyRelatedField(source="booking", queryset=models.Booking.objects.all())

    class Meta:
        model = models.Payment
        fields = "__all__"


class PaymentSubSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Payment
        exclude = ["booking"]


class CommentSerializer(serializers.ModelSerializer):
    booking_id = serializers.PrimaryKeyRelatedField(source="booking", queryset=models.Booking.objects.all())
    created_by = UserSubSerializer(default=serializers.CurrentUserDefault(), read_only=True)

    class Meta:
        model = models.Comment
        exclude = ["booking"]


class CommentSubSerializer(serializers.ModelSerializer):
    created_by = UserSubSerializer()

    class Meta:
        model = models.Comment
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
    comments = CommentSubSerializer(many=True, read_only=True)
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
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance


class PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Pricing
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance


class SeasonalVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SeasonalVariation
        fields = "__all__"


class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ContractTemplate
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance


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
