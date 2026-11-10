"use server";

import { cityById } from "@/lib/cities";
import { computePillars, resolveBirthTime, type BirthInput } from "@/lib/saju";
import { sealNameChart } from "@/lib/naming/chartToken";

// The form sends the birth here, once; back comes a signed token with the chart only. The birth date is never
// stored and never put in the address.
export type NameFormInput = { first: string; last: string; y: number; m: number; d: number; time: string | null; city: string | null };

export async function makeNameChart(x: NameFormInput): Promise<{ token: string } | { error: string }> {
  const first = String(x.first ?? "").trim().slice(0, 40);
  if (!first) return { error: "Please write your first name." };
  const [y, m, d] = [x.y, x.m, x.d].map(Number);
  if (![y, m, d].every(Number.isInteger) || new Date(Date.UTC(y, m - 1, d)).getUTCDate() !== d) return { error: "That birth date doesn't look right." };
  const base: BirthInput = { year: y, month: m, day: d, calendar: "solar", hourBranch: null };
  let input = base;
  let place = "";
  const t = x.time ? /^(\d{2}):(\d{2})$/.exec(x.time) : null;
  try {
    if (t && x.city) {
      const city = cityById(x.city);
      place = city.en;
      input = resolveBirthTime(base, { hour: +t[1], minute: +t[2] }, { lon: city.lon, tz: city.tz }).input;
    }
  } catch {
    input = base;
    place = "";
  }
  try {
    const pillars = computePillars(input);
    return { token: sealNameChart({ first, last: String(x.last ?? "").trim(), year: y, pillars, place, timeKnown: !!place }) };
  } catch {
    return { error: "I couldn't read a chart for that date. Please check it (1920 or later) and try again." };
  }
}
