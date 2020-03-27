import * as alert from "./alert";
import * as types from "./actionTypes";

describe("alert actions", () => {
  it("should create an action to add an error", () => {
    const text = "A predictable error";
    const expectedAction = {
      type: types.SHOW_ALERT,
      message: text,
      severity: "error"
    };
    expect(alert.loadErrors(text)).toEqual(expectedAction);
  });

  it("should create an action to purge alerts", () => {
    const expectedAction = {
      type: types.CLEAR_ALERT,
    };
    expect(alert.clearAlert()).toEqual(expectedAction);
  });
});
