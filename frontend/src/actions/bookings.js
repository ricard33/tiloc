import * as types from "./actionTypes";
import axios from "axios";

function fetchBookingsRequest() {
  return {
    type: types.FETCH_BOOKINGS_REQUEST
  }
}

export const fetchBookings = () => {
  return dispatch => {
    dispatch(fetchBookingsRequest());
    return axios.get("api/booking/")
      .then(response => {
        return dispatch({
          type: types.FETCH_BOOKINGS_SUCCESS,
          bookings: response.data
        });
      })
      .catch(error => {
        return dispatch({
          type: types.FETCH_BOOKINGS_FAILURE,
          error
        })
      })
    ;
  };
};
