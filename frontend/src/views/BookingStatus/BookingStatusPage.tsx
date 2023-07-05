import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateBookingStatusMutation,
  useDeleteBookingStatusMutation,
  useGetBookingStatusQuery,
  useUpdateBookingStatusMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { BookingStatusForm } from "./BookingStatusForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { BookingStatus, User } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";

export function BookingStatusPage() {
  const { t } = useTranslation();
  let { bookingStatusId } = useParams();

  const {
    data: bookingStatus,
    isLoading
  } = useGetBookingStatusQuery(Number(bookingStatusId), { skip: typeof bookingStatusId === "undefined" });
  const [createBookingStatus] = useCreateBookingStatusMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [deleteBookingStatus] = useDeleteBookingStatusMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_bookingstatus");
  const canDelete = user.permissions.includes("core.delete_bookingstatus");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (bookingStatus: BookingStatus) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete booking status: {{ name }}", {
        name: bookingStatus.name,
      }),
      description: t("Do you really want to permanently delete this booking status?")
    })
      .then(() => {
        return deleteBookingStatus(bookingStatus.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting booking status", error);
            showError(t("Impossible to delete the booking status: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking status deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: BookingStatus) => {
    // console.log(data);
    if (!bookingStatus || !bookingStatus.id) {
      createBookingStatus(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during booking status creation", error);
          showError(t("Impossible to create booking status: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Booking status added"));
          navigate(-1);
        }
      });
    } else {
      updateBookingStatus({ ...bookingStatus, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during booking status change", error);
          showError(t("Impossible to modify booking status: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Booking status changed"));
          navigate(-1);
        }
      });
    }
  };

  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <BookingStatusForm
        bookingStatus={bookingStatus}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  );
}
