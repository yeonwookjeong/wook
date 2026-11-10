import { Storage } from "@apps-in-toss/web-framework";
import { computeProfile } from "@/lib/profile";
import { parseForm } from "@/lib/personForm";
import type { Person } from "@/lib/pairToken";
import type { Pillars } from "@/lib/saju";

// Kept on this phone only (the Toss app's storage, or the browser's when testing outside Toss): the eight
// characters, never the birth date, and the 시군구 code of home, never an address.
const ME_KEY = "dongne:me";
const HOME_KEY = "dongne:home";

export async function readItem(key: string): Promise<string | null> {
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

export async function writeItem(key: string, value: string | null) {
  try {
    if (value === null) await Storage.removeItem(key);
    else await Storage.setItem(key, value);
  } catch {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Nowhere to keep it: it lasts for this visit only.
    }
  }
}

export async function loadMe(): Promise<Person | null> {
  const raw = await readItem(ME_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Person;
    return p && typeof p.name === "string" && p.pillars ? p : null;
  } catch {
    return null;
  }
}
export const saveMe = (p: Person) => writeItem(ME_KEY, JSON.stringify(p));
export const loadHome = () => readItem(HOME_KEY);
export const saveHome = (code: string) => writeItem(HOME_KEY, code);
export const forgetAll = async () => {
  await writeItem(ME_KEY, null);
  await writeItem(HOME_KEY, null);
};

// The birth form, read exactly as the site reads it (lib/personForm.ts): the same checks, the same time correction.
export function personFromForm(form: FormData): Person {
  const parsed = parseForm(form);
  const profile = computeProfile(parsed.input, parsed.gender);
  return { name: parsed.name, pillars: parsed.pillars, gender: parsed.gender, birthYear: profile.birthYear ?? null, daeun: profile.daeun ?? [] };
}

// "우리 둘의 동네": what a link carries to the other person. A name, the eight characters and the 시군구 code of
// home, nothing else (no birth date, no address).
// `gua`: the 명괘 number (팔택), when the sender gave a gender: one digit, never the birth year.
export type Mate = { name: string; pillars: Pillars; home: string; gua: number | null };

const b64 = (s: string) => {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64 = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function mateToken(p: Person, home: string, gua: number | null): string {
  const x = p.pillars;
  return b64(JSON.stringify({ n: p.name, h: home, ...(gua && { g: gua }), p: [x.yearStem ?? null, x.yearBranch, x.monthStem ?? null, x.monthBranch ?? null, x.dayStem, x.dayBranch, x.hourBranch, x.hourStem ?? null] }));
}

const int = (v: unknown, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < max ? v : null);

export function readMate(token: string | null): Mate | null {
  if (!token || token.length > 400) return null;
  try {
    const o = JSON.parse(unb64(token)) as { n?: unknown; h?: unknown; g?: unknown; p?: unknown[] };
    if (typeof o.n !== "string" || typeof o.h !== "string" || !/^\d{5}$/.test(o.h) || !Array.isArray(o.p) || o.p.length !== 8) return null;
    const [ys, yb, ms, mb, ds, db, hb, hs] = o.p;
    const dayStem = int(ds, 10), dayBranch = int(db, 12), yearBranch = int(yb, 12);
    if (dayStem === null || dayBranch === null || yearBranch === null) return null;
    const pillars = {
      yearStem: int(ys, 10) ?? undefined,
      yearBranch,
      monthStem: int(ms, 10) ?? undefined,
      monthBranch: int(mb, 12) ?? undefined,
      dayStem,
      dayBranch,
      hourBranch: int(hb, 12),
      hourStem: int(hs, 10) ?? undefined,
    } as Pillars;
    const gua = int(o.g, 10);
    return { name: o.n.slice(0, 10), pillars, home: o.h, gua: gua && gua !== 5 ? gua : null };
  } catch {
    return null;
  }
}
