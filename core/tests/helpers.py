from knox.models import AuthToken


def force_login(user, client=None):
    if client:
        client.force_login(user)
    instance, token = AuthToken.objects.create(user)
    return {"HTTP_AUTHORIZATION": "Token " + token}
