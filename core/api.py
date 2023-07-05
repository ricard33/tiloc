import logging
import os

import arrow
import jinja2
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import F, Value
from django.http import Http404, HttpResponse
from django.utils import timezone
from knox.auth import TokenAuthentication
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView
from knox.views import LogoutView as KnoxLogoutView
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import APIException, AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from location import __date__, __version__

from . import models
from .filters import BookingFilter
from .pagination import LargeResultsSetPagination
from .pdf_tools import generate_pdf
from .serializers import (
    BookingChannelSerializer,
    BookingChannelSyncSerializer,
    BookingNoPriceSerializer,
    BookingSerializer,
    BookingStatusSerializer,
    ContractSerializer,
    ContractTemplateSerializer,
    CreateUserSerializer,
    GuestSerializer,
    HolidaysSerializer,
    LodgingSerializer,
    LoginUserSerializer,
    NextEventSerializer,
    OwnerSerializer,
    PaymentSerializer,
    PricingSerializer,
    SeasonalVariationSerializer,
    ServiceSerializer,
    UserSerializer, PaymentExtSerializer,
)

logger = logging.getLogger("api")


class OrderedModelMixin:
    @transaction.atomic
    @action(detail=True, methods=["post"])
    def move_down(self, request, pk):
        obj = self.get_object()
        current_rank = obj.rank
        next_obj = self.queryset.filter(rank__gte=current_rank).exclude(id=obj.id).order_by("rank").first()
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
        next_obj = self.queryset.filter(rank__lte=current_rank).exclude(id=obj.id).order_by("-rank").first()
        if next_obj:
            obj.rank = next_obj.rank
            obj.save(update_fields=["rank"])
            next_obj.rank = current_rank
            next_obj.save(update_fields=["rank"])
        serializer = self.get_serializer(instance=obj)
        return Response(serializer.data)


@api_view()
@permission_classes([AllowAny])
def version_view(request, *args, **kwargs):
    return Response(
        {
            "version": __version__,
            "build_date": __date__.isoformat(timespec="seconds"),
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


class LoginAPI_(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(**serializer.validated_data)
        if not user or not user.is_active:
            raise AuthenticationFailed()
        auth_token, token = AuthToken.objects.create(user)
        return Response({"user": UserSerializer(user, context=self.get_serializer_context()).data, "token": token})


class LoginAPI(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = LoginUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(**serializer.validated_data)
        if not user or not user.is_active:
            raise AuthenticationFailed()
        logging.getLogger("auth").info("User %s successfully logged." % user.email)
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


class UserAPI(generics.RetrieveAPIView):
    # authentication_classes = (TokenAuthentication,)
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows bookings to be viewed or edited.
    """

    queryset = (
        models.Booking.objects.filter(deleted=False)
        .order_by("-begin_date")
        .prefetch_related("status", "lodging", "source", "options")
    )
    serializer_class = BookingSerializer
    pagination_class = LargeResultsSetPagination
    filterset_class = BookingFilter

    def get_serializer_class(self):
        if not self.request.user.has_perm("core.view_prices"):
            return BookingNoPriceSerializer
        return BookingSerializer

    def perform_destroy(self, instance):
        instance.deleted = True
        instance.save()

    @action(detail=False, methods=["get"])
    def all_guests(self, request, pk=None):
        serializer = GuestSerializer(
            models.Booking.objects.raw(
                """WITH added_row_number AS (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY guest_name ORDER BY begin_date DESC) AS row_number
  FROM core_booking
  WHERE deleted = false
)
SELECT
  id, guest_name as name, guest_contact as contact, guest_address as address
FROM added_row_number
WHERE row_number = 1
ORDER BY guest_name"""
            ),
            many=True,
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def next_events(self, request, pk=None):
        qs1 = (
            models.Booking.objects.filter(
                begin_date__gte=timezone.now(), lodging__isnull=False, cancelled=False, deleted=False
            )
            .order_by()
            .annotate(date=F("begin_date"), event_type=Value("CHECKIN"))
            .values(
                "id",
                "date",
                "guest_name",
                "event_type",
                "guest_name",
                lodging_name=F("lodging__name"),
                booking_channel=F("source__name"),
            )
        )
        qs2 = (
            models.Booking.objects.filter(end_date__gte=timezone.now(), lodging__isnull=False)
            .order_by()
            .annotate(date=F("end_date"), event_type=Value("CHECKOUT"))
            .values(
                "id",
                "date",
                "guest_name",
                "event_type",
                "guest_name",
                lodging_name=F("lodging__name"),
                booking_channel=F("source__name"),
            )
        )
        qs = qs1.union(qs2).order_by("date")
        count = int(self.request.query_params.get("count", 10))
        serializer = NextEventSerializer(qs[:count], many=True)
        return Response(serializer.data)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def get_or_create_contract(self, request, pk=None):
        booking = self.get_object()
        if models.Contract.objects.filter(booking=booking).exists():
            contract = booking.contract
        else:
            try:
                contract = booking.generate_contract(
                    request.scheme + "://" + request.META.get("HTTP_HOST", "localhost")
                )
            except jinja2.exceptions.TemplateError as ex:
                logger.exception("Template generation error")
                raise APIException(detail="Template error: " + ex.message)
            except Exception as ex:
                logger.exception("Unknown error during template generation")
                raise APIException(detail=str(ex))
        serializer = ContractSerializer(instance=contract)
        return Response(serializer.data)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def generate_contract(self, request, pk=None):
        booking = self.get_object()
        try:
            contract = booking.generate_contract(request.scheme + "://" + request.META.get("HTTP_HOST", "localhost"))
        except jinja2.exceptions.TemplateError as ex:
            logger.exception("Template generation error")
            raise APIException(detail="Template error: " + ex.message)
        except Exception as ex:
            logger.exception("Unknown error during template generation")
            raise APIException(detail=str(ex))
        serializer = ContractSerializer(instance=contract)
        return Response(serializer.data)


class BookingStatusViewSet(viewsets.ModelViewSet, OrderedModelMixin):
    queryset = models.BookingStatus.objects.all()
    serializer_class = BookingStatusSerializer


class BookingChannelViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannel.objects.all()
    serializer_class = BookingChannelSerializer


class BookingChannelSyncViewSet(viewsets.ModelViewSet):
    queryset = models.BookingChannelSync.objects.all()
    serializer_class = BookingChannelSyncSerializer


class LodgingViewSet(viewsets.ModelViewSet, OrderedModelMixin):
    authentication_classes = [TokenAuthentication]  # , SessionAuthentication]
    queryset = models.Lodging.objects.all()  # .order_by("name")
    serializer_class = LodgingSerializer
    filterset_fields = ["shown", "active"]

    @action(detail=True, methods=["get"])
    @transaction.atomic
    def empty_contract_pdf(self, request, pk=None):
        lodging = self.get_object()
        full_path = os.path.join(settings.MEDIA_ROOT, "lodging_%d" % lodging.id, "empty_contract.pdf")
        os.makedirs(os.path.split(full_path)[0], exist_ok=True)

        sid = transaction.savepoint()
        if request.GET.get("template_id"):
            lodging.contract_template_id = request.GET.get("template_id")
        generate_pdf(
            lodging.generate_empty_contract(request.scheme + "://" + request.META.get("HTTP_HOST", "localhost")),
            full_path,
        )
        transaction.savepoint_rollback(sid)

        if os.path.exists(full_path):
            with open(full_path, "rb") as fh:
                response = HttpResponse(fh.read(), content_type="application/pdf")
                response["Content-Disposition"] = "inline; filename=" + os.path.basename(full_path)
                return response
        raise Http404


class OwnerViewSet(viewsets.ModelViewSet):
    queryset = models.Owner.objects.all().order_by("name")
    serializer_class = OwnerSerializer


class HolidaysViewSet(viewsets.ModelViewSet):
    queryset = models.Holidays.objects.all().order_by("begin_date")
    serializer_class = HolidaysSerializer


class PricingViewSet(viewsets.ModelViewSet):
    queryset = models.Pricing.objects.all().order_by("name")
    serializer_class = PricingSerializer


class SeasonalVariationViewSet(viewsets.ModelViewSet):
    queryset = models.SeasonalVariation.objects.all().order_by("begin_date")
    serializer_class = SeasonalVariationSerializer


class ContractTemplateViewSet(viewsets.ModelViewSet):
    queryset = models.ContractTemplate.objects.all().order_by("name")
    serializer_class = ContractTemplateSerializer


class ContractViewSet(viewsets.ModelViewSet):
    queryset = models.Contract.objects.all().order_by("created")
    serializer_class = ContractSerializer
    filterset_fields = ["booking_id"]

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        contract = self.get_object()
        rel_path = contract.make_pdf_path()
        full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        if contract.pdf_created is None or contract.modified > contract.pdf_created or not os.path.exists(full_path):
            generate_pdf(contract.content, full_path)
            models.Contract.objects.filter(id=pk).update(pdf=rel_path, pdf_created=arrow.utcnow().isoformat(sep=" "))

        if os.path.exists(full_path):
            with open(full_path, "rb") as fh:
                response = HttpResponse(fh.read(), content_type="application/pdf")
                response["Content-Disposition"] = "inline; filename=" + os.path.basename(full_path)
                return response
        raise Http404


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = models.Payment.objects.all().order_by("date")
    serializer_class = PaymentExtSerializer
    filterset_fields = ["booking_id"]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = models.Service.objects.all().order_by("reference")
    serializer_class = ServiceSerializer
