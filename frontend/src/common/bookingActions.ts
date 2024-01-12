import { Booking, User } from "../types";
import { fetchErrorDecode } from "./apiUtils";
import { useDeleteBookingMutation, useUpdateBookingMutation } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useAlert } from "./alertUtils";
import { useConfirm } from "../libs/MuiConfirm";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";


export const useBookingActions = (baseUrl = "/bookings") => {
  const [updateBooking] = useUpdateBookingMutation();
  const [deleteBookingMutation] = useDeleteBookingMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openBooking = useCallback((booking: Booking) => {
    navigate(`${baseUrl}/${booking.id}`);
  }, [baseUrl, navigate]);

  const editBooking = useCallback((booking: Booking) => {
    navigate(`${baseUrl}/${booking.id}`, { state: { edit: true } });
  }, [baseUrl, navigate]);


  const cancelBooking = async (booking: Booking) => {
    if (!canEdit) throw Error("prohibited");
    await confirm({
      title: t("Confirmation required"),
      description: t("By cancelling this booking, the dates will become available on any connected portals. Do you wish to continue?\n"),
      confirmationText: t("Yes"),
      cancellationText: t("Discard")
    });
    updateBooking({ ...booking, cancelled: true }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error canceling booking", error);
        showError(t("Impossible to cancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking cancelled"));
      }
    });
  };

  const uncancelBooking = async (booking: Booking) => {
    if (!canEdit) throw Error("prohibited");
    let result = await updateBooking({ ...booking, cancelled: false });
    if ((result as any).error) {
      const error = (result as any).error;
      console.error("Error uncancelling booking", error);
      showError(t("Impossible to reactivate booking: ") + fetchErrorDecode(error));
    } else {
      showSuccess(t("Booking modified"));
    }
  };

  const deleteBooking = async (booking: Booking) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodgings.map(l => l.name).join("+")
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        return deleteBookingMutation(booking).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting booking", error);
            showError(t("Impossible to delete the booking: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking deleted"));
          }
        });
      })
      .catch(() => { /* ... */
      });
  };

  return {
    openBooking,
    editBooking,
    cancelBooking: cancelBooking,
    uncancelBooking: uncancelBooking,
    deleteBooking: deleteBooking
  };
};
