import logging
import os
import time
from decimal import Decimal

import arrow
import jinja2
import stripe
from constance import config
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import F, Min, Value
from django.http import Http404, HttpResponse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.csrf import csrf_exempt
from django_email_verification import send_email as send_verification_email
from django_email_verification import send_password as send_reset_password
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView
from knox.views import LogoutView as KnoxLogoutView
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import APIException, AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from stripe import Invoice as StripeInvoice
from stripe import PaymentIntent
from stripe import Subscription as StripeSubscription

from location import __date__, __version__
from notifier.models import SentNotification
from notifier.shortcuts import send_notification

from . import models
from .contracts import generate_contract, generate_preview_contract
from .filters import BookingFilter, CommentFilter, PaymentFilter
from .history import build_booking_history
from .mail_tools import send_generic_email
from .pagination import LargeResultsSetPagination, StandardResultsSetPagination
from .pdf_tools import generate_pdf
from .permissions import IsCompanyAdminPermissions
from .pricing import compute_quote
from .serializers import (
    AccountSerializer,
    ActivitySerializer,
    BookingChannelSerializer,
    BookingChannelSyncSerializer,
    BookingNoPriceSerializer,
    BookingSerializer,
    CommentSerializer,
    ContractSerializer,
    ContractTemplateSerializer,
    CreateUserSerializer,
    CurrentUserSerializer,
    GuestSerializer,
    LodgingSeasonRateSerializer,
    LodgingSerializer,
    LoginUserSerializer,
    NextEventSerializer,
    PaymentSerializer,
    PricingAdjustmentSerializer,
    QuoteRequestSerializer,
    SeasonCalendarSerializer,
    SentNotificationSerializer,
    ServiceSerializer,
    SignUpSerializer,
    SubscriptionSerializer,
    UserSerializer,
)

logger = logging.getLogger("api")


class OverLimitError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = _("This ressource has already reach his limit")
    default_code = "over_limit"


class OrderedModelMixin:
    @transaction.atomic
    @action(detail=True, methods=["post"])
    def move_down(self, request, pk):
        obj = self.get_object()
        current_rank = obj.rank
        next_obj = self.get_queryset().filter(rank__gte=current_rank).exclude(id=obj.id).order_by("rank").first()
        if next_obj:
            obj.rank = next_obj.rank
            obj.save(update_fields=["rank"])
            next_obj.rank = current_rank
            next_obj.save(update_fields=["rank"])
        serializer = self.get_serializer(instance=obj)
        return Response(serializer.data)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def move_up(self, request, pk):
        obj = self.get_object()
        current_rank = obj.rank
        next_obj = self.get_queryset().filter(rank__lte=current_rank).exclude(id=obj.id).order_by("-rank").first()
        if next_obj:
            obj.rank = next_obj.rank
            obj.save(update_fields=["rank"])
            next_obj.rank = current_rank
            next_obj.save(update_fields=["rank"])
        serializer = self.get_serializer(instance=obj)
        return Response(serializer.data)


@api_view()
@permission_classes([AllowAny])
def info_view(request, *args, **kwargs):
    request.session.modified = True
    return Response(
        {
            "version": __version__,
            "build_date": __date__.isoformat(timespec="seconds"),
            "is_debug": settings.DEBUG,
            "is_demo": settings.IS_DEMO,
            "can_register": config.CAN_SIGNUP and not settings.IS_DEMO,
        }
    )


class RegistrationAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CreateUserSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        auth_token, token = AuthToken.objects.create(user)
        return Response({"user": UserSerializer(user, context=self.get_serializer_context()).data, "token": token})


class LoginAPI(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = LoginUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request, username=serializer.validated_data["email"], password=serializer.validated_data["password"]
        )
        if not user or not user.is_active:
            raise AuthenticationFailed()
        logging.getLogger("auth").info("User %s successfully logged." % user.email)
        if not serializer.validated_data.get("keep_connected", False):
            request.session.set_expiry(0)  # expire when the user’s web browser is closed
        login(request, user)
        return super(LoginAPI, self).post(request, format=None)


class LogoutAPI(KnoxLogoutView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        logout(request)
        if request._auth:
            response = super(LogoutAPI, self).post(request, format=None)
            return response
        return Response(None, status=status.HTTP_204_NO_CONTENT)


class SignUpAPI(KnoxLoginView):
    """
    Create a new user and login it in restricted (or creation) mode
    """

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        if models.User.objects.filter(email=email):
            return Response(
                {"detail": "This email is already in use.", "code": "EMAIL_ALREADY_IN_USE"},
                status=status.HTTP_409_CONFLICT,
            )

        account = models.Account.objects.create()
        user = models.User.objects.create_user(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            account=account,
        )
        user.groups.set(Group.objects.filter(name="administrator"))
        send_verification_email(user, context={"request": request}, thread=False)
        # raise APIException(detail="TEST")
        login(request, user)

        plan_ref = serializer.validated_data.get("plan")
        if plan_ref is not None:
            logger.debug("Looking up plan %s", plan_ref)
            plan = models.Plan.objects.filter(ref=plan_ref).first()
            if plan and plan.lookup_key:
                # STRIPE API START
                customer = stripe.Customer.create(email=user.email, name=user.get_full_name())
                account.stripe_customer_id = customer.id
                account.save(update_fields=("stripe_customer_id",))
                subscription = stripe.Subscription.create(
                    customer=customer.id,
                    payment_behavior="default_incomplete",
                    items=[{"price": stripe_get_price(plan_ref)}],
                    trial_period_days=14,
                )
                # STRIPE API END
                create_or_update_subscription(subscription)
            elif not plan:
                logger.warning("Subscription plan not found for %s", plan_ref)

        send_generic_email("welcome", request.user)
        return super(SignUpAPI, self).post(request, format=None)


class ResetPasswordAPI(generics.GenericAPIView):
    """
    Create a new user and login it in restricted (or creation) mode
    """

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({"email": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = models.User.objects.get(email=email)
            send_reset_password(user, context={"request": request}, thread=False)
        except models.User.DoesNotExist:
            logger.warning("Reset password: user not found for %s", email)
        return Response({"message": "Reset link successfully sent"}, status=status.HTTP_200_OK)


class AccountViewSet(viewsets.ModelViewSet):
    # permission_classes = [IsSuperUserPermission]
    queryset = models.Account.objects.all()
    serializer_class = AccountSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class CurrentAccountViewSet(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows current account to be viewed, edited or deleted.
    """

    queryset = models.Account.objects.all()
    serializer_class = AccountSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def get_object(self):
        self.check_object_permissions(self.request, self.request.user.account)
        return self.request.user.account

    def destroy(self, request, *args, **kwargs):
        # self.send_account_deletion_request_email_to_si(request.user)
        # if request.user.email:
        #     self.send_account_deletion_request_email_to_user(request.user)

        request.user.account.is_active = False
        request.user.account.save(update_fields=["is_active"])

        return Response(
            data={"result": _("Request of deletion of all your account's data successfully sent.")}, status=200
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows user(s) to be viewed/listed.
    """

    queryset = models.User.objects.all()
    # filter_class = filters.UserFilter
    serializer_class = UserSerializer
    ordering_fields = "__all__"

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def create(self, request, *args, **kwargs):
        limit = request.user.account.max_users
        if self.get_queryset().count() >= limit:
            raise OverLimitError(detail="The maximum number of users has been reached.")
        return super().create(request, *args, **kwargs)


class CurrentUserAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = CurrentUserSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def resend_verification(request, *args, **kwargs):
    user = request.user
    send_verification_email(user, context={"request": request}, thread=False)
    return Response("Email sent")


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows bookings to be viewed or edited.
    """

    queryset = (
        models.Booking.objects.filter(deleted=False)
        .order_by("-begin_date")
        .prefetch_related("lodgings__owner", "source", "payment_set", "comments", "bookedservice_set__service")
    )
    serializer_class = BookingSerializer
    pagination_class = LargeResultsSetPagination
    filterset_class = BookingFilter

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def get_serializer_class(self):
        if not self.request.user.has_perm("core.view_prices"):
            return BookingNoPriceSerializer
        return BookingSerializer

    def perform_destroy(self, instance):
        instance.deleted = True
        instance.save(update_fields=["deleted"])

    @action(detail=False, methods=["get"])
    def all_guests(self, request, pk=None):
        names = set()
        results = []
        for booking in self.get_queryset().values(
            name=Min("guest_name"),
            contact=Min("guest_contact"),
            address=Min("guest_address"),
        ):
            if booking["name"] not in names:
                names.add(booking["name"])
                results.append(booking)

        serializer = GuestSerializer(
            results,
            many=True,
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def next_events(self, request, pk=None):
        qs1 = (
            self.get_queryset()
            .filter(begin_date__gte=timezone.now(), cancelled=False, deleted=False)
            .order_by()
            .annotate(date=F("begin_date"), event_type=Value("CHECKIN"))
            # .values(
            #     "id",
            #     "date",
            #     "guest_name",
            #     "event_type",
            #     "duration",
            #     "guests",
            #     lodging_name=F("lodging__name"),
            #     booking_channel=F("source__name"),
            # )
        )
        qs2 = (
            self.get_queryset()
            .filter(end_date__gte=timezone.now(), cancelled=False, deleted=False)
            .order_by()
            .annotate(date=F("end_date"), event_type=Value("CHECKOUT"))
            # .values(
            #     "id",
            #     "date",
            #     "guest_name",
            #     "event_type",
            #     "duration",
            #     "guests",
            #     lodging_name=F("lodging__name"),
            #     booking_channel=F("source__name"),
            # )
        )
        qs = qs1.union(qs2).order_by("date")
        count = int(self.request.query_params.get("count", 10))
        serializer = NextEventSerializer(qs[:count], many=True, context={"request": request})
        return Response(serializer.data)

    @staticmethod
    def _generate_contract(booking, request):
        try:
            contract = generate_contract(booking, request.scheme + "://" + request.META.get("HTTP_HOST", "localhost"))
        except jinja2.exceptions.TemplateSyntaxError as ex:
            logger.exception("Template generation error")
            raise APIException(detail="Template error at line %d: %s" % (ex.lineno, ex.message))
        except jinja2.exceptions.TemplateError as ex:
            logger.exception("Template generation error")
            raise APIException(detail="Template error: " + ex.message)
        except Exception as ex:
            logger.exception("Unknown error during template generation")
            raise APIException(detail=str(ex))
        return contract

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def get_or_create_contract(self, request, pk=None):
        booking = self.get_object()
        if models.Contract.objects.filter(booking=booking).exists():
            contract = booking.contract
        else:
            contract = self._generate_contract(booking, request)
        serializer = ContractSerializer(instance=contract)
        return Response(serializer.data)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def generate_contract(self, request, pk=None):
        booking = self.get_object()
        contract = self._generate_contract(booking, request)
        serializer = ContractSerializer(instance=contract)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """Return the modification history (time, changed fields, author) of a booking."""
        booking = self.get_object()
        entries = build_booking_history(
            list(booking.history.all()),
            include_prices=request.user.has_perm("core.view_prices"),
        )
        return Response(entries)

    @action(detail=False, methods=["post"])
    def quote(self, request, pk=None):
        """Price a prospective stay: per-night rates, discounts and total, with a full breakdown."""
        if not request.user.has_perm("core.view_prices"):
            raise PermissionDenied

        serializer = QuoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lodgings = list(models.Lodging.objects.for_user(request.user).filter(id__in=data["lodging_ids"]))
        if len(lodgings) != len(set(data["lodging_ids"])):
            raise ValidationError({"lodging_ids": _("Unknown lodging.")})
        # keep the caller's order
        lodgings.sort(key=lambda lodging: data["lodging_ids"].index(lodging.id))

        quote = compute_quote(
            lodgings=lodgings,
            begin_date=data["begin_date"],
            end_date=data["end_date"],
            booking_date=data.get("booking_date"),
            is_flat_rate=data.get("is_flat_rate", False),
            flat_price=data.get("flat_price"),
        )
        return Response(quote.as_dict())


class BookingChannelViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannel.objects.all()
    serializer_class = BookingChannelSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class BookingChannelSyncViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannelSync.objects.all()
    serializer_class = BookingChannelSyncSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class LodgingViewSet(viewsets.ModelViewSet, OrderedModelMixin):
    queryset = models.Lodging.objects.all()  # .order_by("name")
    serializer_class = LodgingSerializer
    filterset_fields = ["shown", "active"]

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def create(self, request, *args, **kwargs):
        limit = request.user.account.max_lodgings
        if self.get_queryset().count() >= limit:
            raise OverLimitError(detail="The maximum number of lodgings has been reached.")
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def rate_calendar(self, request, pk=None):
        """Per-night base rate for a lodging over ``?begin=YYYY-MM-DD&end=YYYY-MM-DD`` (end exclusive)."""
        if not request.user.has_perm("core.view_prices"):
            raise PermissionDenied
        lodging = self.get_object()
        try:
            begin = arrow.get(request.query_params["begin"]).date()
            end = arrow.get(request.query_params["end"]).date()
        except (KeyError, ValueError, arrow.parser.ParserError):
            raise ValidationError({"begin": _("Provide begin and end as YYYY-MM-DD dates.")})
        if end <= begin:
            raise ValidationError({"end": _("end must be after begin.")})

        quote = compute_quote(lodgings=[lodging], begin_date=begin, end_date=end, apply_adjustments=False)
        nights = quote.lodgings[0].nights if quote.lodgings else []
        return Response(
            [
                {
                    "date": night.date.isoformat(),
                    "rate": f"{night.applied_rate:.2f}",
                    "season": night.season,
                    "is_weekend": night.is_weekend,
                }
                for night in nights
            ]
        )


class SeasonCalendarViewSet(viewsets.ModelViewSet):
    queryset = models.SeasonCalendar.objects.all().order_by("name").prefetch_related("seasons__date_ranges", "lodgings")
    serializer_class = SeasonCalendarSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class LodgingSeasonRateViewSet(viewsets.ModelViewSet):
    queryset = models.LodgingSeasonRate.objects.all().order_by("lodging", "season")
    serializer_class = LodgingSeasonRateSerializer
    filterset_fields = ["lodging", "season"]

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class PricingAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = models.PricingAdjustment.objects.all().order_by("priority", "id")
    serializer_class = PricingAdjustmentSerializer
    filterset_fields = ["lodging", "active"]

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class ContractTemplateViewSet(viewsets.ModelViewSet):
    queryset = models.ContractTemplate.objects.all().order_by("name")
    serializer_class = ContractTemplateSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    @action(detail=True, methods=["post"], name="Generate PDF preview")
    @transaction.atomic
    def preview_pdf(self, request, pk=None):
        template: models.ContractTemplate = self.get_object()
        template_content = self.request.data.get("template")
        if not template_content:
            template_content = template_content
        lodging_id = self.request.data.get("lodging_id")
        if lodging_id:
            lodging = models.Lodging.objects.for_user(request.user).get(pk=lodging_id)
        else:
            lodging = template.account.lodging_set.first()
        full_path = os.path.join(
            settings.MEDIA_ROOT, template.account.name, "templates", "%d" % template.id, "preview_contract.pdf"
        )
        os.makedirs(os.path.split(full_path)[0], exist_ok=True)

        sid = transaction.savepoint()
        try:
            generate_pdf(
                generate_preview_contract(
                    template_content, lodging, request.scheme + "://" + request.META.get("HTTP_HOST", "localhost")
                ),
                full_path,
                request.user.account.is_free_plan,
            )
        except jinja2.exceptions.TemplateError as ex:
            logger.exception("Template generation error")
            return HttpResponse("Template error: " + ex.message, status=status.HTTP_400_BAD_REQUEST)
        except Exception as ex:
            logger.exception("Unknown error during template generation")
            return HttpResponse(
                "Unknown error during template generation: " + str(ex), status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        transaction.savepoint_rollback(sid)

        if os.path.exists(full_path):
            with open(full_path, "rb") as fh:
                response = HttpResponse(fh.read(), content_type="application/pdf")
                response["Content-Disposition"] = 'inline;filename="' + os.path.basename(full_path) + '"'
                return response
        raise Http404


class ContractViewSet(viewsets.ModelViewSet):
    queryset = models.Contract.objects.all().order_by("created")
    serializer_class = ContractSerializer
    filterset_fields = ["booking_id"]

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        contract = self.get_object()
        rel_path = contract.make_pdf_path()
        full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        if contract.pdf_created is None or contract.modified > contract.pdf_created or not os.path.exists(full_path):
            os.makedirs(os.path.split(full_path)[0], exist_ok=True)
            generate_pdf(contract.content, full_path, request.user.account.is_free_plan)
            models.Contract.objects.filter(id=pk).update(pdf=rel_path, pdf_created=arrow.utcnow().isoformat(sep=" "))

        if os.path.exists(full_path):
            with open(full_path, "rb") as fh:
                response = HttpResponse(fh.read(), content_type="application/pdf")
                response["Content-Disposition"] = "inline; filename=" + os.path.basename(full_path)
                return response
        raise Http404


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = models.Payment.objects.all().order_by("date")
    serializer_class = PaymentSerializer
    filterset_class = PaymentFilter

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = models.Comment.objects.all().order_by("created_on")
    serializer_class = CommentSerializer
    filterset_class = CommentFilter

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = models.Service.objects.all().order_by("reference")
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = SentNotification.objects.filter(backend__name="noop").order_by("-created")
    serializer_class = SentNotificationSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=["PATCH"])
    def all_read(self, request):
        self.get_queryset().filter(read=False).update(read=True)
        return Response(status=status.HTTP_200_OK)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = models.Activity.objects.order_by("-date")
    serializer_class = ActivitySerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


# Billing API

stripe.api_key = settings.STRIPE_PRIVATE_API_KEY


class StripeConfig(APIView):
    permission_classes = [IsCompanyAdminPermissions]

    def get(self, request):
        return Response(
            data={
                "publishableKey": settings.STRIPE_PUBLIC_API_KEY,
            }
        )


class Prices(APIView):
    permission_classes = [IsCompanyAdminPermissions]

    def get(self, request):
        prices = stripe.Price.list(
            lookup_keys=[
                "tiloc-owner-monthly",
                "tiloc-owner-yearly",
                "tiloc-pro10-monthly",
                "tiloc-pro10-yearly",
            ]
        )

        return Response(
            data={
                "publishableKey": settings.STRIPE_PUBLIC_API_KEY,
                "prices": prices.data,
            }
        )


# Doc to subscription payment process
# https://stripe.com/docs/billing/subscriptions/build-subscriptions?ui=elements


def stripe_get_price(plan_ref):
    try:
        plan = models.Plan.objects.get(ref=plan_ref)
        prices = stripe.Price.list(lookup_keys=[plan.lookup_key])
        return prices.data[0]
    except models.Plan.DoesNotExist:
        logger.exception("Plan with ref=%s doesn't exist", plan_ref)
        raise APIException(detail=_("Price plan %(plan_ref)s doesn't exist") % {"plan_ref": plan_ref})
    except Exception as e:
        logger.exception("Error getting prices")
        raise APIException(detail=str(e))


class SubscriptionViewSet(ViewSet):
    permission_classes = [IsCompanyAdminPermissions]

    def create(self, request):  # create_subscription
        plan_ref = request.data["plan"]
        user = request.user

        price = stripe_get_price(plan_ref)

        price_id = price.id

        if user.account.stripe_customer_id is None:
            try:
                # Create a new customer object
                customer = stripe.Customer.create(email=user.email, name=user.get_full_name(), phone=user.phone)
                user.account.stripe_customer_id = customer.id
                user.account.save(update_fields=("stripe_customer_id",))

            except Exception as e:
                logger.exception("Error creating customer")
                raise APIException(detail=str(e))

        try:
            # create subscription object
            subscription = stripe.Subscription.create(
                customer=user.account.stripe_customer_id,
                items=[
                    {
                        "price": price_id,
                    }
                ],
                payment_behavior="default_incomplete",
                payment_settings={"save_default_payment_method": "on_subscription"},
                expand=["latest_invoice.payment_intent", "pending_setup_intent"],
            )
        except Exception as e:
            logger.exception("Error opening Checkout session")
            raise APIException(detail=str(e))

        create_or_update_subscription(subscription)
        if subscription.pending_setup_intent is not None:
            return Response(
                data={
                    "type": "setup",
                    "subscriptionId": subscription.id,
                    "clientSecret": subscription.pending_setup_intent.client_secret,
                }
            )
        else:
            return Response(
                data={
                    "type": "payment",
                    "subscriptionId": subscription.id,
                    "clientSecret": subscription.latest_invoice.payment_intent.client_secret,
                }
            )

    def retrieve(self, request, pk=None):
        subscription = stripe.Subscription.retrieve(
            pk,  # request.GET.get("subscription_id"),
            expand=["latest_invoice.payment_intent", "pending_setup_intent", "default_payment_method"],
        )

        return Response(data=subscription)

    def _cancel_or_reactivate(self, pk, cancel):
        stripe_subscription = stripe.Subscription.modify(
            pk,
            cancel_at_period_end=cancel,
        )
        subscription = models.Subscription.objects.get(id=pk)
        subscription.cancel_at_period_end = stripe_subscription.cancel_at_period_end
        subscription.save(update_fields=("cancel_at_period_end",))
        return Response(data=SubscriptionSerializer(subscription).data)

    @action(detail=True, methods=["POST"])
    def cancel(self, request, pk):
        return self._cancel_or_reactivate(pk, True)

    @action(detail=True, methods=["POST"])
    def reactivate(self, request, pk):
        return self._cancel_or_reactivate(pk, False)

    @action(detail=True, methods=["GET"])
    def preview(self, request, pk):
        subscription = stripe.Subscription.retrieve(pk)
        plan_ref = request.GET["plan"]
        user = request.user
        price = stripe_get_price(plan_ref)

        # See what the next invoice would look like with a price switch
        # and proration set:
        items = [
            {
                "id": subscription["items"]["data"][0].id,
                "price": price.id,  # Switch to new price
            }
        ]

        invoice = stripe.Invoice.upcoming(
            customer=user.account.stripe_customer_id,
            subscription=pk,
            subscription_items=items,
            subscription_proration_date=int(time.time()),
        )
        return Response(
            data={
                "lines": map(
                    lambda line: {
                        "amount": Decimal(line.amount / 100),
                        "description": line.description,
                        "period": {
                            "start": arrow.get(line.period.start).datetime,
                            "end": arrow.get(line.period.end).datetime,
                        },
                    },
                    invoice.lines.data,
                ),
                "subtotal": Decimal(invoice.subtotal / 100),
                "total": Decimal(invoice.total / 100),
                "period_start": arrow.get(invoice.period_start).datetime,
                "period_end": arrow.get(invoice.period_end).datetime,
                "subscription_proration_date": arrow.get(invoice.subscription_proration_date).datetime,
                # "invoice": invoice,
            }
        )

    @action(detail=True, methods=["POST"])
    def change(self, request, pk):
        subscription = stripe.Subscription.retrieve(pk)
        plan_ref = request.data["plan"]
        user = request.user
        price = stripe_get_price(plan_ref)

        stripe.SubscriptionItem.modify(subscription["items"]["data"][0].id, price=price.id)

        subscription = stripe.Subscription.retrieve(pk)

        models.Subscription.objects.filter(id=subscription.id).update(
            customer=user.account,
            plan_id=subscription["items"].data[0].price.lookup_key,
            created=arrow.get(subscription.created).datetime,
            start_date=arrow.get(subscription.start_date).datetime,
            current_period_start=arrow.get(subscription.current_period_start).datetime,
            current_period_end=arrow.get(subscription.current_period_end).datetime,
            status=subscription.status,
            latest_invoice=subscription.latest_invoice,
            default_payment_method=subscription.default_payment_method,
        )

        return Response(data=SubscriptionSerializer(models.Subscription.objects.get(id=subscription.id)).data)

    @action(detail=True, methods=["POST"])
    def create_customer_portal_session(self, request, pk):
        return_url = request.data["return_url"]
        session = stripe.billing_portal.Session.create(
            customer=request.user.account.stripe_customer_id,
            return_url=return_url,
        )
        return Response(data=session)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    test_mode = settings.STRIPE_TEST_MODE

    sig_header = request.META["HTTP_STRIPE_SIGNATURE"]
    event = None

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_ENDPOINT_SECRET)
    except ValueError:
        # Invalid payload
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return HttpResponse(status=400)

    # if settings.DEBUG and settings.ENV == "dev" and not settings.UNITTEST:
    #     with open(os.path.join(settings.LOG_DIR, "stripe-event-%f-%s.txt" % (time.time(), event.type)), "tw") as f:
    #         f.write(str(event))

    try:
        if event.type == "customer.subscription.created":
            logger.info("[%s]", event.type)
            subscription: StripeSubscription = event.data.object
            account = models.Account.objects.get(stripe_customer_id=subscription.customer)
            logger.info("Subscription for customer '%s' created with status '%s'", account.name, subscription.status)
            create_or_update_subscription(subscription)

        elif event.type == "customer.subscription.updated":
            logger.info("[%s]", event.type)
            subscription: StripeSubscription = event.data.object
            try:
                account = models.Account.objects.get(stripe_customer_id=subscription.customer)
                logger.info("Subscription for customer '%s' has status '%s'", account.name, subscription.status)
                create_or_update_subscription(subscription)

            except models.Account.DoesNotExist:
                logger.warning("Subscription update for unknown customer '%s'", subscription.customer)

        elif event.type == "customer.subscription.deleted":
            # handle subscription cancelled automatically based
            # upon your subscription settings. Or if the user cancels it.
            logger.info("[%s]", event.type)
            subscription: StripeSubscription = event.data.object
            try:
                account = models.Account.objects.get(stripe_customer_id=subscription.customer)
                logger.info("Subscription for customer '%s' has ended", account.name)
                create_or_update_subscription(subscription)
            except models.Account.DoesNotExist:
                logger.warning("Subscription update for unknown customer '%s'", subscription.customer)

        elif event.type == "customer.subscription.trial_will_end":
            logger.info("[%s]", event.type)
            subscription: StripeSubscription = event.data.object
            try:
                account = models.Account.objects.get(stripe_customer_id=subscription.customer)
                # TODO send email to customer
                send_notification(
                    "trial_will_end",
                    account.user_set.all(),
                    _("The trial period of your subscription will end on %(date)s")
                    % {"date": arrow.get(subscription.trial_end).date().strftime("%x")},
                    "/account/subscription",
                )
            except models.Account.DoesNotExist:
                logger.warning("'Trial will end' notification for unknown customer '%s'", subscription.customer)

        elif event.type == "payment_intent.succeeded":
            logger.info("[%s]", event.type)
            payment_intent: PaymentIntent = event.data.object
            if not payment_intent.customer:
                return HttpResponse(status=200)
            try:
                account = models.Account.objects.get(stripe_customer_id=payment_intent.customer)
                logger.info("PaymentIntent for customer '%s' has status '%s", account.name, payment_intent.status)
            except models.Account.DoesNotExist:
                # unknown customer
                logger.warning("PaymentIntent for unkonwn customer '%s'", payment_intent.customer)
                pass

        elif event.type == "invoice.created":
            logger.info("[%s]", event.type)
            stripe_invoice: StripeInvoice = event.data.object
            create_or_update_invoice(stripe_invoice)

        elif event.type == "invoice.paid":
            # Used to provision services after the trial has ended.
            # The status of the invoice will show up as paid. Store the status in your
            # database to reference when a user accesses your service to avoid hitting rate
            # limits.
            logger.info("[%s]", event.type)
            stripe_invoice: StripeInvoice = event.data.object
            create_or_update_invoice(stripe_invoice)

        elif event.type == "invoice.payment_failed":
            # If the payment fails or the customer does not have a valid payment method,
            # an invoice.payment_failed event is sent, the subscription becomes past_due.
            # Use this webhook to notify your user that their payment has
            # failed and to retrieve new card details.
            logger.info("[%s]", event.type)
            stripe_invoice: StripeInvoice = event.data.object
            create_or_update_invoice(stripe_invoice)
        elif event.type == "invoice.upcoming":
            # Not a real invoice (no id), this is juste an event to warn of the upcoming
            # arrival of an invoice.
            logger.info("[%s]", event.type)
            stripe_invoice: StripeInvoice = event.data.object
            # TODO send email to customer

        elif event["type"] == "checkout.session.completed":
            # checkout_session = event["data"]["object"]
            # customer_id = checkout_session["customer"]
            # customer_email = checkout_session["customer_email"]
            logger.info("[checkout.session.completed]")
            # Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
            # session = stripe.checkout.Session.retrieve(
            #     checkout_session["id"],
            #     # expand=["line_items"],
            # )
        elif event["type"] == "customer.created":
            # customer = event["data"]["object"]
            logger.info("[%s]", event["type"])
            # # Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
            # session = stripe.checkout.Session.retrieve(
            #     checkout_session["id"],
            #     # expand=["line_items"],
            # )

        # Passed signature verification
        return HttpResponse(status=200)
    except models.Account.DoesNotExist:
        if test_mode and settings.ENV == "prod":
            # In test mode, we can have multiple applications with different customers
            # So we don't return error to avoid crash emails and hook in error
            return HttpResponse(status=200)
        raise
    except Exception:
        raise


def create_or_update_subscription(sub: StripeSubscription):
    models.Subscription.objects.update_or_create(
        id=sub.id,
        defaults=dict(
            customer_id=sub.customer,
            created=arrow.get(sub.created).datetime,
            start_date=arrow.get(sub.start_date).datetime,
            current_period_start=arrow.get(sub.current_period_start).datetime,
            current_period_end=arrow.get(sub.current_period_end).datetime,
            status=sub.status,
            latest_invoice=isinstance(sub.latest_invoice, StripeInvoice)
            and sub.latest_invoice.id
            or sub.latest_invoice,
            default_payment_method=sub.default_payment_method,
            cancel_at_period_end=sub.cancel_at_period_end,
            # special case for archived prices without lookup_key --> we don't update plan
            **(sub["items"].data[0].price.lookup_key and dict(plan_id=sub["items"].data[0].price.lookup_key) or {}),
        ),
    )


def create_or_update_invoice(stripe_invoice):
    if not models.Account.objects.filter(stripe_customer_id=stripe_invoice.customer).exists():
        logger.warning("Invoice for an unknown customer [%s]", stripe_invoice.customer)
        return
    models.Invoice.objects.update_or_create(
        id=stripe_invoice.id,
        defaults=dict(
            customer_id=stripe_invoice.customer,
            subscription_id=stripe_invoice.subscription,
            total=Decimal(stripe_invoice.total / 100),
            status=stripe_invoice.status,
            hosted_invoice_url=stripe_invoice.hosted_invoice_url,
            period_start=arrow.get(stripe_invoice.period_start).datetime,
            period_end=arrow.get(stripe_invoice.period_end).datetime,
            next_payment_attempt=stripe_invoice.next_payment_attempt
            and arrow.get(stripe_invoice.next_payment_attempt).datetime
            or None,
            created=arrow.get(stripe_invoice.created).datetime,
        ),
    )
