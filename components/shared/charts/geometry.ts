import type { MetricPoint } from "@/types";

export interface Scale {
  x: (index: number) => number;
  y: (value: number) => number;
  min: number;
  max: number;
}

export interface Box {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export function buildScale(
  seriesPoints: MetricPoint[][],
  box: Box,
  options: { min?: number; max?: number; includeZero?: boolean } = {},
): Scale {
  const values = seriesPoints.flat().map((p) => p.v);
  let min = options.min ?? Math.min(...values);
  let max = options.max ?? Math.max(...values);
  if (options.includeZero) min = Math.min(min, 0);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  // Breathing room above and below so lines never touch the frame.
  const pad = (max - min) * 0.12;
  min = options.min ?? min - pad;
  max = options.max ?? max + pad;

  const innerW = box.width - box.padding.left - box.padding.right;
  const innerH = box.height - box.padding.top - box.padding.bottom;
  const count = Math.max(1, (seriesPoints[0]?.length ?? 1) - 1);

  return {
    x: (index) => box.padding.left + (index / count) * innerW,
    y: (value) => box.padding.top + innerH - ((value - min) / (max - min)) * innerH,
    min,
    max,
  };
}

/** Catmull-Rom to cubic Bézier, for lines that read as trends rather than saw-teeth. */
export function smoothPath(points: Array<{ x: number; y: number }>, tension = 0.32): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 3;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 3;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 3;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Clean tick values — 0 / 1,000 / 2,000 rather than 1,047.3. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const rough = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = (normalised >= 7.5 ? 10 : normalised >= 3.5 ? 5 : normalised >= 1.5 ? 2 : 1) * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

export function nearestIndex(
  clientX: number,
  rect: DOMRect,
  box: Box,
  count: number,
): number {
  const innerW = box.width - box.padding.left - box.padding.right;
  const relative = ((clientX - rect.left) / rect.width) * box.width - box.padding.left;
  const ratio = Math.max(0, Math.min(1, relative / innerW));
  return Math.round(ratio * (count - 1));
}
