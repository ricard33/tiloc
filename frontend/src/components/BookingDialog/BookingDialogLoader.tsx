import React from "react";
import { Booking } from "../../types";
import { BookingDialog } from "../index";
import { Backdrop, CircularProgress } from "@mui/material";
import {
  useAllGuestsQuery,
  useListLodgingsQuery
} from "../../services/api";

type BookingDialogLoaderProps = {
  booking: Booking;
  onClose: (submittedBooking: Booking) => void;
  onOpenContract: (submittedBooking: Booking) => void;
};

const BookingDialogLoader: React.FunctionComponent<BookingDialogLoaderProps> = (props: BookingDialogLoaderProps) => {
  const { booking, onClose, onOpenContract } = props;
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: allGuests } = useAllGuestsQuery();

  if (booking && lodgings && allGuests)
    return (
      <BookingDialog
        booking={booking}
        lodgings={lodgings}
        guests={allGuests}
        onClose={onClose}
        onOpenContract={onOpenContract}
      />
    );
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default BookingDialogLoader;
