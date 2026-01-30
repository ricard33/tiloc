import * as React from "react";
import { PropsWithChildren, useCallback, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Booking, BookingStatus } from "../types";
import { formatDate } from "../common/dateUtils";
import { useTranslation } from "react-i18next";
import { getBookingStatus, otaBranding, OtaIconProps } from "../common/statusUtils";
import { Divider, IconButton, Popover, PopoverProps, Stack, Tooltip } from "@mui/material";
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
import useMousePosition from "../common/useMousePosition";
import { useLocation } from "react-router-dom";
import { useBookingActions } from "../common/bookingActions";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { styled } from "@mui/material/styles";
import CalculateIcon from "@mui/icons-material/Calculate";
import BalanceIcon from "@mui/icons-material/Balance";
import GuestContact from "./GuestContact";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import BookingSourcesIcon  from "../assets/icones/booking-sources.svg?react";


const statusColors = {
  CHECKIN: "#3b4aff",
  CHECKOUT: "#f45b69"
};

const StyledDiv = styled("div")(({ theme: _ }) => ({
  display: "flex", alignItems: "center", flexWrap: "wrap"
}));


type Props = {
  booking: Booking;
  onOpenBooking?: (booking: Booking) => void,
  onEditBooking?: (booking: Booking) => void,
  onCancelBooking?: (booking: Booking) => void,
  bookingUpdated?: () => void,
};

export default function BookingTooltip(props: PropsWithChildren<Props>) {
  const {
    booking, bookingUpdated,
    onOpenBooking, onEditBooking, onCancelBooking,
    children
  } = props;
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<PopoverProps["anchorEl"]>(null);
  const id = anchorEl ? "virtual-element-popover" : undefined;
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
    deleteBooking
  } = useBookingActions(location.pathname.startsWith("/planning") ? "/planning" : undefined);

  const getBoundingClientRect = () => {
    return new DOMRect(mousePosition.x, mousePosition.y, 1, 10);
  };

  const handleOpenBooking = useCallback((booking: Booking) => {
    setAnchorEl(null);
    if (onOpenBooking) return onOpenBooking(booking);
    openBooking(booking);
  }, [onOpenBooking, openBooking]);

  const handleEditBooking = useCallback((booking: Booking) => {
    setAnchorEl(null);
    if (onEditBooking) return onEditBooking(booking);
    editBooking(booking);
  }, [editBooking, onEditBooking]);

  const handleCancelBooking = useCallback((booking: Booking) => {
    if (onCancelBooking) return onCancelBooking(booking);
    (booking.cancelled ? uncancelBooking(booking) : cancelBooking(booking)).then(() => {
      setAnchorEl(null);
      if (bookingUpdated) bookingUpdated();
    });
  }, [onCancelBooking, uncancelBooking, cancelBooking, bookingUpdated]);

  const handleDeleteBooking = useCallback((booking: Booking) => {
    (deleteBooking(booking)).then(() => {
      setAnchorEl(null);
      if (bookingUpdated) bookingUpdated();
    });
  }, [deleteBooking, bookingUpdated]);

  const handleClick = () => {
    console.log("item click", getBoundingClientRect());
    if (!anchorEl)
      setAnchorEl({ getBoundingClientRect, nodeType: 1 });
    else
      setAnchorEl(null);
  };

  return (
    <>
      <div onClick={() => handleClick()}>
        {children}
      </div>
      <Popover
        id={id}
        open={!!anchorEl}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setAnchorEl(null)}
      >
        <Grid2 container style={{ maxWidth: "360px", fontSize: 14, fontWeight: "300" }} spacing={1} margin={1}>
          <Grid2 xs={12}>
            <Typography variant="h5" component="div">
              {booking.guest_name}
            </Typography>
          </Grid2>
          <Grid2 xs={6}>
            <StyledDiv>
              <LoginIcon style={{ color: statusColors["CHECKIN"], marginRight: "10px" }} />
              <span style={{ fontSize: 14, fontWeight: "300" }}>
                {formatDate(booking.begin_date, "PP")}
              </span>
            </StyledDiv>
            <StyledDiv>
              {booking.arrival_details}
            </StyledDiv>
          </Grid2>
          <Grid2 xs={6}>
            <StyledDiv>
              <LogoutIcon style={{ color: statusColors["CHECKOUT"], marginRight: "10px" }} />
              <span style={{ fontSize: 14, fontWeight: "300" }}>
                {formatDate(booking.end_date, "PP")}
              </span>
            </StyledDiv>
            <StyledDiv>
              {booking.departure_details}
            </StyledDiv>
          </Grid2>
          <Grid2 xs={6}>
            <StyledDiv>
              <HomeOutlinedIcon
                fontSize="small" style={{ marginRight: "10px" }}
              />&nbsp;{booking.lodgings.map(l => l.name).join("+")}
            </StyledDiv>
          </Grid2>
          <Grid2 xs={6}>
            <StyledDiv
              style={{
                background: statusDisplay.bgColor, color: statusDisplay.color, height: "1.4rem"
              }}
            >
              {statusDisplay.icon}
              <span style={{ verticalAlign: "text-bottom" }}>
                {statusDisplay.label}
              </span>
            </StyledDiv>
          </Grid2>
          <Grid2 xs={6}>
            <Stack>
              <StyledDiv>
                <Groups2OutlinedIcon
                  fontSize="small" style={{ marginRight: "10px" }}
                />&nbsp;{booking.adults + booking.children + booking.babies}
              </StyledDiv>
              <StyledDiv>
                <BookingSourcesIcon
                  width="20px" style={{ marginRight: "10px" }}
                />&nbsp;{booking.source?.name}
              </StyledDiv>
            </Stack>
          </Grid2>
          <Grid2 xs={6}>
            <Tooltip
              title={<div>
                <div>{t("Rental:")}&nbsp;{DecimalPrecision.round(booking.price ?? 0)}&nbsp;€
                  ({DecimalPrecision.round(booking.daily_rate ?? 0)}&nbsp;€ / {t("night")})
                </div>
                <div>{t("Options:")}&nbsp;{DecimalPrecision.round(booking.price_with_options - booking.price!)}&nbsp;€</div>
                {booking.tourist_tax &&
                  <div>{t("Tourism tax:")}&nbsp;{DecimalPrecision.round(booking.tourist_tax)}&nbsp;€</div>}
              </div>}
            >
              <StyledDiv>
                <MonetizationOnOutlinedIcon
                  style={{ marginRight: "10px" }}
                  fontSize="small"
                />&nbsp;{DecimalPrecision.round(booking.price_with_options)}&nbsp;€
              </StyledDiv>
            </Tooltip>
            <StyledDiv title={t("Tourist tax")}>
              <CalculateIcon
                style={{ marginRight: "10px" }}
                fontSize="small"
              />&nbsp;{DecimalPrecision.round(booking.tourist_tax)}&nbsp;€
            </StyledDiv>
            {booking.left_to_pay > 0 &&
              <StyledDiv title={t("Left to pay")} style={{ color: "darkred" }}>
                <BalanceIcon
                  style={{ marginRight: "10px" }}
                  fontSize="small"
                />&nbsp;{DecimalPrecision.round(booking.left_to_pay)}&nbsp;€
              </StyledDiv>
            }
          </Grid2>
          <Grid2 xs={12}>
            <Stack direction={"row"} title={t("Contact")} spacing={2}>

              <ContactPhoneIcon fontSize="large" />
              <StyledDiv>
                <GuestContact value={booking.guest_contact} />
              </StyledDiv>
            </Stack>
          </Grid2>
          <Grid2 xs={12}>
            <Divider />
          </Grid2>
        </Grid2>
        <Stack direction={"row"} margin={1} spacing={1} justifyContent={"space-between"}>
          {
            confirmCancel ?
              <>
                <Button
                  startIcon={<EventBusyIcon />} size="small" color="error"
                  onClick={() => handleCancelBooking(booking)}
                >{t("Confirm cancellation")}</Button>
                <Button
                  startIcon={<ReplayIcon />} size="small" color="primary"
                  onClick={() => setConfirmCancel(false)}
                >{t("Discard")}</Button>
              </>
              :
              <>
                <Button
                  startIcon={<InfoOutlinedIcon />} size="small" color="primary"
                  onClick={() => handleOpenBooking(booking)}
                >{t("Details")}</Button>
                <Button
                  startIcon={<EditNoteOutlinedIcon />} size="small"
                  onClick={() => handleEditBooking(booking)}
                >{t("Modify")}</Button>
                {
                  booking.cancelled ?
                    <>
                      <Button
                        startIcon={<EventAvailableIcon />} size="small" color="success"
                        onClick={() => handleCancelBooking(booking)}
                      >{t("Book again")}</Button>
                      <IconButton
                        title={t("Definitively delete booking")} color="error"
                        onClick={() => handleDeleteBooking(booking)}
                      ><DeleteIcon /></IconButton>
                    </>
                    :
                    <Button
                      startIcon={<EventBusyIcon />} size="small" color="error"
                      onClick={() => setConfirmCancel(true)}
                    >{t("Cancel")}</Button>
                }
              </>
          }
        </Stack>
      </Popover>
    </>

  );
}
