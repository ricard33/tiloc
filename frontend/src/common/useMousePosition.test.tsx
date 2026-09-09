import { act, renderHook } from "@testing-library/react";
import useMousePosition from "./useMousePosition";

describe("useMousePosition()", () => {
  it("starts undefined and follows the mouse", () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current).toEqual({ x: undefined, y: undefined });

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 12, clientY: 34 }));
    });

    expect(result.current).toEqual({ x: 12, y: 34 });
  });

  it("also updates on touchstart", () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      const ev = new Event("touchstart") as unknown as TouchEvent;
      Object.defineProperty(ev, "changedTouches", { value: [{ clientX: 7, clientY: 9 }] });
      window.dispatchEvent(ev);
    });

    expect(result.current).toEqual({ x: 7, y: 9 });
  });

  it("stops listening after unmount", () => {
    const { result, unmount } = renderHook(() => useMousePosition());
    unmount();

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 99, clientY: 99 }));
    });

    expect(result.current).toEqual({ x: undefined, y: undefined });
  });
});
