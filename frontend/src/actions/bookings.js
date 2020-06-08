import * as types from "./actionTypes";

export function fetchBookings() {
  return {
    type: types.REQUEST(types.FETCH_BOOKINGS)
  };
}

export function updateBooking(booking, callback) {
  return {
    type: types.REQUEST(types.UPDATE_BOOKING),
    id: booking.id,
    data: {
      ...booking,
    },
    callback
  };
}

export function fetchBookingStatuses() {
  return {
    type: types.FETCH_BOOKING_STATUSES_REQUEST
  };
}

export function fetchBookingChannels() {
  return {
    type: types.FETCH_BOOKING_CHANNELS_REQUEST
  };
}
