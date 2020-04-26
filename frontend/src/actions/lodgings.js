import * as types from "./actionTypes";

export function fetchLodgings() {
  return {
    type: types.FETCH_LODGINGS_REQUEST
  };
}
