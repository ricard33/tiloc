
export type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Rounds decimal to nearest integer
 * @param {number} v - the number to round
 */
export function round(v: number) {
  return v + 0.5 | 0;
}

export const lim = (v: number, l: number, h: number) => Math.max(Math.min(v, h), l);

/**
 * convert byte to normalized 0..1
 * @param {number} v - 0..255
 */
export function b2n(v: number) {
  return lim(round(v / 2.55) / 100, 0, 1);
}

/**
 * convert normalized to byte 0..255
 * @param {number} v - 0..1
 */
export function n2b(v: number) {
  return lim(round(v * 255), 0, 255);
}

/**
 * Return rgb(a) string from color
 * @param {RGBA} v - the color
 */
export function rgbString(v: RGBA): string {
  return v && (
    v.a < 255
      ? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
      : `rgb(${v.r}, ${v.g}, ${v.b})`
  );
}

/**
 * @param {function} f
 * @param {number|number[]} a
 * @param {number} b
 * @param {number} c
 * @private
 * @hidden
 */
function calln(f: (a: number, b: number, c: number) => number[], a: number|number[], b: number, c: number) {
  return (
    Array.isArray(a)
      ? f(a[0], a[1], a[2])
      : f(a, b, c)
  ).map(n2b);
}

/**
 * Convert hsv to rgb normalized
 * @url https://jsfiddle.net/Lamik/Lr61wqub/15/
 * @param {number} h - hue [0..360]
 * @param {number} s - saturation [0..1]
 * @param {number} v - value [0..1]
 * @returns {number[]} - [r, g, b] each normalized to [0..1]
 * @hidden
 */
function hsv2rgbn(h: number, s: number, v: number) {
  /**
   * @param {number} n
   */
  const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)];
}

/**
 * Convert hsv to rgb
 * @param {number|number[]} h - hue | [h, s, l]
 * @param {number} [s] - saturation
 * @param {number} [v] - value
 * @returns {number[]}
 */
export function hsv2rgb(h: number, s: number, v: number) {
  return calln(hsv2rgbn, h, s, v);
}


function* hueGen() {
  yield 0;
  for (let i = 1; i < 10; i++) {
    const d = 1 << i;
    for (let j = 1; j <= d; j += 2) {
      yield j / d;
    }
  }
}

export function* colorGen() {
  const hue = hueGen();
  let h = hue.next();
  while (!h.done) {
    let rgb = hsv2rgb(Math.round(h.value * 360), 0.6, 0.8);
    yield {background: rgbString({r: rgb[0], g: rgb[1], b: rgb[2], a: 192}), border: rgbString({r: rgb[0], g: rgb[1], b: rgb[2], a: 144})};
    rgb = hsv2rgb(Math.round(h.value * 360), 0.6, 0.5);
    yield {background: rgbString({r: rgb[0], g: rgb[1], b: rgb[2], a: 192}), border: rgbString({r: rgb[0], g: rgb[1], b: rgb[2], a: 144})};
    h = hue.next();
  }
}
