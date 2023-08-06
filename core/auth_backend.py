from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # auth.forms.AuthenticationForm expect signature `(request, username, password)`
        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(Q(account__isnull=True) | Q(account__is_active=True), email=username)
        except UserModel.DoesNotExist:
            return None
        else:
            if user.check_password(password):
                return user
        return None
