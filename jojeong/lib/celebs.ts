import RAW from "./celebs.json";
import POP from "./celebPop.json";
import { gunghapScore } from "./couple";
import type { Person } from "./pairToken";
import { halfCombine } from "./rels";
import { matchPillars, type Pillars } from "./saju";

// 나와 같은 일주 유명인 (2026-11-17 대표님): public figures' six letters (scripts/celebs.mts, Wikidata), matched with
// the guest's chart three ways: the same day pillar, how many of the six letters are the same, and the 궁합 score
// (lib/couple.ts, as friends: no hour, no spouse star) placed among real pairs as 상위 n%, with a title.
// No photos, and only kind words: a name with a birth year and a field, nothing more.

export const CELEB_TAGS = ["아이돌", "배우", "가수", "운동선수", "역사 인물"] as const;
export type CelebTag = (typeof CELEB_TAGS)[number];

export type Celeb = { name: string; tags: CelebTag[]; note: string; year: number; p: Pillars; fame: number };

const ROWS = RAW as unknown as [string, number, string, number, number, number, number, number, number, number][];
const CELEBS: Celeb[] = ROWS.map(([name, bits, note, year, ys, yb, ms, mb, ds, db], fame) => ({
  name,
  tags: CELEB_TAGS.filter((_, i) => bits & (1 << i)),
  note,
  year,
  p: { yearStem: ys, yearBranch: yb, monthStem: ms, monthBranch: mb, dayStem: ds, dayBranch: db, hourBranch: null },
  fame,
}));
export const CELEB_COUNT = CELEBS.length;

const asPerson = (pillars: Pillars) => ({ name: "", pillars, gender: null, birthYear: null, daeun: [] }) as unknown as Person;
const atLeast = (POP as { atLeast: number[] }).atLeast;

// The title for a score, with how many in 100 real pairs reach it.
const TITLES: readonly (readonly [number, string])[] = [
  [95, "천생연분"],
  [90, "하늘이 맺은 인연"],
  [85, "백년지기"],
  [80, "찰떡 궁합"],
  [0, "좋은 인연"],
] as const;
export const titleOf = (score: number) => (TITLES.find(([s]) => score >= s) ?? TITLES[TITLES.length - 1])[1];
export const topPct = (score: number) => Math.max(0.1, atLeast[Math.min(99, score)] ?? 100);

// What ties the two, in kind words only, strongest first.
function reasons(me: Pillars, c: Pillars): string[] {
  const f = matchPillars(me, c).facts;
  const out: string[] = [];
  if (f.stemCombine) out.push("두 분의 날 글자가 서로 끌어당기는 합");
  if (f.daySix) out.push("생활의 자리끼리 짝을 이루는 육합");
  if (f.dayThree && halfCombine(me.dayBranch, c.dayBranch)) out.push("생활의 자리가 한 방향으로 모이는 삼합");
  if (f.yearSix) out.push("띠끼리 짝을 이루는 육합");
  if (f.yearThree && halfCombine(me.yearBranch, c.yearBranch)) out.push("띠끼리 한 방향으로 모이는 삼합");
  if (f.group === "인성") out.push("상대가 그대를 받쳐 주는 기운");
  if (f.group === "비겁") out.push("같은 편에 서는 어깨동무 기운");
  if (f.group === "재성") out.push("그대가 이끌고 상대가 따르는 기운");
  if (f.group === "식상") out.push("그대가 아낌없이 내어 주는 기운");
  return out.slice(0, 2);
}

const LETTERS = (p: Pillars) => [p.yearStem, p.yearBranch, p.monthStem, p.monthBranch, p.dayStem, p.dayBranch];
export const sameLetters = (a: Pillars, b: Pillars) => {
  const x = LETTERS(a);
  const y = LETTERS(b);
  return x.reduce((n: number, v, i) => n + (v === y[i] ? 1 : 0), 0);
};

export type Hit = { name: string; tags: CelebTag[]; note: string; year: number; score?: number; title?: string; pct?: number; why?: string[]; same?: number };
const hit = (c: Celeb): Hit => ({ name: c.name, tags: c.tags, note: c.note, year: c.year });

export type StarBoard = {
  sameIlju: Hit[]; // same day pillar, most known first
  twins: Hit[]; // four or more of the six letters the same
  best: Hit[]; // highest 궁합, most known first among equals
};

export function starBoard(me: Pillars): StarBoard {
  const sameIlju = CELEBS.filter((c) => c.p.dayStem === me.dayStem && c.p.dayBranch === me.dayBranch).map(hit);
  const twins = CELEBS.map((c) => ({ c, same: sameLetters(me, c.p) }))
    .filter((x) => x.same >= 4)
    .sort((a, b) => b.same - a.same || a.c.fame - b.c.fame)
    .map(({ c, same }) => ({ ...hit(c), same }));
  const scored = CELEBS.map((c) => ({ c, score: gunghapScore(asPerson(me), asPerson(c.p), "친구") }));
  // Within a title, the best-known first: a famous 백년지기 says more than an unknown 천생연분 one point higher.
  const tier = (s: number) => TITLES.findIndex(([t]) => s >= t);
  const best = scored
    .filter((x) => x.score >= 80)
    .sort((a, b) => tier(a.score) - tier(b.score) || a.c.fame - b.c.fame)
    .slice(0, 300)
    .map(({ c, score }) => ({ ...hit(c), score, title: titleOf(score), pct: topPct(score), why: reasons(me, c.p) }));
  return { sameIlju, twins, best };
}
