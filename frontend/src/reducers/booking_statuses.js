import * as types from "../actions/actionTypes";

const initialState = {
  loading: false,
  loaded_on: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_BOOKING_STATUSES_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case types.FETCH_BOOKING_STATUSES_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded_on: new Date(),
        ...action.data
      };
    case types.FETCH_BOOKING_STATUSES_FAILURE:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};
