import * as bookings from "./bookings";
import * as types from "./actionTypes";
import axios from "axios";
import thunk from "redux-thunk";
import configureMockStore from "redux-mock-store";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock("axios");

describe.skip("booking actions", () => {
  it("should create an action to fetch all bookings", () => {
    const mocked_bookings = [{ guest_name: "Bob" }];
    const resp = { data: { results: mocked_bookings } };
    axios.get.mockResolvedValue(resp);
    const store = mockStore({ bookings: {} });

    const expectedActions = [
      { type: types.FETCH_BOOKINGS_REQUEST },
      { type: types.FETCH_BOOKINGS_SUCCESS, data: resp.data },
    ];

    return store.dispatch(bookings.fetchBookings()).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("should create an action for fetching failure", () => {
    axios.get.mockRejectedValue("Predictable error");
    const store = mockStore({ bookings: {} });

    const expectedActions = [
      { type: types.FETCH_BOOKINGS_REQUEST },
      { type: types.FETCH_BOOKINGS_FAILURE, error: "Predictable error" },
    ];

    return store.dispatch(bookings.fetchBookings()).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });

  });
});

describe("generic restful client", () =>{
  it("should use composed action names", () => {
    expect(types["FETCH_BOOKING_STATUSES_REQUEST"]).toEqual(types.FETCH_BOOKING_STATUSES_REQUEST);
  });
});

describe("booking status actions", () => {
  it.skip("should get booking statuses", () => {
    const mocked_statuses = [{ name: "Option"}, {name: "Deposit paid"}];
    const resp = { data: { results: mocked_statuses } };
    axios.get.mockResolvedValue(resp);
    const store = mockStore({ statuses: {} });

    const expectedActions = [
      { type: types.FETCH_BOOKING_STATUSES_REQUEST },
      { type: types.FETCH_BOOKING_STATUSES_SUCCESS, data: resp.data },
    ];

    return store.dispatch(bookings.fetchBookingStatuses()).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
