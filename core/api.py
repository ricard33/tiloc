import logging
import os

import arrow
import jinja2
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import F, Min, Value
from django.http import Http404, HttpResponse
from django.utils import timezone
from django.utils.translation import gettext as _
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
from .filters import BookingFilter, CommentFilter, PaymentFilter
from .pagination import LargeResultsSetPagination
from .pdf_tools import generate_pdf
from .permissions import IsSuperUserPermission
from .serializers import (
    AccountSerializer,
    BookingChannelSerializer,
    BookingChannelSyncSerializer,
    BookingNoPriceSerializer,
    BookingSerializer,
    BookingStatusSerializer,
    CommentSerializer,
    ContractSerializer,
    ContractTemplateSerializer,
    CreateUserSerializer,
    GuestSerializer,
    HolidaysSerializer,
    LodgingSerializer,
    LoginUserSerializer,
    NextEventSerializer,
    PaymentSerializer,
    PricingSerializer,
    PropertySerializer,
    SeasonalVariationSerializer,
    ServiceSerializer,
    UserSerializer,
)

logger = logging.getLogger("api")


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
        user = authenticate(
            request, username=serializer.validated_data["email"], password=serializer.validated_data["password"]
        )
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


class AccountViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperUserPermission]
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
        request.user.account.save()

        return Response(data={"result": _("Request of deletion of all your account's data successfully sent.")},
                        status=200)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows user(s) to be viewed/listed.
    """

    queryset = models.User.objects.all()
    # filter_class = filters.UserFilter
    serializer_class = UserSerializer
    ordering_fields = '__all__'

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class CurrentUserAPI(generics.RetrieveAPIView):
    # authentication_classes = (TokenAuthentication,)
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = UserSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

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

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)

    def get_serializer_class(self):
        if not self.request.user.has_perm("core.view_prices"):
            return BookingNoPriceSerializer
        return BookingSerializer

    def perform_destroy(self, instance):
        instance.deleted = True
        instance.save()

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
            self.get_queryset().filter(
                begin_date__gte=timezone.now(), cancelled=False, deleted=False
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
            self.get_queryset().filter(end_date__gte=timezone.now(), cancelled=False, deleted=False)
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

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


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


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = models.Property.objects.all().order_by("name")
    serializer_class = PropertySerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class HolidaysViewSet(viewsets.ModelViewSet):
    queryset = models.Holidays.objects.all().order_by("begin_date")
    serializer_class = HolidaysSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class PricingViewSet(viewsets.ModelViewSet):
    queryset = models.Pricing.objects.all().order_by("name")
    serializer_class = PricingSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class SeasonalVariationViewSet(viewsets.ModelViewSet):
    queryset = models.SeasonalVariation.objects.all().order_by("begin_date")
    serializer_class = SeasonalVariationSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


class ContractTemplateViewSet(viewsets.ModelViewSet):
    queryset = models.ContractTemplate.objects.all().order_by("name")
    serializer_class = ContractTemplateSerializer

    def get_queryset(self):
        return self.queryset.for_user(self.request.user)


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
