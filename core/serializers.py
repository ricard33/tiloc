import logging
from decimal import Decimal

import stripe
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Max
from django.db.models.signals import post_save
from django.utils import timezone
from rest_framework import serializers
from rest_framework.reverse import reverse
from timezone_field.rest_framework import TimeZoneSerializerField

from core import models
from core.models import Account, Lodging
from core.pricing import compute_quote
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
    url = serializers.SerializerMethodField(method_name="get_absolute_url")
    id = serializers.CharField(source="name", read_only=True)
    is_initialized = serializers.SerializerMethodField()
    current_plan = serializers.SerializerMethodField()
    current_subscription = SubscriptionSerializer()

    class Meta:
        model = Account
        fields = [
            "id",
            "url",
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

    def get_absolute_url(self, obj):
        return reverse("api:account-detail", kwargs={"pk": obj.pk}, request=self.context["request"])

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
    url = serializers.SerializerMethodField(method_name="get_absolute_url")
    full_name = serializers.SerializerMethodField()
    signature = serializers.ImageField(required=False, allow_empty_file=True, allow_null=True)
    permissions = serializers.SerializerMethodField(read_only=True)
    groups = serializers.SlugRelatedField(many=True, queryset=Group.objects.all(), slug_field="name")
    lodgings = FilteredSlugRelatedField(many=True, queryset=Lodging.objects.all(), slug_field="name", required=False)
    tz = TimeZoneSerializerField(required=False)

    class Meta:
        model = User
        # fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'is_active')
        read_only_fields = ("id", "verified")
        exclude = ["user_permissions", "is_superuser", "is_staff", "logo"]
        extra_kwargs = {"password": {"write_only": True}}

    def get_absolute_url(self, obj):
        return reverse("api:user-detail", kwargs={"pk": obj.pk}, request=self.context["request"])

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
            "registration_number",
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


class LodgingSeasonRateNestedSerializer(serializers.ModelSerializer):
    """A LodgingSeasonRate row nested under LodgingSerializer.season_rates.

    ``lodging`` is implicit (the parent); a row with no ``nightly_rate`` means "no rate for
    this season" rather than a validation error -- see ``LodgingSerializer._write_season_rates``.
    """

    id = serializers.IntegerField(required=False)
    nightly_rate = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = models.LodgingSeasonRate
        fields = ["id", "season", "nightly_rate", "weekend_rate", "min_nights"]


class LodgingSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(method_name="get_absolute_url")
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

    season_calendar = serializers.PrimaryKeyRelatedField(
        queryset=models.SeasonCalendar.objects.all(), required=False, allow_null=True
    )
    season_rates = LodgingSeasonRateNestedSerializer(many=True, required=False)

    class Meta:
        model = models.Lodging
        exclude = ["account"]

    def get_absolute_url(self, obj):
        return reverse("api:lodging-detail", kwargs={"pk": obj.pk}, request=self.context["request"])

    def to_internal_value(self, data):
        # The multipart form encodes "no calendar" / "no rate" as an empty string; normalise
        # to null (the JSON-array path already carries real nulls, this is defensive).
        normalize_calendar = data.get("season_calendar", None) in ("", "null")
        season_rates = data.get("season_rates")
        if normalize_calendar or season_rates:
            data = data.copy()
        if normalize_calendar:
            data["season_calendar"] = None
        if season_rates:
            normalized_rows = []
            for row in season_rates:
                row = dict(row)
                for field in ("nightly_rate", "weekend_rate", "min_nights"):
                    if row.get(field) in ("", "null"):
                        row[field] = None
                normalized_rows.append(row)
            data["season_rates"] = normalized_rows
        return super().to_internal_value(data)

    def validate_season_calendar(self, value):
        if value is not None and value.account_id != self.context["request"].user.account.id:
            raise serializers.ValidationError("Unknown season calendar.")
        return value

    def _write_season_rates(self, lodging, rows):
        kept_season_ids = []
        for row in rows:
            if row.get("nightly_rate") is None:
                continue  # no rate entered for this season: nothing to save
            season = row["season"]
            if season.calendar_id != lodging.season_calendar_id:
                raise serializers.ValidationError(
                    {"season_rates": "A season must belong to the lodging's season calendar."}
                )
            models.LodgingSeasonRate.objects.update_or_create(
                lodging=lodging,
                season=season,
                defaults={
                    "nightly_rate": row["nightly_rate"],
                    "weekend_rate": row.get("weekend_rate"),
                    "min_nights": row.get("min_nights"),
                },
            )
            kept_season_ids.append(season.id)
        lodging.season_rates.exclude(season_id__in=kept_season_ids).delete()

    @transaction.atomic
    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        rank = validated_data.pop("rank", -1)
        if rank < 0:
            rank = (models.Lodging.objects.aggregate(Max("rank"))["rank__max"] or 0) + 1
        validated_data["rank"] = rank
        season_rates_data = validated_data.pop("season_rates", None)
        instance = super().create(validated_data)
        if season_rates_data is not None:
            self._write_season_rates(instance, season_rates_data)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data: dict):
        season_rates_data = validated_data.pop("season_rates", None)
        instance = super().update(instance, validated_data)
        if season_rates_data is not None:
            self._write_season_rates(instance, season_rates_data)
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
    url = serializers.SerializerMethodField(method_name="get_absolute_url")
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
    price_with_options_and_taxes = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tourist_tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    computed_tourist_tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    guests = serializers.IntegerField(read_only=True)
    adults = serializers.IntegerField(read_only=True)
    children = serializers.IntegerField(read_only=True)
    babies = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Booking
        exclude = ["account"]
        # `daily_rate` is the engine's computed average; clients never set it.
        extra_kwargs = {"price": {"required": False}, "daily_rate": {"read_only": True}}

    def get_absolute_url(self, obj):
        return reverse("api:booking-detail", kwargs={"pk": obj.pk}, request=self.context["request"])

    def validate_lodging_ids(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("Bookings need at least one lodging")
        return value

    @staticmethod
    def _save_without_history(instance, update_fields):
        # The engine recompute is derived data, not a user edit: keep it out of the history feed.
        instance.skip_history_when_saving = True
        try:
            instance.save(update_fields=update_fields)
        finally:
            del instance.skip_history_when_saving

    @classmethod
    def _apply_pricing(cls, instance, deposit_provided, price_provided):
        """Recompute price / daily_rate / deposit / price_details from the pricing engine.

        When ``is_flat_rate`` the manager-entered ``price`` wins; only the breakdown snapshot
        is (re)generated so contracts can still itemise a flat-rate stay.
        """
        lodgings = list(instance.lodgings.all())
        if not lodgings or instance.begin_date is None or instance.end_date is None:
            return
        if instance.end_date <= instance.begin_date:
            return
        booking_date = (instance.created or timezone.now()).date()

        if instance.is_flat_rate:
            if instance.price is None:
                return
            quote = compute_quote(
                lodgings=lodgings,
                begin_date=instance.begin_date,
                end_date=instance.end_date,
                booking_date=booking_date,
                is_flat_rate=True,
                flat_price=instance.price,
            )
            instance.price_details = quote.as_dict()
            instance.daily_rate = quote.effective_daily_rate
            cls._save_without_history(instance, ["price_details", "daily_rate"])
            return

        quote = compute_quote(
            lodgings=lodgings,
            begin_date=instance.begin_date,
            end_date=instance.end_date,
            booking_date=booking_date,
        )
        if price_provided and instance.price is not None and Decimal(instance.price) != quote.total_price:
            logger.info(
                "Booking %s: submitted price %s differs from computed %s",
                instance.pk,
                instance.price,
                quote.total_price,
            )
        update_fields = ["price", "daily_rate", "price_details"]
        instance.price = quote.total_price
        instance.daily_rate = quote.effective_daily_rate
        instance.price_details = quote.as_dict()
        if not deposit_provided:
            instance.deposit = quote.total_deposit
            update_fields.append("deposit")
        cls._save_without_history(instance, update_fields)

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        options = validated_data.pop("bookedservice_set", [])
        deposit_provided = "deposit" in validated_data
        price_provided = "price" in validated_data
        validated_data.setdefault("price", Decimal(0))  # NOT NULL column; replaced by _apply_pricing below
        instance = super().create(validated_data)
        for option in options:
            models.BookedService.objects.create(
                service_id=option["service"]["id"],
                booking_id=instance.id,
                unit_price=option["unit_price"],
                is_flat_rate=option["is_flat_rate"],
            )
        self._apply_pricing(instance, deposit_provided, price_provided)
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
        deposit_provided = "deposit" in validated_data
        price_provided = "price" in validated_data
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
        self._apply_pricing(instance, deposit_provided, price_provided)
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
            "price_with_options",
            "price_with_options_and_taxes",
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
        exclude = [
            "price",
            "price_details",
            "daily_rate",
            "is_flat_rate",
            "deposit",
            "guaranty",
            "commission_fees",
            "is_flat_rate_tourist_tax",
            "tourist_tax_included_in_payment",
            "max_daily_tourist_tax",
            "tourist_tax_rate",
            "custom_tourist_tax",
        ]


class SeasonDateRangeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = models.SeasonDateRange
        fields = ["id", "begin_date", "end_date"]

    def validate(self, attrs):
        if attrs["begin_date"] > attrs["end_date"]:
            raise serializers.ValidationError({"end_date": "The last night cannot be before the first night."})
        return attrs


class SeasonSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    date_ranges = SeasonDateRangeSerializer(many=True, required=False)

    class Meta:
        model = models.Season
        fields = ["id", "name", "color", "rank", "date_ranges"]


class SeasonCalendarSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(method_name="get_absolute_url")
    seasons = SeasonSerializer(many=True, required=False)
    lodging_count = serializers.SerializerMethodField()

    class Meta:
        model = models.SeasonCalendar
        exclude = ["account"]

    def get_absolute_url(self, obj):
        return reverse("api:season_calendar-detail", kwargs={"pk": obj.pk}, request=self.context["request"])

    def get_lodging_count(self, obj):
        return obj.lodgings.count()

    @staticmethod
    def _check_no_overlap(seasons_data):
        ranges = []
        for season in seasons_data:
            for date_range in season.get("date_ranges", []):
                ranges.append((date_range["begin_date"], date_range["end_date"]))
        ranges.sort()
        for (_, prev_end), (next_begin, _) in zip(ranges, ranges[1:]):
            if next_begin <= prev_end:
                raise serializers.ValidationError("Two date ranges of the calendar overlap.")

    def _write_seasons(self, calendar, seasons_data):
        self._check_no_overlap(seasons_data)
        kept_season_ids = []
        for season_data in seasons_data:
            ranges_data = season_data.pop("date_ranges", [])
            season_id = season_data.pop("id", None)
            if season_id and calendar.seasons.filter(id=season_id).exists():
                calendar.seasons.filter(id=season_id).update(**season_data)
                season = calendar.seasons.get(id=season_id)
            else:
                season = models.Season.objects.create(calendar=calendar, **season_data)
            kept_season_ids.append(season.id)
            kept_range_ids = []
            for range_data in ranges_data:
                range_id = range_data.pop("id", None)
                if range_id and season.date_ranges.filter(id=range_id).exists():
                    season.date_ranges.filter(id=range_id).update(**range_data)
                    kept_range_ids.append(range_id)
                else:
                    date_range = models.SeasonDateRange.objects.create(season=season, **range_data)
                    kept_range_ids.append(date_range.id)
            season.date_ranges.exclude(id__in=kept_range_ids).delete()
        calendar.seasons.exclude(id__in=kept_season_ids).delete()

    def create(self, validated_data: dict):
        seasons_data = validated_data.pop("seasons", [])
        validated_data["account"] = self.context["request"].user.account
        calendar = models.SeasonCalendar.objects.create(**validated_data)
        self._write_seasons(calendar, seasons_data)
        return calendar

    def update(self, instance, validated_data):
        seasons_data = validated_data.pop("seasons", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if seasons_data is not None:
            self._write_seasons(instance, seasons_data)
        return instance


class LodgingSeasonRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LodgingSeasonRate
        fields = ["id", "lodging", "season", "nightly_rate", "weekend_rate", "min_nights"]

    def validate(self, attrs):
        lodging = attrs.get("lodging") or getattr(self.instance, "lodging", None)
        season = attrs.get("season") or getattr(self.instance, "season", None)
        account = self.context["request"].user.account
        if lodging and lodging.account_id != account.id:
            raise serializers.ValidationError({"lodging": "Unknown lodging."})
        if lodging and season and season.calendar_id != lodging.season_calendar_id:
            raise serializers.ValidationError({"season": "The season is not part of the lodging's season calendar."})
        return attrs


class QuoteRequestSerializer(serializers.Serializer):
    lodging_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    begin_date = serializers.DateField()
    end_date = serializers.DateField()
    booking_date = serializers.DateField(required=False)
    is_flat_rate = serializers.BooleanField(required=False, default=False)
    flat_price = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)

    def validate(self, attrs):
        if attrs["end_date"] <= attrs["begin_date"]:
            raise serializers.ValidationError({"end_date": "The checkout date must be after the arrival date."})
        return attrs


class PricingAdjustmentSerializer(serializers.ModelSerializer):
    # Every optional field: the multipart form sends an empty string for "not set".
    _NULLABLE_FIELDS = (
        "lodging",
        "min_nights",
        "max_nights",
        "min_days_before_arrival",
        "max_days_before_arrival",
        "stay_begin",
        "stay_end",
        "booking_begin",
        "booking_end",
        "applicable_weekdays",
    )

    class Meta:
        model = models.PricingAdjustment
        exclude = ["account"]

    def to_internal_value(self, data):
        if any(data.get(field, None) in ("", "null") for field in self._NULLABLE_FIELDS):
            data = data.copy()
            for field in self._NULLABLE_FIELDS:
                if data.get(field, None) in ("", "null"):
                    data[field] = None
        return super().to_internal_value(data)

    def validate_lodging(self, value):
        if value is not None and value.account_id != self.context["request"].user.account.id:
            raise serializers.ValidationError("Unknown lodging.")
        return value

    def create(self, validated_data: dict):
        validated_data["account"] = self.context["request"].user.account
        return super().create(validated_data)


class ContractTemplateSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(method_name="get_absolute_url")

    class Meta:
        model = models.ContractTemplate
        exclude = ["account"]

    def create(self, validated_data: dict):
        if "account" not in validated_data:
            validated_data["account"] = self.context["request"].user.account
        instance = super().create(validated_data)
        return instance

    def get_absolute_url(self, obj):
        return reverse("api:contract_template-detail", kwargs={"pk": obj.pk}, request=self.context["request"])


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
