import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import rootSaga from "./sagas";
import * as actionTypes from "./actions/actionTypes";

const makeStore = () => {
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    reducer: (s: unknown = {}) => s,
    middleware: (gdm) => gdm().concat(sagaMiddleware),
  });
  sagaMiddleware.run(rootSaga);
  return store;
};

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("rootSaga (auth token side effects)", () => {
  beforeEach(() => localStorage.clear());

  it("persists the token to localStorage on LOGIN_SUCCESSFUL", async () => {
    const store = makeStore();
    store.dispatch({ type: actionTypes.LOGIN_SUCCESSFUL, token: "abc123" });
    await tick();
    expect(localStorage.getItem("token")).toEqual("abc123");
  });

  it.each([
    actionTypes.LOGOUT_SUCCESSFUL,
    actionTypes.AUTHENTICATION_ERROR,
    actionTypes.LOGIN_FAILED,
    actionTypes.AUTH_TOKEN_EXPIRED,
  ])("removes the token from localStorage on %s", async (type) => {
    localStorage.setItem("token", "stale");
    const store = makeStore();
    store.dispatch({ type });
    await tick();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("leaves the token untouched for unrelated actions", async () => {
    localStorage.setItem("token", "keep");
    const store = makeStore();
    store.dispatch({ type: actionTypes.USER_LOADING });
    await tick();
    expect(localStorage.getItem("token")).toEqual("keep");
  });
});
