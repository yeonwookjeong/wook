import "server-only";
import { cityById } from "@/lib/cities";
import { computePillars, resolveBirthTime, type BirthInput } from "@/lib/saju";
import { computeProfile, type Gender } from "@/lib/profile";
import { encodePerson } from "@/lib/pairToken";

// One English birth form, read into a chart once. What comes back is the same person token the Korean site uses
// (lib/pairToken.ts): a name, the eight characters, gender, birth year and ten-year cycles. Never the birth date.
export type EnPersonInput = { name: string; gender: string; y: number; m: number; d: number; time: string | null; city: string | null };

export function personToken(x: EnPersonInput, label: string): string {
  const name = String(x.name ?? "")
    .replace(/[\p{C}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10);
  if (!name) throw new Error(`${label}: please write a first name.`);
  const [y, m, d] = [x.y, x.m, x.d].map(Number);
  if (![y, m, d].every(Number.isInteger) || new Date(Date.UTC(y, m - 1, d)).getUTCDate() !== d) throw new Error(`${label}: that birth date doesn't look right.`);
  const gender: Gender | null = x.gender === "m" || x.gender === "f" ? x.gender : null;
  const base: BirthInput = { year: y, month: m, day: d, calendar: "solar", hourBranch: null };
  let input = base;
  const t = x.time ? /^(\d{2}):(\d{2})$/.exec(x.time) : null;
  if (t && x.city) {
    try {
      const city = cityById(x.city);
      input = resolveBirthTime(base, { hour: +t[1], minute: +t[2] }, { lon: city.lon, tz: city.tz }).input;
    } catch {
      input = base;
    }
  }
  try {
    const pillars = computePillars(input);
    const profile = computeProfile(input, gender);
    return encodePerson({ name, pillars, gender, birthYear: profile.birthYear ?? y, daeun: profile.daeun ?? [] });
  } catch {
    throw new Error(`${label}: I couldn't read a chart for that date (1920 or later, not in the future).`);
  }
}

