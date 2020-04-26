import { createSelector } from "redux-orm";
import orm from "./orm";

export const bookings = createSelector(orm.Booking);
export const bookingStatuses = createSelector(orm.BookingStatus);
export const lodgings = createSelector(orm.Lodging);
export const guests = createSelector(orm.Booking.guest_name);
