import * as actionTypes from "./actionTypes";

export function loadUser(token) {
  return {
    type: actionTypes.USER_LOADING,
    token: token
  };
}

export function login(username, password) {
  return {
    type: actionTypes.LOGIN_REQUEST,
    username,
    password,
  };
}

export function logout() {
  return {
    type: actionTypes.LOGOUT_REQUEST,
  };
}

export function tokenExpired() {
  return {
    type: actionTypes.AUTH_TOKEN_EXPIRED,
  };
}
