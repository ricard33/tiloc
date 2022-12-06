import React from "react";
import { useTranslation } from "react-i18next";
import { Booking, User } from "../../types";
import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import useWindowDimensions from "../../common/windowDimensions";
import BookingQuickView from "../BookingQuickView";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import BookingActions from "../BookingActions";


type BookingViewProps = {
  booking: Booking;
  onClose: () => void;
  onEdit: () => void;
  onCancelBooking: () => void;
  onUncancelBooking: () => void;
  onDelete: () => void;
  onOpenContract?: (booking: Booking) => void;
};

const BookingView: React.FunctionComponent<BookingViewProps> = ({
  ...props
}: BookingViewProps) => {
  const { booking, onClose, onEdit, onCancelBooking, onUncancelBooking, onDelete, onOpenContract } = props;
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  return (
    <Dialog
      className="booking-dialog"
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth={width < 1280 ? "sm" : "lg"}
      fullScreen={width < 600}
    >
      <DialogTitle id="simple-dialog-title">
        {t("Booking details")}
      </DialogTitle>
      <DialogContent dividers>
        <BookingQuickView booking={booking} />
      </DialogContent>
      <DialogActions>
        <BookingActions
          booking={booking} onClose={onClose} onDelete={onDelete}
          onEdit={onEdit}
          onOpenContract={onOpenContract}
          onCancelBooking={onCancelBooking}
          onUncancelBooking={onUncancelBooking}
        />
      </DialogActions>
    </Dialog>
  );
};

export default BookingView;
