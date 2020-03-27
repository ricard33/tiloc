import * as types from "../actions/actionTypes";

const initialState = {
  loading: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_BOOKINGS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case types.FETCH_BOOKINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        ...action.bookings
      };
    case types.FETCH_BOOKINGS_FAILURE:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};
