import * as types from "./actionTypes";

export function fetchOwners() {
  return {
    type: types.FETCH_OWNERS_REQUEST
  };
}
