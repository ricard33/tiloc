import * as actionTypes from "./actionTypes";

export function userLoading() {
  return {
    type: actionTypes.USER_LOADING,
  };
}

export function userLoaded(user) {
  return {
    type: actionTypes.USER_LOADED,
    user
  };
}

export function loginSuccessful(data) {
  return {
    type: actionTypes.LOGIN_SUCCESSFUL,
    data,
  };
}

export function authenticationError(data) {
  return {
    type: actionTypes.AUTHENTICATION_ERROR,
    data,
  };
}

export function loginFailed(data) {
  return {
    type: actionTypes.LOGIN_FAILED,
    data,
  };
}

export function logoutSuccessful() {
  return {
    type: actionTypes.LOGOUT_SUCCESSFUL,
  };
}

export function tokenExpired() {
  return {
    type: actionTypes.AUTH_TOKEN_EXPIRED,
  };
}
