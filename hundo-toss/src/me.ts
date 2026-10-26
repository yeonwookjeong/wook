import { Storage } from "@apps-in-toss/web-framework";
import { computeProfile } from "@/lib/profile";
import { parseForm } from "@/lib/personForm";
import type { Person } from "@/lib/pairToken";

// The reader's own chart, kept on this phone (the Toss app's storage, or the browser's when testing outside Toss).
// Only the eight characters and the ten-year cycles are kept, never the birth date itself.
const ME_KEY = "hundo:me";

async function read(key: string): Promise<string | null> {
  try {
    return await Storage.getItem(key);
  } catch {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

async function write(key: string, value: string | null) {
  try {
    if (value === null) await Storage.removeItem(key);
    else await Storage.setItem(key, value);
  } catch {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Nowhere to keep it: the chart lasts for this visit only.
    }
  }
}

export async function loadMe(): Promise<Person | null> {
  const raw = await read(ME_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Person;
    return p && typeof p.name === "string" && p.pillars ? p : null;
  } catch {
    return null;
  }
}

export const saveMe = (p: Person) => write(ME_KEY, JSON.stringify(p));
export const forgetMe = () => write(ME_KEY, null);

// The birth form, read exactly as the site reads it (lib/personForm.ts): the same checks, the same time correction.
export function personFromForm(form: FormData): Person {
  const parsed = parseForm(form);
  const profile = computeProfile(parsed.input, parsed.gender);
  return { name: parsed.name, pillars: parsed.pillars, gender: parsed.gender, birthYear: profile.birthYear ?? null, daeun: profile.daeun ?? [] };
}

// The site's person token (lib/pairToken.ts encodePerson), made in the browser: the server reads the order's chart
// from it to write the report.
export function personToken(x: Person): string {
  const p = x.pillars;
  const packed = {
    n: x.name,
    p: [p.yearStem ?? null, p.yearBranch, p.monthStem ?? null, p.monthBranch ?? null, p.dayStem, p.dayBranch, p.hourBranch, p.hourStem ?? null],
    g: x.gender === "m" ? 1 : x.gender === "f" ? 2 : 0,
    y: x.birthYear ?? 0,
    d: x.daeun.map((d) => [d.stem, d.branch, d.from, d.to]),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(packed));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Small things kept on the phone besides the chart: the reports bought here, and the days whose full reading
// was opened with an ad.
export async function readList(key: string): Promise<string[]> {
  try {
    const v = JSON.parse((await read(key)) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function addToList(key: string, value: string, max = 50) {
  const list = await readList(key);
  await write(key, JSON.stringify([value, ...list.filter((x) => x !== value)].slice(0, max)));
}
