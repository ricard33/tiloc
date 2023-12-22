import logging
from typing import List

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils.translation import gettext as _

from core import models
from notifier.shortcuts import send_notification

logger = logging.getLogger("signals")


def get_current_user():
    import inspect

    for frame_record in inspect.stack():
        if frame_record[3] == "get_response":
            request = frame_record[0].f_locals["request"]
            return request.user
    return None


def get_listening_users_for_lodging(lodging, current_user):
    current_user_id = current_user and current_user.id or 0
    return (
        lodging.account.user_set.filter(groups__name="administrator")
        .exclude(id=current_user_id)
        .union(lodging.users.exclude(id=current_user_id))
    )


@receiver(post_save, sender=models.Booking)
def on_booking_saved(sender, instance: models.Booking, created: bool, update_fields: List[str], **kwargs):
    lodging = instance.lodging
    user = get_current_user()
    users = get_listening_users_for_lodging(lodging, user)
    if created:
        logger.info("booking_created [%s] %s" % (instance.id, instance))
        models.Activity.objects.create(type=models.Activity.ActivityType.add_booking, author=user, booking=instance)
        send_notification(
            "booking-added",
            users,
            _("New booking: [%(booking)s]") % {"booking": instance},
            "/bookings/%d" % instance.id,
            context={"booking": instance},
        )
    else:
        logger.info("booking_modified [%s] %s" % (instance.id, instance))
        if update_fields:
            if "cancelled" in update_fields:
                if instance.cancelled:
                    models.Activity.objects.create(
                        type=models.Activity.ActivityType.cancel_booking, author=user, booking=instance
                    )
                    send_notification(
                        "booking-canceled",
                        users,
                        _("Booking [%(booking)s] has been canceled") % {"booking": instance},
                        "/bookings/%d" % instance.id,
                        context={"booking": instance},
                    )
                else:
                    models.Activity.objects.create(
                        type=models.Activity.ActivityType.uncancel_booking, author=user, booking=instance
                    )
                    send_notification(
                        "booking-uncanceled",
                        users,
                        _("Booking [%(booking)s] has been uncanceled") % {"booking": instance},
                        "/bookings/%d" % instance.id,
                        context={"booking": instance},
                    )
            elif "deleted" in update_fields:
                models.Activity.objects.create(
                    type=models.Activity.ActivityType.delete_booking, author=user, booking=instance
                )
                if instance.deleted:
                    send_notification(
                        "booking-deleted",
                        users,
                        _("Booking [%(booking)s] has been deleted") % {"booking": instance},
                        "/bookings/%d" % instance.id,
                        context={"booking": instance},
                    )
            else:
                models.Activity.objects.create(
                    type=models.Activity.ActivityType.modify_booking, author=user, booking=instance
                )
                send_notification(
                    "booking-modified",
                    users,
                    _("Booking [%(booking)s] has been modified") % {"booking": instance},
                    "/bookings/%d" % instance.id,
                    context={"booking": instance},
                )


@receiver(post_save, sender=models.Comment)
def on_comment_saved(sender, instance: models.Comment, created: bool, update_fields: List[str], **kwargs):
    lodging = instance.booking.lodging
    user = get_current_user()
    users = get_listening_users_for_lodging(lodging, user)
    if created:
        logger.info("comment_created [%s] %s" % (instance.id, instance))
        models.Activity.objects.create(
            type=models.Activity.ActivityType.add_comment, author=user, booking=instance.booking
        )
        send_notification(
            "comment-added",
            users,
            _("New comment on booking [%(booking)s]") % {"booking": instance.booking},
            "/bookings/%d" % instance.booking.id,
            context={"comment": instance},
        )
    else:
        logger.info("comment_modified [%s] %s" % (instance.id, instance))
        models.Activity.objects.create(
            type=models.Activity.ActivityType.modify_comment, author=user, booking=instance.booking
        )
        send_notification(
            "comment-modified",
            users,
            _("Comment has been modified on booking %(booking)s") % {"booking": instance.booking},
            "/bookings/%d" % instance.id,
            context={"comment": instance},
        )


@receiver(post_delete, sender=models.Comment)
def on_comment_deleted(sender, instance: models.Comment, **kwargs):
    lodging = instance.booking.lodging
    user = get_current_user()
    users = get_listening_users_for_lodging(lodging, user)
    logger.info("comment_deleted [%s] %s" % (instance.id, instance))
    models.Activity.objects.create(
        type=models.Activity.ActivityType.delete_comment, author=user, booking=instance.booking
    )
    send_notification(
        "comment-deleted",
        users,
        _("Comment has been deleted on booking %(booking)s") % {"booking": instance.booking},
        "/bookings/%d" % instance.booking.id,
        context={"comment": instance},
    )


@receiver(post_save, sender=models.Subscription)
def on_subscription_saved(sender, instance: models.Subscription, created: bool, update_fields: List[str], **kwargs):
    send_notification(
        created and "subscription-added" or "subscription-modified",
        models.User.objects.filter(is_staff=True),
        _("New subscription: [%(subscription)s]") % {"subscription": instance},
        context={"subscription": instance, "account": instance.customer, "user": get_current_user()},
    )
