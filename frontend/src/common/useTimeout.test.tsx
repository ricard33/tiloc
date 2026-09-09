import { act, renderHook } from "@testing-library/react";
import { useTimeout } from "./useTimeout";

describe("useTimeout()", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls the callback after the delay", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(cb, 500));

    act(() => vi.advanceTimersByTime(499));
    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not schedule anything when delay is null", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(cb, null));

    act(() => vi.advanceTimersByTime(100000));
    expect(cb).not.toHaveBeenCalled();
  });

  it("treats 0 as a valid delay", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(cb, 0));

    act(() => vi.advanceTimersByTime(0));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending timeout on unmount", () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useTimeout(cb, 500));

    unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(cb).not.toHaveBeenCalled();
  });
});
