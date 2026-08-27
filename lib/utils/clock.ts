import type { ISODateTime } from "@/types";

/**
 * The demo clock.
 *
 * Every timestamp in the mock dataset is anchored to this instant so the
 * narrative stays internally consistent (a deployment eleven minutes before a
 * trace failure stays eleven minutes before it, forever). Swapping the mock
 * layer for a production API means deleting this file and letting real
 * `Date.now()` back the relative formatters.
 */
export const DEMO_NOW = new Date("2026-08-26T15:12:00.000Z");

export function now(): Date {
  return new Date(DEMO_NOW);
}

export function nowIso(): ISODateTime {
  return DEMO_NOW.toISOString();
}

export function minutesAgo(minutes: number): ISODateTime {
  return new Date(DEMO_NOW.getTime() - minutes * 60_000).toISOString();
}

export function hoursAgo(hours: number): ISODateTime {
  return minutesAgo(hours * 60);
}

export function daysAgo(days: number): ISODateTime {
  return minutesAgo(days * 24 * 60);
}

export function at(iso: string): ISODateTime {
  return new Date(iso).toISOString();
}

export function shift(iso: ISODateTime, minutes: number): ISODateTime {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function diffMinutes(a: ISODateTime, b: ISODateTime): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60_000);
}
