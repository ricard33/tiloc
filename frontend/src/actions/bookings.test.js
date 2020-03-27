import * as bookings from "./bookings";
import * as types from "./actionTypes";
import axios from "axios";
import thunk from "redux-thunk";
import configureMockStore from "redux-mock-store";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock("axios");

describe("booking actions", () => {
  it("should create an action to fetch all bookings", () => {
    const mocked_bookings = [{ guest_name: "Bob" }];
    const resp = { data: { results: mocked_bookings } };
    axios.get.mockResolvedValue(resp);
    const store = mockStore({ bookings: {} });

    const expectedActions = [
      { type: types.FETCH_BOOKINGS_REQUEST },
      { type: types.FETCH_BOOKINGS_SUCCESS, bookings: resp.data },
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
