from django.db import migrations

# Kept as a literal list rather than read from `Notification.backends`: that M2M is only
# attached by `core/notifications.py` via the `post_migrate` signal, which runs after every
# migration in this `migrate` command has already applied - including this one.
CUSTOMER_NOTIFICATION_NAMES = [
    "booking-added",
    "booking-modified",
    "booking-canceled",
    "booking-uncanceled",
    "booking-deleted",
    "comment-added",
    "comment-modified",
    "comment-deleted",
    "trial_will_end",
]


def seed_email_off(apps, schema_editor):
    User = apps.get_model("core", "User")
    Notification = apps.get_model("notifier", "Notification")
    Backend = apps.get_model("notifier", "Backend")
    UserPrefs = apps.get_model("notifier", "UserPrefs")

    try:
        email_backend = Backend.objects.get(name="email")
    except Backend.DoesNotExist:
        # notifier's post_migrate hasn't created it yet (e.g. a fresh/test database) - there
        # are no existing users to migrate anyway, the new-user signal covers them going forward
        return

    notifications = list(Notification.objects.filter(name__in=CUSTOMER_NOTIFICATION_NAMES))
    if not notifications:
        return

    existing = set(
        UserPrefs.objects.filter(backend=email_backend, notification__in=notifications).values_list(
            "user_id", "notification_id"
        )
    )
    to_create = [
        UserPrefs(user_id=user_id, notification=notification, backend=email_backend, notify=False)
        for user_id in User.objects.values_list("id", flat=True)
        for notification in notifications
        if (user_id, notification.pk) not in existing
    ]
    UserPrefs.objects.bulk_create(to_create, batch_size=500)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0030_advanced_pricing"),
        ("notifier", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_email_off, migrations.RunPython.noop),
    ]
