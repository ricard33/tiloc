import * as actionTypes from "./actionTypes";
import { Account, LoginInfo, Subscription, User } from "../types";

export interface AuthAction {
  type: string,
  token?: string,
  expiry?: string;
  user?: User,
  account?: Account,
  data?: LoginInfo,
  subscription?: Subscription,
}


export function userLoading() {
  return {
    type: actionTypes.USER_LOADING,
  };
}

export function userLoaded(currentUser: User & { account: Account }) {
  const {account,  ...user} = currentUser;
  return {
    type: actionTypes.USER_LOADED,
    user,
    account
  };
}

export function loginSuccessful(data: LoginInfo) {
  const {account,  ...user} = data.user;

  return {
    type: actionTypes.LOGIN_SUCCESSFUL,
    ...data,
    user,
    account
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

export function needToReloadUser() {
  return {
    type: actionTypes.NEED_TO_RELOAD_USER,
  };
}

export function tokenExpired() {
  return {
    type: actionTypes.AUTH_TOKEN_EXPIRED,
  };
}

export function subscriptionUpdated(subscription: Subscription) {
  return {
    type: actionTypes.SUBSCRIPTION_UPDATED,
    subscription
  };
}
