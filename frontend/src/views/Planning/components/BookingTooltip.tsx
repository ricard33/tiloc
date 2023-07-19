import * as React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Booking } from "../../../types";
import { formatDate } from "../../../common/dateUtils";
import { useTranslation } from "react-i18next";

type Props = {
  booking: Booking;
  onOpenBooking?: (booking: Booking) => void,
};

export default function BookingTooltip(props: Props) {
  const { booking, onOpenBooking } = props;
  const { t } = useTranslation();
  return (
    <>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
        {formatDate(booking.begin_date, "PPPP")} &rarr; {formatDate(booking.end_date, "PPPP")}
      </Typography>
      <Typography variant="h5" component="div">
        {booking.guest_name}
      </Typography>
      <Typography sx={{ mb: 1.5 }} color="text.secondary">
        {booking.lodging ? booking.lodging.name : t("Cancellation / Waiting")}
      </Typography>
      <Typography variant="body2" style={{ background: booking.status.color }}>
        {booking.status.name}
      </Typography>
      {onOpenBooking &&
        <Button size="small" onClick={() => onOpenBooking(booking)}>{t("Display")}</Button>
      }
    </>
  );
}
