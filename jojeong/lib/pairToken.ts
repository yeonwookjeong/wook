import type { Gender, Profile } from "./profile";
import type { Pillars } from "./saju";

export { RELATIONS, relationOf, type Relation } from "./relations";

// One person of a 궁합, carried in the report link so nothing is stored: the name, the eight characters
// (never the birth date), gender, birth year and the ten-year cycles.
export type Person = { name: string; pillars: Pillars; gender: Gender | null; birthYear: number | null; daeun: NonNullable<Profile["daeun"]> };

type Packed = { n: string; p: (number | null)[]; g: 0 | 1 | 2; y: number; d: [number, number, number, number][] };

export function encodePerson(x: Person): string {
  const p = x.pillars;
  const packed: Packed = {
    n: x.name,
    p: [p.yearStem ?? null, p.yearBranch, p.monthStem ?? null, p.monthBranch ?? null, p.dayStem, p.dayBranch, p.hourBranch, p.hourStem ?? null],
    g: x.gender === "m" ? 1 : x.gender === "f" ? 2 : 0,
    y: x.birthYear ?? 0,
    d: x.daeun.map((d) => [d.stem, d.branch, d.from, d.to]),
  };
  return Buffer.from(JSON.stringify(packed)).toString("base64url");
}

const int = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < max;

// Anything malformed or out of range is refused rather than guessed at.
export function decodePerson(token: string | undefined): Person | null {
  if (!token || token.length > 1200) return null;
  try {
    const x = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as Packed;
    const name = String(x.n ?? "")
      .replace(/[\p{C}]/gu, "")
      .trim();
    if (!name || [...name].length > 10 || !Array.isArray(x.p) || x.p.length !== 8) return null;
    const [ys, yb, ms, mb, ds, db, hb, hs] = x.p;
    if (![ys, ms, ds].every((v) => int(v, 10)) || ![yb, mb, db].every((v) => int(v, 12))) return null;
    if (hb !== null && !int(hb, 12)) return null;
    if (hs !== null && (hb === null || !int(hs, 10))) return null;
    const daeun = Array.isArray(x.d) ? x.d : [];
    if (daeun.length > 12 || !daeun.every((d) => Array.isArray(d) && int(d[0], 10) && int(d[1], 12) && int(d[2], 2200) && int(d[3], 2200))) return null;
    const pillars: Pillars = {
      yearStem: ys as number,
      yearBranch: yb as number,
      monthStem: ms as number,
      monthBranch: mb as number,
      dayStem: ds as number,
      dayBranch: db as number,
      hourBranch: hb as number | null,
      ...(hs !== null && { hourStem: hs as number }),
    };
    return {
      name,
      pillars,
      gender: x.g === 1 ? "m" : x.g === 2 ? "f" : null,
      birthYear: int(x.y, 2200) && x.y >= 1900 ? x.y : null,
      daeun: daeun.map(([stem, branch, from, to]) => ({ stem, branch, from, to })),
    };
  } catch {
    return null;
  }
}

export const profileOf = (x: Person): Profile => ({
  ...(x.gender && { gender: x.gender }),
  ...(x.daeun.length && { daeun: x.daeun }),
  ...(x.birthYear && { birthYear: x.birthYear }),
});
