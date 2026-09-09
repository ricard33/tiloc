import appInfoReducer from "./appInfo";
import { appInfoLoaded } from "../actions/appInfo";
import { APP_INFO_LOADED } from "../actions/actionTypes";
import type { AppInfo } from "../types";

const loaded: AppInfo = {
  loaded: true,
  version: "1.2.3",
  frontendVersion: "1.2.3",
  buildDate: "2026-09-08",
  canRegister: true,
  isDebug: false,
  isDemo: false,
};

describe("appInfo reducer", () => {
  it("has a sensible initial state", () => {
    const state = appInfoReducer(undefined, { type: "@@INIT" } as never);
    expect(state).toEqual({
      loaded: false,
      version: "?",
      frontendVersion: "?",
      buildDate: "-",
      canRegister: false,
      isDebug: false,
      isDemo: false,
    });
  });

  it("merges the payload on APP_INFO_LOADED", () => {
    const state = appInfoReducer(undefined, { type: APP_INFO_LOADED, appInfo: loaded } as never);
    expect(state).toEqual(loaded);
  });

  it("ignores unknown actions", () => {
    const current = appInfoReducer(undefined, { type: APP_INFO_LOADED, appInfo: loaded } as never);
    expect(appInfoReducer(current, { type: "SOMETHING_ELSE" } as never)).toBe(current);
  });

  describe("appInfoLoaded()", () => {
    it("builds an APP_INFO_LOADED action", () => {
      expect(appInfoLoaded(loaded)).toEqual({ type: APP_INFO_LOADED, appInfo: loaded });
    });
  });
});
