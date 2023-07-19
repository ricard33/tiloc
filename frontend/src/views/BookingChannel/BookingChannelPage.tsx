import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateBookingChannelMutation, useDeleteBookingChannelMutation,
  useGetBookingChannelQuery, useListBookingStatusesQuery,
  useUpdateBookingChannelMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { BookingChannelForm } from "./BookingChannelForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";
import { BookingChannel, User } from "../../types";

export function BookingChannelPage() {
  const { t } = useTranslation();
  let { bookingChannelId } = useParams();
  const {
    data: bookingChannel,
    isLoading
  } = useGetBookingChannelQuery(Number(bookingChannelId), { skip: typeof bookingChannelId === "undefined" });
  const [createBookingChannel] = useCreateBookingChannelMutation();
  const [updateBookingChannel] = useUpdateBookingChannelMutation();
  const [deleteBookingChannel] = useDeleteBookingChannelMutation();
  const { data: bookingStatuses, isLoading: isStatusLoading } = useListBookingStatusesQuery();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_bookingchannel");
  const canDelete = user.permissions.includes("core.delete_bookingchannel");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (bookingChannel: BookingChannel) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete booking channel: {{ name }}", {
        name: bookingChannel.name,
      }),
      description: t("Do you really want to permanently delete this booking channel?")
    })
      .then(() => {
        return deleteBookingChannel(bookingChannel.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting booking channel", error);
            showError(t("Impossible to delete the booking channel: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking channel deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: BookingChannel) => {
    // console.log(data);
    if(!bookingChannel || !bookingChannel.id) {
      createBookingChannel(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during booking channel creation", error);
          showError(t("Impossible to create booking channel: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Booking channel added"));
          navigate(-1)
        }
      });
    } else {
      updateBookingChannel({ ...bookingChannel, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during booking channel change", error);
          showError(t("Impossible to modify booking channel: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Booking channel changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading || isStatusLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <BookingChannelForm
        bookingChannel={bookingChannel}
        bookingStatuses={bookingStatuses!}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  )
  ;
}
