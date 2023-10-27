from django.contrib.auth import logout
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import BasePermission, DjangoModelPermissions, DjangoObjectPermissions


class TilocPermissions(DjangoObjectPermissions):
    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": [],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }

    def has_permission(self, request, view):
        if request.user and getattr(request.user, "account", None) and not request.user.account.is_active:
            logout(request)
            raise NotAuthenticated
        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        queryset = self._queryset(view)
        model_cls = queryset.model
        user = request.user
        account_path = getattr(model_cls, "_account_qs_path", "account")
        if hasattr(model_cls, account_path) and getattr(obj, account_path) is None:
            # can only be modified/deleted by superuser
            if not user.is_superuser:
                return False
        return super().has_object_permission(request, view, obj)


class IsCompanyAdminPermissions(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perms(["core.administrator"])

    def has_object_permission(self, request, view, obj):
        return request.user.has_perms(["core.administrator"])


class IsSuperUserPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_superuser
