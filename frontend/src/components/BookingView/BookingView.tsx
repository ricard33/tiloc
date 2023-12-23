import React from "react";
import { useTranslation } from "react-i18next";
import { Booking, Service } from "../../types";
import {
  Alert,
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useWindowDimensions from "../../common/windowDimensions";
import BookingQuickView from "../BookingQuickView";
import BookingActions from "../BookingActions";
import { formatDate } from "../../common/dateUtils";
import { useAlert } from "../../common/alertUtils";
import { formatCurrency } from "../../common/intlUtils";
import { getBookingStatus } from "../../common/statusUtils";
import CloseIcon from "@mui/icons-material/Close";


type BookingViewProps = {
  booking: Booking;
  onClose: () => void;
  onEdit: () => void;
  onCancelBooking: () => void;
  onUncancelBooking: () => void;
  onOpenContract?: (booking: Booking) => void;
};

const BookingView: React.FunctionComponent<BookingViewProps> = ({
  ...props
}: BookingViewProps) => {
  const { booking, onClose, onEdit, onCancelBooking, onUncancelBooking, onOpenContract } = props;
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
      t("Status:") + " " + getBookingStatus(booking.status).getLabel(t),
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

  const fullScreen = width < 800;

  return (
    <Dialog
      className="booking-dialog"
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth={false}
      fullWidth
      fullScreen={fullScreen}
    >
      {fullScreen ?
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {t("Booking details")}
            </Typography>
            {booking.cancelled &&
              <span style={{ fontSize: "small", color: "red", flex: 1 }}>{t("CANCELLED")}</span>
            }
            <BookingActions
              booking={booking} onEdit={onEdit}
              onCancelBooking={onCancelBooking} onUncancelBooking={onUncancelBooking}
              onOpenContract={onOpenContract}
              primaryColor="inherit"
            />
          </Toolbar>
        </AppBar>
        :
        <DialogTitle id="simple-dialog-title" sx={{/*booking.cancelled ? { bgcolor: "warning.main" } : {}*/ }}>
          <Grid justifyContent="space-between" container spacing={4}>
            <Grid item xs={6}>
              {t("Booking details")}
              {booking.cancelled &&
                <Alert severity="warning" sx={{ display: "inline-flex", marginLeft: 2 }}>{t("CANCELED")}</Alert>
              }
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <IconButton aria-label="copy" title={t("Copy booking to clipboard")} onClick={() => copyToClipboard()}>
                <ContentCopyIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
      }
      <DialogContent dividers sx={{ fontSize: "smaller" }}>
        <BookingQuickView booking={booking} />
      </DialogContent>
      {!fullScreen &&
        <DialogActions>
          <Stack direction="row" justifyContent={"flex-end"}>
            <Button type="button" onClick={onClose}>{t("Close")}</Button>
            <BookingActions
              booking={booking} onEdit={onEdit}
              onCancelBooking={onCancelBooking} onUncancelBooking={onUncancelBooking}
              onOpenContract={onOpenContract}
            />
            {width < 1100 && <div style={{width: "50px"}} />}
          </Stack>
        </DialogActions>
      }
    </Dialog>
  );
};

export default BookingView;

