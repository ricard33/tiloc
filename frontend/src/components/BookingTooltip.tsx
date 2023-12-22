import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Booking, BookingStatus } from "../types";
import { formatDate } from "../common/dateUtils";
import { useTranslation } from "react-i18next";
import { getBookingStatus, otaBranding, OtaIconProps } from "../common/statusUtils";
import { Divider, Popover, PopoverProps } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import { DecimalPrecision } from "../common/priceUtils";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ReplayIcon from "@mui/icons-material/Replay";
import { ModalProps } from "@mui/material/Modal";
import useMousePosition from "../common/useMousePosition";
import { useLocation } from "react-router-dom";
import { useBookingActions } from "../common/bookingActions";

const statusColors = {
  CHECKIN: "#3b4aff",
  CHECKOUT: "#f45b69"
};

type Props = {
  booking: Booking;
  onOpenBooking?: (booking: Booking) => void,
  onEditBooking?: (booking: Booking) => void,
  onCancelBooking?: (booking: Booking) => void,
  /**
   * If `true`, the component is shown.
   */
  open: boolean;
  onClose: () => void
};

export default function BookingTooltip(props: Props) {
  const {
    booking, open, onClose,
    onOpenBooking, onEditBooking, onCancelBooking
  } = props;
  const { t } = useTranslation();
  // const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<PopoverProps["anchorEl"]>(null);
  const id = open ? "virtual-element-popover" : undefined;
  const status = getBookingStatus(booking.status);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const statusDisplay: OtaIconProps & {
    label: string
  } = status.name === BookingStatus.External.name && booking.source && booking.source.name in otaBranding
    ? { label: booking.source.name, ...otaBranding[booking.source.name] }
    : { label: status.getLabel(t), bgColor: status.color };
  const mousePosition = useMousePosition();
  const location = useLocation();
  const {
    openBooking,
    editBooking,
    cancelBooking,
    uncancelBooking,
  } = useBookingActions(location.pathname.startsWith("/planning") ? "/planning" : undefined );

  useEffect(() => {
    if (mousePosition.x && open) {

      const getBoundingClientRect = () => {
        return new DOMRect(mousePosition.x, mousePosition.y, 1, 10);
      };
      setAnchorEl({ getBoundingClientRect, nodeType: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenBooking = useCallback((booking: Booking) => {
    if (onOpenBooking) return onOpenBooking(booking);
    openBooking(booking);
  }, [onOpenBooking, openBooking]);

  const handleEditBooking = useCallback((booking: Booking) => {
    if (onEditBooking) return onEditBooking(booking);
    editBooking(booking);
  }, [editBooking, onEditBooking]);

  const handleCancelBooking = useCallback((booking: Booking) => {
    if (onCancelBooking) return onCancelBooking(booking);
    if (booking.cancelled)
      uncancelBooking(booking);
    else
      cancelBooking(booking);
    onClose();
  }, [onCancelBooking, uncancelBooking, cancelBooking, onClose]);

  if (!anchorEl) {
    return <></>;
  }

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={() => onClose()}
    >
      <Grid2 container style={{ maxWidth: "360px", fontSize: 14, fontWeight: "300" }} spacing={1} margin={1}>
        <Grid2 xs={12}>
          <Typography variant="h5" component="div">
            {booking.guest_name}
          </Typography>
        </Grid2>
        <Grid2 xs={6}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <LoginIcon style={{ color: statusColors["CHECKIN"], marginRight: "10px" }} />
            <span style={{ fontSize: 14, fontWeight: "300" }}>
              {formatDate(booking.begin_date, "PP")}
            </span>
          </div>
        </Grid2>
        <Grid2 xs={6}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <LogoutIcon style={{ color: statusColors["CHECKOUT"], marginRight: "10px" }} />
            <span style={{ fontSize: 14, fontWeight: "300" }}>
              {formatDate(booking.end_date, "PP")}
            </span>
          </div>
        </Grid2>
        <Grid2 xs={6}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <Groups2OutlinedIcon
              fontSize="small" style={{ marginRight: "10px" }}
            />&nbsp;{booking.adults + booking.children + booking.babies}
          </div>
        </Grid2>
        <Grid2 xs={6}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <MonetizationOnOutlinedIcon
              style={{ marginRight: "10px" }}
              fontSize="small"
            />&nbsp;{DecimalPrecision.round(booking.price_with_options)}&nbsp;€
          </div>
        </Grid2>
        <Grid2 xs={6}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <HomeOutlinedIcon fontSize="small" style={{ marginRight: "10px" }} />&nbsp;{booking.lodging.name}
          </div>
        </Grid2>
        <Grid2 xs={6}>
          <div
            style={{
              background: statusDisplay.bgColor, color: statusDisplay.color, height: "1.4rem",
              display: "flex", alignItems: "center", flexWrap: "wrap"
            }}
          >
            {statusDisplay.icon}
            <span style={{ verticalAlign: "text-bottom" }}>
              {statusDisplay.label}
            </span>
          </div>
        </Grid2>
        <Grid2 xs={12}>
          <Divider />
        </Grid2>

        {
          confirmCancel ?
            <>
              <Grid2 xs={8}>
                <Button
                  startIcon={<EventBusyIcon />} size="small" color="error"
                  onClick={() => handleCancelBooking(booking)}
                >{t("Confirm cancellation")}</Button>
              </Grid2>
              <Grid2 xs={4}>
                <Button
                  startIcon={<ReplayIcon />} size="small" color="primary"
                  onClick={() => setConfirmCancel(false)}
                >{t("Discard")}</Button>
              </Grid2>
            </>
            :
            <>
              <Grid2 xs={4}>
                <Button
                  startIcon={<InfoOutlinedIcon />} size="small" color="primary"
                  onClick={() => handleOpenBooking(booking)}
                >{t("Details")}</Button>
              </Grid2>
              <Grid2 xs={4}>
                <Button
                  startIcon={<EditNoteOutlinedIcon />} size="small"
                  onClick={() => handleEditBooking(booking)}
                >{t("Modify")}</Button>
              </Grid2>
              <Grid2 xs={4}>
                {
                  booking.cancelled ?
                    <Button
                      startIcon={<EventAvailableIcon />} size="small" color="success"
                      onClick={() => handleCancelBooking(booking)}
                    >{t("Book again")}</Button>
                    :
                    <Button
                      startIcon={<EventBusyIcon />} size="small" color="error"
                      onClick={() => setConfirmCancel(true)}
                    >{t("Cancel")}</Button>
                }
              </Grid2>
            </>
        }
      </Grid2>
    </Popover>
  );
}
