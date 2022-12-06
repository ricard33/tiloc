import React, { useState } from "react";
import { Booking } from "../../types";
import { BookingDialog } from "../index";
import { Backdrop, CircularProgress } from "@mui/material";
import {
  useAllGuestsQuery, useGetOwnerQuery,
  useListLodgingsQuery, useListServicesQuery
} from "../../services/api";
import BookingView from "../BookingView";

type BookingDialogLoaderProps = {
  booking: Booking;
  onClose: () => void;
  onCancelBooking: (booking: Booking) => void;
  onUncancelBooking: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onOpenContract: (submittedBooking: Booking) => void;
};

const BookingDialogLoader: React.FunctionComponent<BookingDialogLoaderProps> = (props: BookingDialogLoaderProps) => {
  const { booking, onClose, onCancelBooking, onUncancelBooking, onDelete, onOpenContract } = props;
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: allOptions, isSuccess: optionsLoaded } = useListServicesQuery();
  const {
    data: owner
  } = useGetOwnerQuery(booking.lodging.owner_id, { skip: typeof booking.lodging.owner_id === "undefined" });

  const { data: allGuests } = useAllGuestsQuery();
  const [isEditMode, setIsEditMode] = useState(booking.id === undefined);

  if (booking && lodgings && owner && allGuests && optionsLoaded) {
    if(isEditMode)
      return (
        <BookingDialog
          booking={booking}
          lodgings={lodgings}
          allOptions={allOptions}
          owner={owner}
          guests={allGuests}
          onClose={onClose}
          onCancelBooking={() => onCancelBooking(booking)}
          onUncancelBooking={() => onUncancelBooking(booking)}
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
          onCancelBooking={() => onCancelBooking(booking)}
          onUncancelBooking={() => onUncancelBooking(booking)}
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
