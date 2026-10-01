import "server-only";
import { bumpCounters, readCounters } from "./store";

// Counts for the owner's dashboard (/admin): visits and the 왕이 될 사주 → 훈도사주 funnel, per Korean calendar
// day, plus a running total. Only numbers are kept, nothing about who did what.

// Events a page may report itself (app/api/stat); the rest are counted on the server where they happen.
export const CLIENT_EVENTS = ["share_court", "share_result", "save_image", "own_court", "to_saju"] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type StatEvent = ClientEvent | "pv" | "king" | "join" | "appoint" | "reading";

const KST = 9 * 3600000;
export const kstDay = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
// The Monday a Korean day's week starts on, which names that week.
export function kstWeek(t = Date.now()) {
  const d = new Date(t + KST);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export const kstMonth = (t = Date.now()) => kstDay(t).slice(0, 7);

const dayKey = (e: string, day: string) => `st:${e}:d:${day}`;
const allKey = (e: string) => `st:${e}:all`;

// Also `view:<sale>` (a paid report's page seen by a shopper) and `co:<sale>` (its payment window opened), per
// line of the sales table (lib/sales.ts).
export async function track(event: StatEvent | `view:${string}` | `co:${string}` | `to:${string}` | `src:${string}`) {
  await bumpCounters([dayKey(event, kstDay()), allKey(event)]);
}

// A page view, and whether this browser is new today, this week, this month, or at all (it keeps the dates it
// was last counted in its own storage), so the visitor counts are distinct browsers per period.
export async function trackVisit(fresh: { day: boolean; week: boolean; month: boolean; ever: boolean }) {
  const keys = [dayKey("pv", kstDay()), allKey("pv")];
  if (fresh.day) keys.push(dayKey("uv", kstDay()));
  if (fresh.week) keys.push(`st:uv:w:${kstWeek()}`);
  if (fresh.month) keys.push(`st:uv:m:${kstMonth()}`);
  if (fresh.ever) keys.push(allKey("uv"));
  await bumpCounters(keys);
}

export type Period = "today" | "yesterday" | "week" | "month" | "all";
export const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "all", label: "전체" },
];

// The days (Korean calendar) each period covers, up to today.
function periodDays(now = Date.now()) {
  const today = kstDay(now);
  const days = (from: string) => {
    const out: string[] = [];
    for (let t = Date.parse(from); ; t += 86400000) {
      const d = new Date(t).toISOString().slice(0, 10);
      out.push(d);
      if (d >= today) return out;
    }
  };
  return { today: [today], yesterday: [kstDay(now - 86400000)], week: days(kstWeek(now)), month: days(`${kstMonth(now)}-01`) };
}

// Each event's count for each period, read in one round trip.
export async function readStats(events: string[]): Promise<Record<string, Record<Period, number>>> {
  const spans = periodDays();
  const keys: string[] = [];
  const at: Record<string, Partial<Record<Period, number[]>>> = {};
  const add = (e: string, p: Period, k: string[]) => {
    (at[e] ??= {})[p] = k.map((key) => keys.push(key) - 1);
  };
  for (const e of events) {
    add(e, "today", spans.today.map((d) => dayKey(e, d)));
    add(e, "yesterday", spans.yesterday.map((d) => dayKey(e, d)));
    add(e, "all", [allKey(e)]);
    // Distinct visitors are counted per week and month directly; everything else is the sum of its days.
    if (e === "uv") {
      add(e, "week", [`st:uv:w:${kstWeek()}`]);
      add(e, "month", [`st:uv:m:${kstMonth()}`]);
    } else {
      add(e, "week", spans.week.map((d) => dayKey(e, d)));
      add(e, "month", spans.month.map((d) => dayKey(e, d)));
    }
  }
  const values = await readCounters(keys);
  const out: Record<string, Record<Period, number>> = {};
  for (const e of events) {
    out[e] = Object.fromEntries(PERIODS.map(({ key }) => [key, (at[e][key] ?? []).reduce((a, i) => a + values[i], 0)])) as Record<Period, number>;
  }
  return out;
}

// Which period a moment falls in, for counting orders the same way.
export function inPeriods(t: number): Period[] {
  const s = periodDays();
  const d = kstDay(t);
  const out: Period[] = ["all"];
  if (d === s.today[0]) out.push("today");
  if (d === s.yesterday[0]) out.push("yesterday");
  if (d >= s.week[0]) out.push("week");
  if (d >= s.month[0]) out.push("month");
  return out;
}

// The Korean days from one to another (both included), at most a year.
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to) && out.length < 366; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

// Each event's count on each of the given days, in one round trip. Visitors here are per day (a browser that
// came on two days counts twice), unlike the week and month columns above.
export async function readDays(events: string[], days: string[]): Promise<Record<string, number[]>> {
  const values = await readCounters(events.flatMap((e) => days.map((d) => dayKey(e, d))));
  return Object.fromEntries(events.map((e, i) => [e, values.slice(i * days.length, (i + 1) * days.length)]));
}
