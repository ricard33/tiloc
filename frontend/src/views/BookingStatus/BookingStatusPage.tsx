// @ts-nocheck
import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateBookingStatusMutation,
  useGetBookingStatusQuery,
  useUpdateBookingStatusMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { BookingStatusForm } from "./BookingStatusForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

export function BookingStatusPage() {
  const { t } = useTranslation();
  let { bookingStatusId } = useParams();
  const {
    data: bookingStatus,
    isLoading
  } = useGetBookingStatusQuery(Number(bookingStatusId), { skip: typeof bookingStatusId === "undefined" });
  const [createBookingStatus] = useCreateBookingStatusMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();


  const onCancel = () => {
    navigate(-1);
  };

  const onSubmit = (data) => {
    // console.log(data);
    if(!bookingStatus || !bookingStatus.id) {
      createBookingStatus(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during bookingStatus creation", error);
          showError(t("Impossible to create bookingStatus: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("BookingStatus added"));
          navigate(-1)
        }
      });
    } else {
      updateBookingStatus({ ...bookingStatus, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during payment change", error);
          showError(t("Impossible to modify bookingStatus: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("BookingStatus changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  return (
    <Page>
      <BookingStatusForm bookingStatus={bookingStatus} onSubmit={onSubmit} onCancel={onCancel} />
    </Page>
  )
  ;
}
