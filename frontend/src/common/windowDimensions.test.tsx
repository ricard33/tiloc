import { act, cleanup, renderHook } from "@testing-library/react";
import useWindowDimensions from "./windowDimensions";

const resizeTo = (width: number, height: number) => {
  (window as any).innerWidth = width;
  (window as any).innerHeight = height;
  window.dispatchEvent(new Event("resize"));
};

describe("useWindowDimensions()", () => {
  beforeEach(() => {
    (window as any).innerWidth = 1024;
    (window as any).innerHeight = 768;
    vi.useFakeTimers();
  });
  afterEach(() => {
    // unmount (removes the resize listener) then flush any pending debounce timer
    // while fake timers + jsdom are still alive, so nothing fires post-teardown.
    cleanup();
    act(() => vi.runOnlyPendingTimers());
    vi.useRealTimers();
  });

  it("returns the current window size", () => {
    const { result } = renderHook(() => useWindowDimensions());
    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it("updates (debounced) on resize", () => {
    const { result } = renderHook(() => useWindowDimensions());

    act(() => resizeTo(500, 400));
    // debounced by 100ms — not applied yet
    expect(result.current.width).toEqual(1024);

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toEqual({ width: 500, height: 400 });
  });
});
