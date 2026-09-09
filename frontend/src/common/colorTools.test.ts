import { b2n, colorGen, hsv2rgb, lim, n2b, rgbString, round } from "./colorTools";

describe("Module colorTools:", () => {
  describe("round()", () => {
    it("rounds to nearest integer (round-half-up via bit trick)", () => {
      expect(round(1.4)).toEqual(1);
      expect(round(1.5)).toEqual(2);
      expect(round(2.99)).toEqual(3);
      expect(round(0)).toEqual(0);
    });
  });

  describe("lim()", () => {
    it("clamps a value between low and high bounds", () => {
      expect(lim(5, 0, 10)).toEqual(5);
      expect(lim(-3, 0, 10)).toEqual(0);
      expect(lim(42, 0, 10)).toEqual(10);
    });
  });

  describe("b2n() / n2b()", () => {
    it("b2n normalises a 0..255 byte to 0..1", () => {
      expect(b2n(0)).toEqual(0);
      expect(b2n(255)).toEqual(1);
      expect(b2n(128)).toBeCloseTo(0.5, 1);
    });

    it("n2b converts a 0..1 value back to a 0..255 byte", () => {
      expect(n2b(0)).toEqual(0);
      expect(n2b(1)).toEqual(255);
      expect(n2b(0.5)).toEqual(128);
    });

    it("both stay within their bounds for out-of-range input", () => {
      expect(b2n(1000)).toEqual(1);
      expect(n2b(5)).toEqual(255);
      expect(n2b(-5)).toEqual(0);
    });
  });

  describe("rgbString()", () => {
    it("returns rgb() when fully opaque", () => {
      expect(rgbString({ r: 10, g: 20, b: 30, a: 255 })).toEqual("rgb(10, 20, 30)");
    });

    it("returns rgba() with a normalised alpha when translucent", () => {
      expect(rgbString({ r: 10, g: 20, b: 30, a: 0 })).toEqual("rgba(10, 20, 30, 0)");
      expect(rgbString({ r: 1, g: 2, b: 3, a: 192 })).toMatch(/^rgba\(1, 2, 3, 0\.7[0-9]?\)$/);
    });
  });

  describe("hsv2rgb()", () => {
    it("converts primary hues to the expected rgb bytes", () => {
      expect(hsv2rgb(0, 1, 1)).toEqual([255, 0, 0]);
      expect(hsv2rgb(120, 1, 1)).toEqual([0, 255, 0]);
      expect(hsv2rgb(240, 1, 1)).toEqual([0, 0, 255]);
    });

    it("returns greys when saturation is 0", () => {
      expect(hsv2rgb(0, 0, 1)).toEqual([255, 255, 255]);
      expect(hsv2rgb(0, 0, 0)).toEqual([0, 0, 0]);
    });

    it("accepts an array [h, s, v] argument", () => {
      expect(hsv2rgb([0, 1, 1] as never, 0, 0)).toEqual([255, 0, 0]);
    });
  });

  describe("colorGen()", () => {
    it("yields distinct background/border pairs", () => {
      const gen = colorGen();
      const first = gen.next().value;
      const second = gen.next().value;

      expect(first).toHaveProperty("background");
      expect(first).toHaveProperty("border");
      expect(first!.background).toMatch(/^rgba\(/);
      expect(first).not.toEqual(second);
    });

    it("keeps producing colours (infinite generator)", () => {
      const gen = colorGen();
      const colours = Array.from({ length: 20 }, () => gen.next().value);
      expect(colours).toHaveLength(20);
      expect(colours.every((c) => !!c && c.background.startsWith("rgba("))).toBe(true);
    });
  });
});
