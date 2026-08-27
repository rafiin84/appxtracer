/**
 * Deterministic pseudo-randomness.
 *
 * The demo dataset must be byte-identical on every render and every reload, so
 * nothing in `lib/mock` may call `Math.random()`. Everything draws from a seeded
 * generator keyed on a stable string (an entity id, a metric name).
 */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for shaping believable telemetry. */
export function createRng(seed: string | number) {
  let a = (typeof seed === "string" ? hashSeed(seed) : seed) >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}
