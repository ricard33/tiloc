import { createSelector, ORM } from "redux-orm";
// import {
//   Owner, Lodging, Category, Service,
//   BookingStatus, BookingChannel, Booking, BookedService
// } from "./models";

describe("Selectors", () => {
  let orm;
  let emptyState;
  let ormState;
  const stateSelector = () => ormState;

  beforeEach(async () => {
    const models = await import("./models");
    const {
      Owner, Lodging, Category, Service,
      BookingStatus, BookingChannel, Booking, BookedService} = models;
    orm = new ORM({ stateSelector });
    orm.register(Owner, Lodging, Category, Service,
      BookingStatus, BookingChannel, Booking, BookedService);
    emptyState = orm.getEmptyState();

    const session = orm.session(emptyState);
    let lodging = session.Lodging.create({
      id: 1,
      owner: session.Owner.create({id: 1})
    });
    session.Booking.create({
      id: 1,
      lodging: lodging,
      guest_name: "Guest 1",
      guest_contact: "+12345",
      guest_address: "Road 66, LA"
    })
    session.Booking.create({
      id: 2,
      lodging: lodging,
      guest_name: "Guest 2",
      guest_contact: "+54321",
      guest_address: "Fort-de-France, Martinique"
    })

    ormState = session.state;
  });

  // it("return correct values for empty state", () => {
  //   const bookings = createSelector(orm.Booking);
  //   expect(bookings(emptyState, 1)).toEqual(null);
  //   expect(bookings(emptyState, [])).toEqual([]);
  // });

  it("return guests list", () => {
    const guests = createSelector(orm.Booking, orm, (booking, session) =>
      session.Booking.all().toModelArray().map(booking => {
        return {
          name: booking.guest_name,
          contact: booking.guest_contact,
          address: booking.guest_address,
        };
    }));
    expect(guests(ormState)).toEqual([
      {name: "Guest 1", contact: "+12345", address: "Road 66, LA"},
      {name: "Guest 2", contact: "+54321", address: "Fort-de-France, Martinique"},
    ]);

  });

});

