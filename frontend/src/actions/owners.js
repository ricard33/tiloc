import * as types from "./actionTypes";

export function fetchOwners() {
  return {
    type: types.REQUEST(types.FETCH_OWNERS)
  };
}
