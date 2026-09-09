import alertReducer from "./alert";
import { closeAlert, enqueueAlert, removeAlert } from "../actions/alertActions";
import { CLOSE_SNACKBAR, ENQUEUE_SNACKBAR, REMOVE_SNACKBAR } from "../actions";

const notif = (key: number, message = "hi") => ({ key, message });

describe("alert reducer", () => {
  it("starts with no notifications", () => {
    expect(alertReducer(undefined, { type: "@@INIT" } as never)).toEqual({ notifications: [] });
  });

  it("appends a notification on ENQUEUE_SNACKBAR", () => {
    const state = alertReducer(undefined, {
      type: ENQUEUE_SNACKBAR,
      payload: { notification: notif(1) },
    } as never);
    expect(state.notifications).toEqual([notif(1)]);
  });

  it("ignores an ENQUEUE_SNACKBAR without a notification", () => {
    const before = { notifications: [notif(1)] };
    expect(alertReducer(before, { type: ENQUEUE_SNACKBAR, payload: {} } as never)).toBe(before);
  });

  it("marks a single notification dismissed on CLOSE_SNACKBAR with a key", () => {
    const before = { notifications: [notif(1), notif(2)] };
    const state = alertReducer(before, { type: CLOSE_SNACKBAR, payload: { key: 1 } } as never);
    expect(state.notifications).toEqual([
      { ...notif(1), dismissed: true },
      notif(2),
    ]);
  });

  it("marks every notification dismissed on CLOSE_SNACKBAR with dismissAll", () => {
    const before = { notifications: [notif(1), notif(2)] };
    const state = alertReducer(before, {
      type: CLOSE_SNACKBAR,
      payload: { dismissAll: true },
    } as never);
    expect(state.notifications.every((n) => n.dismissed)).toBe(true);
  });

  it("drops a notification on REMOVE_SNACKBAR", () => {
    const before = { notifications: [notif(1), notif(2)] };
    const state = alertReducer(before, { type: REMOVE_SNACKBAR, payload: { key: 1 } } as never);
    expect(state.notifications).toEqual([notif(2)]);
  });
});

describe("alert action creators", () => {
  it("enqueueAlert generates a key when none is supplied", () => {
    const action = enqueueAlert({ message: "boom" });
    expect(action.type).toEqual(ENQUEUE_SNACKBAR);
    expect(action.payload.notification!.message).toEqual("boom");
    expect(action.payload.notification!.key).toEqual(expect.any(Number));
  });

  it("enqueueAlert keeps an explicit key from options", () => {
    const action = enqueueAlert({ message: "boom", options: { key: "my-key" } });
    expect(action.payload.notification!.key).toEqual("my-key");
  });

  it("closeAlert sets dismissAll when no key is given", () => {
    expect(closeAlert(undefined as never).payload).toEqual({ dismissAll: true, key: undefined });
    expect(closeAlert("k").payload).toEqual({ dismissAll: false, key: "k" });
  });

  it("removeAlert carries the key", () => {
    expect(removeAlert("k")).toEqual({ type: REMOVE_SNACKBAR, payload: { key: "k" } });
  });
});
