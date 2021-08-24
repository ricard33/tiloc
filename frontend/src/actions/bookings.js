import * as types from "./actionTypes";

export function fetchBookings(filter) {
  return {
    type: types.REQUEST(types.FETCH_BOOKINGS),
    filter
  };
}

export function createBooking(booking, callback) {
  return {
    type: types.REQUEST(types.CREATE_BOOKING),
    data: {
      ...booking,
    },
    callback
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

export function deleteBooking(booking_id, callback) {
  return {
    type: types.REQUEST(types.DELETE_BOOKING),
    id: booking_id,
    callback
  };
}

export function fetchBookingStatuses() {
  return {
    type: types.REQUEST(types.FETCH_BOOKING_STATUSES)
  };
}

export function fetchBookingChannels() {
  return {
    type: types.REQUEST(types.FETCH_BOOKING_CHANNELS)
  };
}

export function fetchServices() {
  return {
    type: types.REQUEST(types.FETCH_SERVICES)
  };
}
