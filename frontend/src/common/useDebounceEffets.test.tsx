import { act, renderHook } from "@testing-library/react";
import { useDebounceEffect } from "./useDebounceEffets";

describe("useDebounceEffect()", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs the effect after the wait time", () => {
    const fn = vi.fn();
    renderHook(() => useDebounceEffect(fn, 200, []));

    act(() => vi.advanceTimersByTime(199));
    expect(fn).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes the deps array as call arguments", () => {
    const fn = vi.fn();
    renderHook(() => useDebounceEffect(fn, 100, ["a", 1]));

    act(() => vi.advanceTimersByTime(100));
    expect(fn).toHaveBeenCalledWith("a", 1);
  });

  it("debounces: only the last change fires when deps keep changing", () => {
    const fn = vi.fn();
    const { rerender } = renderHook(({ dep }) => useDebounceEffect(fn, 100, [dep]), {
      initialProps: { dep: 1 },
    });

    act(() => vi.advanceTimersByTime(50));
    rerender({ dep: 2 });
    act(() => vi.advanceTimersByTime(50));
    rerender({ dep: 3 });
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(100));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });
});
