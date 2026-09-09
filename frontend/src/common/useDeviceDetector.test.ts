import { useDeviceDetector } from "./useDeviceDetector";

describe("useDeviceDetector()", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "maxTouchPoints");

  afterEach(() => {
    if (original) Object.defineProperty(navigator, "maxTouchPoints", original);
  });

  const setMaxTouchPoints = (value: number) =>
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value });

  it("reports no touch screen when maxTouchPoints is 0", () => {
    setMaxTouchPoints(0);
    expect(useDeviceDetector()).toEqual({ hasTouchScreen: false });
  });

  it("reports a touch screen when maxTouchPoints is positive", () => {
    setMaxTouchPoints(5);
    expect(useDeviceDetector()).toEqual({ hasTouchScreen: true });
  });
});
