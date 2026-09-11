/**
 * Validated categorical palette for chart.js charts (see the `dataviz` skill's
 * `references/palette.md`) — 8 fixed hues, checked with `validate_palette.js` for both
 * light and dark chart surfaces. Assign colors in this fixed order, never cycled or
 * re-painted when a filter changes the series count, so a given entity always keeps the
 * same color across every chart on the page.
 */
export const CATEGORICAL_PALETTE_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const CATEGORICAL_PALETTE_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];

/** Returns the fixed-order categorical color for slot `index`, cycling past 8 only as a last resort. */
export function categoricalColor(index: number, dark = false): string {
  const palette = dark ? CATEGORICAL_PALETTE_DARK : CATEGORICAL_PALETTE_LIGHT;
  return palette[index % palette.length];
}

/**
 * Stable color per category key: the same key always gets the same slot, based on the
 * order keys are first seen in `keys` (a fixed, meaningful order — e.g. the channel or
 * payment-method list as returned by the API), not on where it lands in a filtered chart.
 */
export function colorByKey(key: string | null, keys: (string | null)[], dark = false): string {
  const index = keys.indexOf(key);
  return categoricalColor(index === -1 ? 0 : index, dark);
}

/** Dims a palette hex color for a secondary series (e.g. a previous-period comparison). */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
