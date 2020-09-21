import { createSelector } from "redux-orm";
import { format, compareAsc } from "date-fns";
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
      };
    };
    if (Array.isArray(lodgings))
      return lodgings.map(transform);
    return transform(lodgings);
  }
);
export const owners = createSelector(orm.Owner);
export const guests = createSelector(orm.Booking, orm, (booking, session) => {
  return session.Booking.all().orderBy(["guest_name"]).toModelArray().map(booking => {
    return {
      name: booking.guest_name,
      contact: booking.guest_contact,
      address: booking.guest_address
    };
  }).reduce((unique, item) =>
    unique.filter(e => e.name === item.name).length > 0 ? unique : [...unique, item], []);
});
export const contracts = createSelector(orm.Booking.contract);
// export const contracts = createSelector(orm.Contract);
export const contracts2 = createSelector(orm.Booking, orm, (booking, session) => {
  return session.Booking.all().toModelArray()
    .map(b => b.contract ? b.contract.ref : undefined);
});
export const nextEvents = createSelector(orm.Booking, orm, (booking, session) => {
  const today = format(new Date(), "yyyy-MM-dd");
  return [
    ...session.Booking.filter(b => b.begin_date >= today && b.lodging !== null).toModelArray().map(booking => {
      return {
        ...booking.ref,
        lodging: booking.lodging.ref,
        source: booking.source ? booking.source.ref : null,
        date: booking.begin_date,
        event_type: "CHECKIN",
      };
    }),
    ...session.Booking.filter(b => b.end_date >= today && b.lodging !== null).toModelArray().map(booking => {
      return {
        ...booking.ref,
        lodging: booking.lodging.ref,
        source: booking.source ? booking.source.ref : null,
        date: booking.end_date,
        event_type: "CHECKOUT",
      };
    })
  ].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });
});
export const lastBookings = createSelector(orm.Booking, orm, (booking, session) => {
  return session.Booking.filter(b => b.lodging_id > 0).orderBy(["created"], ["desc"]).toModelArray().map(booking => {
    return {
      ...booking.ref,
      lodging: booking.lodging.ref,
      source: booking.source ? booking.source.ref : null,
    };
  });
});
