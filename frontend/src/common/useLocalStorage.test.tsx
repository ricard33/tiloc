import { act, renderHook } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage()", () => {
  beforeEach(() => localStorage.clear());

  it("returns the default value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("missing", "def"));
    expect(result.current[0]).toEqual("def");
  });

  it("hydrates from an existing stored value", () => {
    localStorage.setItem("theme", JSON.stringify("dark"));
    const { result } = renderHook(() => useLocalStorage("theme", "light"));
    expect(result.current[0]).toEqual("dark");
  });

  it("persists updates to localStorage as JSON", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => result.current[1](5));

    expect(result.current[0]).toEqual(5);
    expect(localStorage.getItem("count")).toEqual("5");
  });

  it("supports object values", () => {
    const { result } = renderHook(() => useLocalStorage("prefs", {}));
    act(() => result.current[1]({ a: 1 }));
    expect(JSON.parse(localStorage.getItem("prefs")!)).toEqual({ a: 1 });
  });
});
