from notifier.backends import BaseBackend


class NoopBackend(BaseBackend):
    name = "noop"
    display_name = "NoOp"
    description = "Just to collect notifications to be displayed in frontend"

    def send(self, user, context=None):
        super(NoopBackend, self).send(user, context)
        return True
