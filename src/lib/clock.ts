// The app's idea of "now". In development you can pretend it's a different
// day (e.g. a Monday) to test weekly pulse checks and monthly reassessments
// without waiting. The override is a cookie set from the dashboard's demo
// tools and is ignored entirely in production.

import "server-only";
import { cookies } from "next/headers";

export const FAKE_TODAY_COOKIE = "pulsework_fake_today";
export const DEV_TOOLS_ENABLED = process.env.NODE_ENV !== "production";

/** Parses "YYYY-MM-DD" into a local date. Returns null for anything else. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The pretend date, if one is set. */
export async function getFakeToday(): Promise<string | null> {
  if (!DEV_TOOLS_ENABLED) return null;
  const value = (await cookies()).get(FAKE_TODAY_COOKIE)?.value;
  return value && parseDateInput(value) ? value : null;
}

/** Current time, or the pretend date at the current time of day. */
export async function getNow(): Promise<Date> {
  const now = new Date();
  const fake = await getFakeToday();
  if (!fake) return now;

  const day = parseDateInput(fake)!;
  day.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return day;
}
