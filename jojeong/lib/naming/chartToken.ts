import "server-only";
import { openData, sealData } from "@/lib/shareToken";
import type { Pillars } from "@/lib/saju";

// What the English name result needs from a birth, without the birth date: the first and last name, the birth
// year (for the generation of the name), the eight characters, and where (if the time was known).
export type NameChart = { f: string; l: string; y: number; p: (number | null)[]; pl: string; tk: 0 | 1 };
const SCOPE = "en-name";

export function sealNameChart(c: { first: string; last: string; year: number; pillars: Pillars; place: string; timeKnown: boolean }): string {
  const p = c.pillars;
  const packed: NameChart = {
    f: c.first.slice(0, 40),
    l: c.last.slice(0, 40),
    y: c.year,
    p: [p.yearStem ?? null, p.yearBranch, p.monthStem ?? null, p.monthBranch ?? null, p.dayStem, p.dayBranch, p.hourBranch, p.hourStem ?? null],
    pl: c.place.slice(0, 60),
    tk: c.timeKnown ? 1 : 0,
  };
  return sealData(SCOPE, packed);
}

const int = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < max;

export function openNameChart(token: string | undefined) {
  const x = openData<NameChart>(SCOPE, token);
  if (!x || !Array.isArray(x.p) || x.p.length !== 8 || !int(x.y, 2200)) return null;
  const [ys, yb, ms, mb, ds, db, hb, hs] = x.p;
  if (!int(ds, 10) || !int(db, 12) || !int(yb, 12)) return null;
  const pillars: Pillars = {
    dayStem: ds,
    dayBranch: db,
    yearBranch: yb,
    hourBranch: int(hb, 12) ? hb : null,
    ...(int(ys, 10) && { yearStem: ys }),
    ...(int(ms, 10) && { monthStem: ms }),
    ...(int(mb, 12) && { monthBranch: mb }),
    ...(int(hs, 10) && int(hb, 12) && { hourStem: hs }),
  };
  return { first: String(x.f ?? "").slice(0, 40), last: String(x.l ?? "").slice(0, 40), year: x.y, pillars, place: String(x.pl ?? "").slice(0, 60), timeKnown: x.tk === 1 };
}
