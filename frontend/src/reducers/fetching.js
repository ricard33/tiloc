import * as types from "../actions/actionTypes";
import { combineReducers } from "redux";

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

function fetchingReducer(actionBaseName) {
  return (state = initialState, action) => {
    switch (action.type) {
      case actionBaseName + "_REQUEST":
        return {
          ...state,
          syncing: !state.sync,
          loading: true
        };
      case actionBaseName + "_SUCCESS":
        return {
          ...state,
          loading: false,
          syncing: false,
          sync: true,
          error: null,
          data: action.data.results,
          count: action.data.count,
          query: action.query
        };
      case actionBaseName + "_FAILURE":
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
}

export default combineReducers({
  'bookings': fetchingReducer(types.FETCH_BOOKINGS),
  'booking_statuses': fetchingReducer(types.FETCH_BOOKING_STATUSES),
  'lodgings': fetchingReducer(types.FETCH_LODGINGS),
  'owners': fetchingReducer(types.FETCH_OWNERS),
})
