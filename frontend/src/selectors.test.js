import { createSelector } from "redux-orm";
import { createTestORM, populateOrmStore } from "./common/testUtils";

describe("Selectors", () => {
  let orm;
  let emptyState;
  let ormState;
  let fullState;

  beforeEach(() => {
    orm = createTestORM();
    emptyState = orm.getEmptyState();
    const session = orm.session(emptyState);
    ormState = populateOrmStore(session);
    fullState = {
      entities: ormState
    };
  });

  it("return correct values for empty state", () => {
    const bookings = createSelector(orm.Booking);
    expect(bookings(emptyState, 1)).toEqual(null);
    expect(bookings(emptyState, [])).toEqual([]);
  });

  it("return booking list", () => {
    const bookings = createSelector(orm.Booking);
    expect(bookings(ormState, 1).id).toEqual(1);
    expect(bookings(ormState, 1).guest_name).toEqual("Guest 1");
    expect(bookings(ormState, [])).toEqual([]);
    expect(bookings(ormState)).toHaveLength(2);
  });

  it("return guests list", () => {
    const guests = createSelector(orm.Booking, orm, (booking, session) =>
      session.Booking.all().toModelArray().map(booking => {
        return {
          name: booking.guest_name,
          contact: booking.guest_contact,
          address: booking.guest_address
        };
      }));
    expect(guests(ormState)).toEqual([
      { name: "Guest 1", contact: "+12345", address: "Road 66, LA" },
      { name: "Guest 2", contact: "+54321", address: "Fort-de-France, Martinique" }
    ]);

  });

});

