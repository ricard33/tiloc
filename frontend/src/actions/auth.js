import * as actionTypes from "./actionTypes";

export function loadUser(token) {
  return {
    type: actionTypes.USER_LOADING,
    token: token
  };
}

export function login(username, password) {
  console.debug("login");
  return {
    type: actionTypes.LOGIN_REQUEST,
    username,
    password
  };
}
