import * as actionTypes from "./actionTypes";

export function loadUser(token) {
  return {
    type: actionTypes.USER_LOADING,
    token: token
  };
}

export function login(username, password, callback) {
  return {
    type: actionTypes.LOGIN_REQUEST,
    username,
    password,
    callback
  };
}

export function logout(callback) {
  return {
    type: actionTypes.LOGOUT_REQUEST,
    callback
  };
}

export function tokenExpired() {
  return {
    type: actionTypes.AUTH_TOKEN_EXPIRED,
    // callback
  };
}
