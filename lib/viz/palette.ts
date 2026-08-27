/**
 * Chart palette.
 *
 * Categorical slots are assigned in fixed order and never cycled: a ninth series
 * folds into "Other" or becomes small multiples. Both modes are selected, not
 * flipped — the dark column is the same eight hues re-stepped for the dark
 * surface. Validated against this product's actual surfaces (#ffffff / #121215):
 * light — adjacent CVD ΔE 9.1, normal-vision ΔE 19.6, three slots below 3:1
 * contrast (relief: direct labels + table view, which every chart here ships);
 * dark — adjacent CVD ΔE 8.4, normal-vision ΔE 19.3, all slots ≥ 3:1.
 */
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

/**
 * Forms that put every pair on screen at once (scatter, choropleth, small
 * multiples) only clear the all-pairs floors for the first three slots.
 */
export const ALL_PAIRS_SAFE_SLOTS = 3;

/** Sequential ramp — one hue, light → dark. Used for magnitude only. */
export const SEQUENTIAL_BLUE = [
  "#cde2fb",
  "#b7d3f6",
  "#9ec5f4",
  "#86b6ef",
  "#6da7ec",
  "#5598e7",
  "#3987e5",
  "#2a78d6",
  "#256abf",
  "#1c5cab",
  "#184f95",
  "#104281",
  "#0d366b",
] as const;

/** Ordinal ramps must stay clear of the surface: light ≥ step 250, dark ≤ step 600. */
export const ORDINAL_LIGHT = SEQUENTIAL_BLUE.slice(3, 11);
export const ORDINAL_DARK = SEQUENTIAL_BLUE.slice(2, 10);

/** Status is reserved. It never stands in for a series colour. */
export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export type SeriesSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Colour follows the entity, never its rank — callers pass a stable slot index
 * derived from the entity id, so filtering a series out never repaints the rest.
 */
export function seriesColor(slot: number, mode: "light" | "dark"): string {
  const table = mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return table[Math.abs(slot) % table.length];
}

/** CSS custom properties emitted once per chart root. */
export function seriesVar(slot: number): string {
  return `var(--series-${(Math.abs(slot) % 8) + 1})`;
}
