import { createSelector } from "redux-orm";
import orm from "./orm";

export const bookings = createSelector(orm.Booking);
export const bookingStatuses = createSelector(orm.BookingStatus);
export const bookingChannels = createSelector(orm.BookingChannel);
export const lodgings = createSelector(
  orm.Lodging,
  orm,
  (lodgings, session) => {
    // return session.Lodging.all().toModelArray().map(lodging => {
    // console.log(lodgings);
    const transform = lodging => {
      return {
        ...lodging,
        owner: lodging.owner ? session.Owner.filter(o => o.id === lodging.owner).first() : null
      }
    };
    if(Array.isArray(lodgings))
      return lodgings.map(transform)
    return transform(lodgings);
  }
);
export const owners = createSelector(orm.Owner);
export const guests = createSelector(orm.Booking, orm, (booking, session) => {
  return session.Booking.all().orderBy(['guest_name']).toModelArray().map(booking => {
    return {
      name: booking.guest_name,
      contact: booking.guest_contact,
      address: booking.guest_address
    };
  }).reduce((unique, item) =>
    unique.filter(e => e.name === item.name).length > 0 ? unique : [...unique, item], []);
});

export function toto() {
  console.log(arguments);
}
