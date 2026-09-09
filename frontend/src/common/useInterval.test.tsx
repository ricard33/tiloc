import { act, renderHook } from "@testing-library/react";
import useInterval from "./useInterval";

describe("useInterval()", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls the callback once per delay period", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(cb, 1000));

    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("always calls the latest callback without resetting the interval", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: first },
    });

    act(() => vi.advanceTimersByTime(1000));
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(1000));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useInterval(cb, 1000));

    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(cb).not.toHaveBeenCalled();
  });
});
