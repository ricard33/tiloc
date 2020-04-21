import * as types from "../actions/actionTypes";

const initialState = {
  sync: false,
  syncing: false,
  loading: false,
  error: null,
  data: [],
  count: 0,
  // next previous ?
  query: {
    limit: null,
    offset: null
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_BOOKINGS_REQUEST:
      return {
        ...state,
        syncing: !state.sync,
        loading: true,
      };
    case types.FETCH_BOOKINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        syncing: false,
        sync: true,
        error: null,
        data: action.data.results,
        count: action.data.count,
        query: action.query,
      };
    case types.FETCH_BOOKINGS_FAILURE:
      return {
        ...state,
        loading: false,
        syncing: false,
        error: action.error
      };
    default:
      return state;
  }
};
