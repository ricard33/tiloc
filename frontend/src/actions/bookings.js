import * as types from "./actionTypes";

export function fetchBookings() {
  return {
    type: types.FETCH_BOOKINGS_REQUEST
  };
}
export function fetchBookingStatuses() {
  return {
    type: types.FETCH_BOOKING_STATUSES_REQUEST
  };
}
