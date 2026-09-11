import React, { useState } from "react";
import { Booking } from "../../types";
import { BookingDialog } from "../index";
import { Backdrop, CircularProgress } from "@mui/material";
import { useAllGuestsQuery, useGetBookingQuery, useListLodgingsQuery, useListServicesQuery } from "../../services/api";
import BookingView from "../BookingView";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import queryString from "query-string";
import { parseISO } from "date-fns";
import { useBookingActions } from "../../common/bookingActions";

type BookingDialogLoaderProps = {
  onClose: () => void;
  onOpenContract: (submittedBooking: Booking) => void;
};

const BookingDialogLoader: React.FunctionComponent<BookingDialogLoaderProps> = (props: BookingDialogLoaderProps) => {
  const { onClose, onOpenContract } = props;
  const { bookingId } = useParams<"bookingId">();
  const location = useLocation();
  const query = queryString.parse(location.search);
  const lodging_id = query.lodging_id ? Number(query.lodging_id) : undefined;
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const newBooking = bookingId === "new" ? {
    lodging_ids: [lodging_id],
    lodgings: lodgings ? lodgings.filter(l => l.id === lodging_id) : undefined,
    begin_date: parseISO(query.begin_date as string),
    end_date: query.end_date ? parseISO(query.end_date as string) : undefined,
  } : undefined;
  const { data: loadedBooking, isLoading, error: bookingError } = useGetBookingQuery(Number(bookingId), {
    skip: bookingId === "new",
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true
  });
  const booking = (loadedBooking ?? newBooking) as Booking;
  const { data: allOptions, isSuccess: optionsLoaded } = useListServicesQuery();
  const { data: allGuests } = useAllGuestsQuery();
  const [isEditMode, setIsEditMode] = useState(bookingId === "new" || location.state?.edit);
  const { cancelBooking, uncancelBooking } = useBookingActions();
  const navigate = useNavigate();

  if(booking && (!booking.lodgings || !booking.begin_date)) {
    navigate(-1);
    return <></>;
  }

  if(bookingError) {
    return <></>;
  }

  if (booking && !isLoading && lodgings && allGuests && optionsLoaded) {
    if (isEditMode)
      return (
        <BookingDialog
          booking={booking}
          lodgings={lodgings}
          allOptions={allOptions}
          guests={allGuests}
          onClose={onClose}
          onCancelBooking={() => cancelBooking(booking)}
          onUncancelBooking={() => uncancelBooking(booking)}
          onOpenContract={onOpenContract}
        />
      );
    else
      return (
        <BookingView
          booking={booking}
          onEdit={() => setIsEditMode(true)}
          onClose={onClose}
          onCancelBooking={() => cancelBooking(booking)}
          onUncancelBooking={() => uncancelBooking(booking)}
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
