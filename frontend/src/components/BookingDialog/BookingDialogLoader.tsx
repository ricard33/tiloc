import React, { useState } from "react";
import { Booking } from "../../types";
import { BookingDialog } from "../index";
import { Backdrop, CircularProgress } from "@mui/material";
import {
  useAllGuestsQuery,
  useListLodgingsQuery
} from "../../services/api";
import BookingView from "../BookingView";

type BookingDialogLoaderProps = {
  booking: Booking;
  onClose: () => void;
  onDelete: (booking: Booking) => void;
  onOpenContract: (submittedBooking: Booking) => void;
};

const BookingDialogLoader: React.FunctionComponent<BookingDialogLoaderProps> = (props: BookingDialogLoaderProps) => {
  const { booking, onClose, onDelete, onOpenContract } = props;
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: allGuests } = useAllGuestsQuery();
  const [isEditMode, setIsEditMode] = useState(booking === undefined || booking.id === undefined);

  if (booking && lodgings && allGuests) {
    if(isEditMode)
      return (
        <BookingDialog
          booking={booking}
          lodgings={lodgings}
          guests={allGuests}
          onClose={onClose}
          onDelete={() => onDelete(booking)}
          onOpenContract={onOpenContract}
        />
      );
    else
      return (
        <BookingView
          booking={booking}
          onEdit={() => setIsEditMode(true)}
          onClose={onClose}
          onDelete={() => onDelete(booking)}
          onOpenContract={onOpenContract}
        />
      );
  }
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default BookingDialogLoader;
