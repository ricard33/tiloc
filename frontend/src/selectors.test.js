import { createTestORM, populateOrmStore } from "./common/testUtils";
// import * as ormModule from "./orm";

describe("Selectors", () => {
  let mockOrm;
  let emptyState;
  let ormState;
  let fullState;
  let selectors;
  let session;

  beforeEach(() => {
    mockOrm = createTestORM();
    jest.mock("./orm", () => mockOrm);
    selectors = require("./selectors");
    emptyState = mockOrm.getEmptyState();
    session = mockOrm.session(emptyState);
    ormState = populateOrmStore(session);
    fullState = {
      entities: ormState
    };
  });

  it("return correct values for empty state", () => {
    const { bookings } = selectors;
    expect(bookings(emptyState, 1)).toEqual(null);
    expect(bookings(emptyState, [])).toEqual([]);
  });

  it("return booking list", () => {
    const { bookings } = selectors;
    expect(bookings(ormState, 1).id).toEqual(1);
    expect(bookings(ormState, 1).guest_name).toEqual("Guest 1");
    expect(bookings(ormState, [])).toEqual([]);
    expect(bookings(ormState)).toHaveLength(2);
  });

  it("return guests list", () => {
    const { guests } = selectors;
    expect(guests(ormState)).toEqual([
      { name: "Guest 1", contact: "+12345", address: "Road 66, LA" },
      { name: "Guest 2", contact: "+54321", address: "Fort-de-France, Martinique" }
    ]);
  });

  it("returns lodgings with nested content (Owner)", () => {
    const { lodgings } = selectors;
    expect(lodgings(ormState)[0].owner.name).toEqual("John DOE");
  });

  it("returns single lodging", () => {
    const { lodgings } = selectors;
    session.Lodging.create({
      id: 2, name: "Paradise", owner: 1
    })
    expect(lodgings(ormState)).toHaveLength(2);
    // console.debug(lodgings(ormState, 1));
    expect(lodgings(ormState, 1).name).toEqual("Lovely place");
    expect(lodgings(ormState, 2).name).toEqual("Paradise");
  });

  it("return contract", () => {
    const { contracts, bookings } = selectors;

    expect(contracts(ormState)).toHaveLength(2);
    expect(contracts(ormState, 1)).toBeNull();  // no contract for booking[id:1]
    expect(contracts(ormState, 2).id).toEqual(1);
    expect(contracts(ormState, 2).content).toEqual("Contract for Guest 2");
  });

});

