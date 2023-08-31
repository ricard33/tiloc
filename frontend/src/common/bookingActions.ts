import { Booking, User } from "../types";
import { fetchErrorDecode } from "./apiUtils";
import { useDeleteBookingMutation, useUpdateBookingMutation } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useAlert } from "./alertUtils";
import { useConfirm } from "../libs/MuiConfirm";
import { useTranslation } from "react-i18next";


export const useBookingActions = () => {
  const [updateBooking] = useUpdateBookingMutation();
  const [deleteBooking] = useDeleteBookingMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const { t } = useTranslation();

  const onCancelBooking = (booking: Booking) => {
    if (!canEdit) return;
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

  const onUncancelBooking = (booking: Booking) => {
    if (!canEdit) return;
    updateBooking({ ...booking, cancelled: false }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error uncancelling booking", error);
        showError(t("Impossible to uncancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking uncancelled"));
      }
    });
  };

  const onDeleteBooking = async (booking: Booking) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging.name
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        return deleteBooking(booking).then((result) => {
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
    onCancelBooking,
    onUncancelBooking,
    onDeleteBooking
  };
};
