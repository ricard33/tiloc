import { createSelector } from "redux-orm";
import orm from "./orm";

export const bookings = createSelector(orm.Booking);
export const bookingStatuses = createSelector(orm.BookingStatus);
export const bookingChannels = createSelector(orm.BookingChannel);
export const lodgings = createSelector(orm.Lodging);
export const guests = createSelector(orm.Booking, orm, (booking, session) =>
  session.Booking.all().toModelArray().map(booking => {
    return {
      name: booking.guest_name,
      contact: booking.guest_contact,
      address: booking.guest_address
    };
  }));
