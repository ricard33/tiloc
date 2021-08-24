import * as types from "./actionTypes";

export function fetchContracts(bookingId=null) {
  return {
    type: types.REQUEST(types.FETCH_CONTRACTS),
    ...(bookingId !== null && {filter: {booking_id: bookingId}}),
  };
}

export function getOrCreateContract(bookingId, callback) {
  return {
    type: types.REQUEST(types.GET_OR_CREATE_CONTRACT),
    urlParams: {
      bookingId: bookingId,
    },
    callback
  };
}

export function generateContract(bookingId, callback) {
  return {
    type: types.REQUEST(types.GENERATE_CONTRACT),
    urlParams: {
      bookingId: bookingId,
    },
    callback
  };
}

export function updateContract(contract, callback) {
  return {
    type: types.REQUEST(types.UPDATE_CONTRACT),
    id: contract.id,
    data: {
      ...contract,
    },
    callback
  };
}

export function deleteContract(contract_id, callback) {
  return {
    type: types.REQUEST(types.DELETE_CONTRACT),
    id: contract_id,
    callback
  };
}
