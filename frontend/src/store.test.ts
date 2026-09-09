import { store } from "./store";
import { alert, appInfo } from "./actions";
import { LOGOUT_SUCCESSFUL } from "./actions/actionTypes";
import type { AppInfo } from "./types";

const appInfoPayload: AppInfo = {
  loaded: true,
  version: "9.9.9",
  frontendVersion: "9.9.9",
  buildDate: "2026-01-01",
  canRegister: true,
  isDebug: false,
  isDemo: false,
};

describe("store root reducer", () => {
  it("wires alert, auth, appInfo and the api slice", () => {
    const state = store.getState();
    expect(state).toHaveProperty("alert");
    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("appInfo");
    expect(state).toHaveProperty("api");
  });

  it("clears every slice except appInfo on LOGOUT_SUCCESSFUL", () => {
    store.dispatch(appInfo.appInfoLoaded(appInfoPayload));
    store.dispatch(alert.enqueueAlert({ message: "hello" }));
    expect(store.getState().alert.notifications).toHaveLength(1);

    store.dispatch({ type: LOGOUT_SUCCESSFUL });

    const state = store.getState();
    expect(state.alert.notifications).toEqual([]); // reset to the reducer's default
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.appInfo).toMatchObject({ version: "9.9.9", loaded: true }); // preserved
  });
});
