import authReducer from "./auth";
import {
  authenticationError,
  loginSuccessful,
  logoutSuccessful,
  needToReloadUser,
  subscriptionUpdated,
  userLoaded,
} from "../actions/auth";
import * as actionTypes from "../actions/actionTypes";

const account = { id: 1, name: "acme" } as any;
const user = { id: 7, email: "a@b.c" } as any;

describe("auth reducer", () => {
  it("USER_LOADING flips isLoading on and clears needToReload", () => {
    const state = authReducer(undefined, { type: actionTypes.USER_LOADING } as never);
    expect(state.isLoading).toBe(true);
    expect(state.needToReload).toBe(false);
  });

  it("USER_LOADED stores user + account and authenticates", () => {
    const state = authReducer(undefined, userLoaded({ ...user, account } as any) as never);
    expect(state).toMatchObject({
      isAuthenticated: true,
      isLoading: false,
      needToReload: false,
      user,
      account,
    });
  });

  it("LOGIN_SUCCESSFUL stores the token and clears errors", () => {
    const action = loginSuccessful({ user: { ...user, account }, token: "tok", expiry: "later" } as any);
    const state = authReducer(undefined, action as never);
    expect(state).toMatchObject({ token: "tok", user, account, isAuthenticated: true, errors: undefined });
  });

  it.each([
    actionTypes.AUTHENTICATION_ERROR,
    actionTypes.LOGIN_FAILED,
    actionTypes.LOGOUT_SUCCESSFUL,
    actionTypes.AUTH_TOKEN_EXPIRED,
  ])("%s wipes the session", (type) => {
    const authed = authReducer(undefined, userLoaded({ ...user, account } as any) as never);
    const state = authReducer(authed, { type, data: { detail: "nope" } } as never);
    expect(state).toMatchObject({
      token: undefined,
      user: undefined,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("NEED_TO_RELOAD_USER sets the flag", () => {
    expect(authReducer(undefined, needToReloadUser() as never).needToReload).toBe(true);
  });

  it("SUBSCRIPTION_UPDATED replaces current_subscription on the account", () => {
    const authed = authReducer(undefined, userLoaded({ ...user, account } as any) as never);
    const sub = { id: "sub_1", status: "active" } as any;
    const state = authReducer(authed, subscriptionUpdated(sub) as never);
    expect(state.account).toMatchObject({ name: "acme", current_subscription: sub });
  });

  it("returns the same state for an unknown action", () => {
    const current = authReducer(undefined, { type: "@@INIT" } as never);
    expect(authReducer(current, { type: "NOPE" } as never)).toBe(current);
  });
});

describe("auth action creators", () => {
  it("userLoaded splits account out of the user", () => {
    const action = userLoaded({ ...user, account } as any);
    expect(action).toEqual({ type: actionTypes.USER_LOADED, user, account });
  });

  it("logoutSuccessful is a bare action", () => {
    expect(logoutSuccessful()).toEqual({ type: actionTypes.LOGOUT_SUCCESSFUL });
  });

  it("authenticationError carries the error payload", () => {
    expect(authenticationError({ x: 1 })).toEqual({
      type: actionTypes.AUTHENTICATION_ERROR,
      data: { x: 1 },
    });
  });
});
