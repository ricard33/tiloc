import React from "react";
import { useTranslation } from "react-i18next";
import { Booking, Service } from "../../types";
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useWindowDimensions from "../../common/windowDimensions";
import BookingQuickView from "../BookingQuickView";
import BookingActions from "../BookingActions";
import { formatDate } from "../../common/dateUtils";
import { useAlert } from "../../common/alertUtils";
import { formatCurrency } from "../../common/intlUtils";


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
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { showError, showSuccess } = useAlert();

  const copyToClipboard = () => {
    const bookingStr = [
      t("Guest:"),
      booking.guest_name,
      booking.guest_address,
      booking.guest_contact,
      t("Lodging:") + " " + booking.lodging.name,
      t("Status:") + " " + booking.status.name,
      t("Price:") + " " + formatCurrency(booking.price_with_options),
      t("Check-in:") + " " + formatDate(booking.begin_date, "PPPP"),
      t("Check-out:") + " " + formatDate(booking.end_date, "PPPP"),
      t("Length of stay:") + " " + formatDate(booking.duration, "PPPP"),
      t("Arrival:") + " " + booking.arrival_details,
      t("Adults:") + " " + booking.adults,
      ...(booking.children ? [t("Children:") + " " + booking.children] : []),
      ...(booking.babies ? [t("Babies:") + " " + booking.babies] : []),
      ...(booking.options.length > 0 ?
        [t("Options:") + "\n    " + booking.options.map((option: Service) => (option.designation)).join("\n    ")]
        : [])

    ].join("\n");
    navigator.clipboard.writeText(bookingStr).then(function() {
      showSuccess(t("Copied to clipboard"));
    }, function() {
      console.warn("FAILED to copy to clipboard");
      showError(t("Failed to copy booking data to clipboard!"));
    });
  };

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
        <Grid justifyContent="space-between" container spacing={4}>
          <Grid item xs={6}>
            {t("Booking details")}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: "right" }}>
            <IconButton aria-label="copy" title={t("Copy booking to clipboard")}>
              <ContentCopyIcon onClick={() => copyToClipboard()} />
            </IconButton>
          </Grid>
        </Grid>
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

