import * as React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Booking, BookingStatus } from "../../../types";
import { formatDate } from "../../../common/dateUtils";
import { useTranslation } from "react-i18next";
import { getBookingStatus, otaBranding } from "../../../common/statusUtils";

type Props = {
  booking: Booking;
  onOpenBooking?: (booking: Booking) => void,
};

export default function BookingTooltip(props: Props) {
  const { booking, onOpenBooking } = props;
  const { t } = useTranslation();
  const status = getBookingStatus(booking.status);
  const statusDisplay = status.name === BookingStatus.External.name && booking.source && booking.source.name in otaBranding
    ? { label: booking.source.name, ...otaBranding[booking.source.name] }
    : { label: status.getLabel(t), bgColor: status.color };
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
      <Typography variant="body2" style={{ background: statusDisplay.bgColor, color: statusDisplay.color, height: "1.4rem" }}>
        {statusDisplay.icon}
        <span style={{ verticalAlign: "text-bottom" }}>
          {statusDisplay.label}
        </span>
      </Typography>
      {onOpenBooking &&
        <Button size="small" onClick={() => onOpenBooking(booking)}>{t("Display")}</Button>
      }
    </>
  );
}
