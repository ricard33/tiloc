import logging

import stripe
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Max
from django.db.models.signals import post_save
from rest_framework import serializers
from timezone_field.rest_framework import TimeZoneSerializerField

from core import models
from core.models import Account, Lodging
from notifier.models import SentNotification

logger = logging.getLogger(__name__)

User = get_user_model()


class FilteredSlugRelatedField(serializers.SlugRelatedField):
    def get_queryset(self):
        user = self.context["request"].user
        queryset = self.queryset.filter(account=user.account)
        return queryset


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Plan
        fields = "__all__"


class PaymentMethodSerializer(serializers.Serializer):
    type = serializers.CharField()
    description = serializers.CharField()
    exp_month = serializers.IntegerField()
    exp_year = serializers.IntegerField()


class SubscriptionSerializer(serializers.ModelSerializer):
    default_payment_method = serializers.SerializerMethodField()
    customer_dashboard_url = serializers.CharField(read_only=True)

    class Meta:
        model = models.Subscription
        fields = "__all__"

    def get_default_payment_method(self, subscription: models.Subscription):
        if subscription.default_payment_method:
            payment_method = stripe.PaymentMethod.retrieve(subscription.default_payment_method)
            data = {"type": payment_method.type}
            if payment_method.type == "card":
                data["description"] = "%(brand)s **** **** **** %(last_digit)s" % {
                    "brand": payment_method.card.brand.upper(),
                    "last_digit": payment_method.card.last4,
                }
                data["exp_year"] = payment_method.card.exp_year
                data["exp_month"] = payment_method.card.exp_month
            else:
                logger.error("Unknown payment method type: %s", payment_method.type)
                data["description"] = "?"
            return PaymentMethodSerializer(data).data


class AccountSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="name", read_only=True)
    is_initialized = serializers.SerializerMethodField()
    current_plan = serializers.SerializerMethodField()
    current_subscription = SubscriptionSerializer()

    class Meta:
        model = Account
        fields = [
            "id",
            "is_active",
            "is_initialized",
            "current_plan",
            "current_subscription",
            "trial_is_over",
            "is_free_plan",
            "created",
            "validity",
            "invoice_label",
        ]

    def get_is_initialized(self, account):
        return account.lodging_set.count() > 0

    def get_current_plan(self, account):
        if account.trial_is_over:
            return PlanSerializer(models.Plan.objects.get(ref="FREE")).data
        return PlanSerializer(account.current_plan).data


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
    keep_connected = serializers.BooleanField(required=False)

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
    plan = serializers.CharField(required=False, allow_blank=True)
    tz = serializers.CharField(required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    signature = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)
    permissions = serializers.SerializerMethodField(read_only=True)
    groups = serializers.SlugRelatedField(many=True, queryset=Group.objects.all(), slug_field="name")
    lodgings = FilteredSlugRelatedField(many=True, queryset=Lodging.objects.all(), slug_field="name", required=False)
    tz = TimeZoneSerializerField(required=False)
    chatwoot_identifier_hash = serializers.SerializerMethodField()

    class Meta:
        model = User
        # fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'is_active')
        read_only_fields = ("id", "verified")
        exclude = ["user_permissions", "is_superuser", "is_staff", "logo"]
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

    def update(self, instance: User, validated_data: dict):
        password = None
        if "password" in validated_data:
            password = validated_data.pop("password")
        if "email" in validated_data and validated_data["email"] != instance.email:
            logger.info(
                "changing email from '%s' to '%s'. Invalidating user email.",
                instance.email,
                validated_data.get("email"),
            )
            validated_data["verified"] = False
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance

    def get_full_name(self, user):
        return user.get_full_name()

    def get_permissions(self, user):
        return user.get_all_permissions()

    def get_chatwoot_identifier_hash(self, user):
        import hashlib
        import hmac

        # Define your key and identifier
        secret = bytes("3kJewR8EYgoExYUMCEaFnhnc", "utf-8")
        identifier = bytes(str(user.id), "utf-8")

        # Generate the HMAC
        hash = hmac.new(secret, identifier, hashlib.sha256)
        identifier_hash = hash.hexdigest()
        return identifier_hash


class CurrentUserSerializer(UserSerializer):
    account = AccountSerializer(read_only=True)

    class Meta:
        model = User
        read_only_fields = ("id", "verified")
        exclude = ["user_permissions", "is_superuser", "is_staff", "logo"]
        extra_kwargs = {"password": {"write_only": True}}


class UserSubSerializer(UserSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        exclude = ["account"]

    def create(self, validated_data: dict):
        validated_data["account"] = self.context["request"].user.account
        return super().create(validated_data)


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
            "balance_due_date",
            "deposit_label",
            "deposit_percent",
            "guaranty",
            "capacity",
            "information",
            "is_flat_rate_tourist_tax",
            "tourist_tax_included_in_payment",
            "tourist_tax_rate",
            "max_daily_tourist_tax",
        ]


class BookingChannelSerializer(serializers.ModelSerializer):
    read_only = serializers.SerializerMethodField()

    class Meta:
        model = models.BookingChannel
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance

    def get_read_only(self, instance):
        return instance.account is None


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


class BookingChannelSyncSubSerializerForLodging(BookingChannelSyncSerializer):
    class Meta:
        model = models.BookingChannelSync
        fields = [
            "id",
            "channel_id",
            "channel",
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
            "url_for_remote",
            "last_import",
            "last_export",
            "last_import_error",
        ]


class LodgingSerializer(serializers.ModelSerializer):
    owner = UserSubSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source="owner", queryset=models.User.objects.all())
    rank = serializers.IntegerField(required=False)
    default_services = FilteredSlugRelatedField(
        slug_field="reference", many=True, required=False, queryset=models.Service.objects.all()
    )
    calendar_url = serializers.SerializerMethodField()
    remote_calendars = BookingChannelSyncSubSerializerForLodging(
        source="bookingchannelsync_set", many=True, required=False, read_only=True
    )

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

    def get_calendar_url(self, obj: models.Lodging):
        return obj.get_calendar_url(self.context["request"])


class BookedServiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="service.id")
    reference = serializers.ReadOnlyField(source="service.reference")
    designation = serializers.ReadOnlyField(source="service.designation")
    vat = serializers.ReadOnlyField(source="service.vat")
    not_included_in_price = serializers.ReadOnlyField(source="service.not_included_in_price")

    class Meta:
        model = models.BookedService
        fields = (
            "id",
            "reference",
            "designation",
            "unit_price",
            "vat",
            "not_included_in_price",
            "is_flat_rate",
        )


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
    lodgings = LodgingSubSerializer(read_only=True, many=True)
    lodging_ids = serializers.PrimaryKeyRelatedField(
        source="lodgings", many=True, queryset=models.Lodging.objects.all()
    )
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
    tourist_tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    computed_tourist_tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    guests = serializers.IntegerField(read_only=True)
    adults = serializers.IntegerField(read_only=True)
    children = serializers.IntegerField(read_only=True)
    babies = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Booking
        exclude = ["account"]

    def validate_lodging_ids(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("Bookings need at least one lodging")
        return value

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
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

    def get_updated_fields(self, instance, validated_data):
        updated_fields = []
        for field, value in validated_data.items():
            if value != getattr(instance, field, None):
                updated_fields.append(field)
        return updated_fields

    def update(self, instance, validated_data):
        updated_fields = self.get_updated_fields(instance, validated_data)
        options = validated_data.pop("bookedservice_set", [])
        instance = super().update(instance, validated_data)
        # Duplicate the post_send signal but with an `update_fields` parameter set
        post_save.send(instance.__class__, instance=instance, created=False, raw=False, update_fields=updated_fields)
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


class BookingSubSerializer(BookingSerializer):
    class Meta:
        model = models.Booking
        fields = [
            "id",
            "status",
            "lodgings",
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
            "tourist_tax",
            "custom_tourist_tax",
            "cancelled",
            "deleted",
            "guests",
            "adults",
            "children",
            "babies",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingSubSerializer(read_only=True)
    booking_id = serializers.PrimaryKeyRelatedField(source="booking", queryset=models.Booking.objects.all())

    class Meta:
        model = models.Payment
        fields = "__all__"


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


class SentNotificationSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source="created")

    class Meta:
        model = SentNotification
        fields = ("id", "notification", "date", "description", "path", "read")

    def get_date(self, instance: SentNotification):
        return instance.created


class GuestSerializer(serializers.Serializer):
    name = serializers.CharField(read_only=True)
    contact = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)


class NextEventSerializer(BookingSerializer):
    date = serializers.DateField(read_only=True)
    event_type = serializers.CharField(read_only=True)


class ActivitySerializer(serializers.ModelSerializer):
    author = UserSubSerializer(read_only=True)
    booking = BookingSerializer(read_only=True)

    class Meta:
        model = models.Activity
        fields = "__all__"
