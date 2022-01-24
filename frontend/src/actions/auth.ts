import * as actionTypes from "./actionTypes";
import { LoginInfo, User } from "../types";

export interface AuthAction {
  type: string,
  user?: User,
  data?: LoginInfo,
}


export function userLoading() {
  return {
    type: actionTypes.USER_LOADING,
  };
}

export function userLoaded(user: User) {
  return {
    type: actionTypes.USER_LOADED,
    user
  };
}

export function loginSuccessful(data: LoginInfo) {
  return {
    type: actionTypes.LOGIN_SUCCESSFUL,
    data,
  };
}

export function authenticationError(data: any) {
  return {
    type: actionTypes.AUTHENTICATION_ERROR,
    data,
  };
}

export function loginFailed(data: any) {
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
