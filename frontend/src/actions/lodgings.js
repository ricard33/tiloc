import * as types from "./actionTypes";

export function fetchLodgings() {
  return {
    type: types.REQUEST(types.FETCH_LODGINGS)
  };
}
