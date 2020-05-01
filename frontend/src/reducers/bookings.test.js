import * as types from "../actions/actionTypes";
import reducer from "./bookings"

describe.skip("Bookings reducers", () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({loading: false})
  });

  it("fetching bookings with success", () => {
    const mocked_bookings = {data: [{ guest_name: "Bob" }]};
    expect(
      reducer({}, {
        type: types.FETCH_BOOKINGS_SUCCESS,
        data: mocked_bookings
      })
    ).toEqual(
      {
        loading: false,
        ...mocked_bookings
      }
    );
  });

  it("fetching bookings replace older", () => {
    const mocked_bookings = {results: [{ guest_name: "Bob" }], count: 1, next: null, previous: null};
    expect(
      reducer({
        results: [{guest_name: "John"}, {guest_name: "Alan"}],
        count: 2,
        next: "some url",
        previous: "other url"
      }, {
        type: types.FETCH_BOOKINGS_SUCCESS,
        data: mocked_bookings
      })
    ).toEqual(
      {
        loading: false,
        ...mocked_bookings
      }
    );
  });
});
