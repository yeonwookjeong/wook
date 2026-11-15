import { chartOf, readChart, type GodGroup, type Reading, type TenGod } from "./myeongri";
import { isBaekho, isGoegang, salsAt, type Sal } from "./deep";
import type { Daeun } from "./profile";
import type { FullPillars, Pillars } from "./saju";

// 벼슬길 (2026-11-15, 대표님 "사주대로 할래, 내 선택대로 할래"): a Joseon official's career in four gates, read
// from the chart with no AI. 과거 (which exam) → 첫 자리 (first post) → 시련 (the trial) → 마지막 벼슬. At every
// gate the chart points to one door; the player may follow it or pick another, and a door the chart does not
// back costs time and rank. Every pick carries its 명리 reason.

export type Exam = "mun" | "mu" | "jap";
export type Post =
  | "hongmun" | "saheon" | "seungjeong" | "suryeong" // 문과
  | "seonjeon" | "hullyeon" | "byeonbang" | "podo" // 무과
  | "yeokgwan" | "naeui" | "gwansang" | "yulgwan"; // 잡과
export type Trial = "exile" | "war" | "faction" | "patron" | "calm";

export const EXAMS: Exam[] = ["mun", "mu", "jap"];
export const POSTS: Record<Exam, Post[]> = {
  mun: ["hongmun", "saheon", "seungjeong", "suryeong"],
  mu: ["seonjeon", "hullyeon", "byeonbang", "podo"],
  jap: ["yeokgwan", "naeui", "gwansang", "yulgwan"],
};

type Facts = { r: Reading; g: Record<GodGroup, number>; t: Record<TenGod, number>; sals: Set<Sal | "괴강" | "백호">; clash: number };

function factsOf(p: Pillars): Facts | null {
  const r = readChart(p);
  if (!r) return null;
  const sum = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
  const g = Object.fromEntries(Object.entries(r.godWeights).map(([k, v]) => [k, v / sum])) as Record<GodGroup, number>;
  const t = Object.fromEntries((["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"] as TenGod[]).map((x) => [x, 0])) as Record<TenGod, number>;
  for (const x of r.godList) t[x]++;
  const sals = new Set<Sal | "괴강" | "백호">();
  const branches = chartOf(p as FullPillars).flatMap((s) => (s.branch === null ? [] : [s.branch]));
  for (const b of branches) for (const s of salsAt(p, b)) sals.add(s);
  if (isGoegang(p)) sals.add("괴강");
  if (isBaekho(p)) sals.add("백호");
  let clash = 0;
  for (let i = 0; i < branches.length; i++) for (let j = i + 1; j < branches.length; j++) if (Math.abs(branches[i] - branches[j]) === 6) clash++;
  return { r, g, t, sals, clash };
}

// Within a group, the share leaning to its 정 or 편 side by the visible ten gods (half and half when none show).
const lean = (f: Facts, a: TenGod, b: TenGod) => (f.t[a] + f.t[b] ? f.t[a] / (f.t[a] + f.t[b]) : 0.5);

// How well each exam suits the chart, 0..1-ish. 문과: 인성 (learning) and 정관 (order). 무과: 비겁 (one's own
// strength) and 편관 (pressure borne). 잡과: 식상 (craft) and 재성 (handling things and people abroad).
export function examFit(f: Facts): Record<Exam, number> {
  const jg = lean(f, "정관", "편관");
  return {
    mun: f.g.인성 + f.g.관성 * jg + (f.sals.has("문창귀인") ? 0.08 : 0),
    mu: f.g.비겁 + f.g.관성 * (1 - jg) + (f.sals.has("양인") || f.sals.has("괴강") ? 0.08 : 0),
    jap: f.g.식상 + f.g.재성 * 0.8,
  };
}

// [mean, spread] of each raw score among the real births who pass that exam (scripts/zz-means.mts, 2026-11-15).
const POST_MEAN: Record<Post, [number, number]> = {
  hongmun: [0.212, 0.1756], saheon: [0.1283, 0.096], seungjeong: [0.2005, 0.1758], suryeong: [0.1594, 0.1176],
  seonjeon: [0.0863, 0.0931], hullyeon: [0.376, 0.1943], byeonbang: [0.1623, 0.1326], podo: [0.1193, 0.085],
  yeokgwan: [0.1931, 0.1701], naeui: [0.1479, 0.1176], gwansang: [0.1297, 0.0996], yulgwan: [0.125, 0.0848],
};

export function postFit(f: Facts, exam: Exam, raw = false): Record<Post, number> {
  const s = (x: Sal | "괴강" | "백호") => (f.sals.has(x) ? 0.1 : 0);
  const all: Record<Post, number> = {
    // 홍문관: books and 문장 (정인, 문창). 사헌부: speaking up (상관 with 관). 승정원: at the king's side (정관 with 정재,
    // order and care). 지방 수령: running a county (재성, 신강 to carry it).
    hongmun: f.g.인성 * lean(f, "정인", "편인") + s("문창귀인"),
    saheon: f.g.식상 * lean(f, "상관", "식신") + f.g.관성 * 0.3,
    seungjeong: f.g.관성 * lean(f, "정관", "편관") + f.g.재성 * lean(f, "정재", "편재") * 0.5,
    suryeong: f.g.재성 + (f.r.support > 0.5 ? 0.05 : 0),
    // 선전관: the king's guard (정관 order). 훈련도감: drilling troops (비겁). 변방 진: the frontier (편관, 역마).
    // 포도청: catching thieves (편관 with 상관).
    seonjeon: f.g.관성 * lean(f, "정관", "편관") + 0.02,
    hullyeon: f.g.비겁,
    byeonbang: f.g.관성 * lean(f, "편관", "정관") * 0.7 + s("역마"),
    podo: f.g.식상 * lean(f, "상관", "식신") * 0.6 + f.g.관성 * lean(f, "편관", "정관") * 0.4 + s("양인") * 0.5,
    // 사역원 역관: languages and trade (편재, 역마). 내의원: healing (식신, 정인). 관상감: stars and days (편인, 화개).
    // 형조 율관: law (정관 with 상관's sharpness).
    yeokgwan: f.g.재성 * lean(f, "편재", "정재") + s("역마"),
    naeui: f.g.식상 * lean(f, "식신", "상관") * 0.7 + f.g.인성 * 0.3,
    gwansang: f.g.인성 * lean(f, "편인", "정인") + s("화개"),
    yulgwan: f.g.관성 * 0.6 + f.g.식상 * lean(f, "상관", "식신") * 0.3,
  };
  // Each score is read against its average over real births (scripts/zz-means.mts, 2026-11-15), so a post wins by
  // how far above most people this chart stands on it, not by which raw formula runs larger.
  return Object.fromEntries(POSTS[exam].map((k) => [k, raw ? all[k] : (all[k] - POST_MEAN[k][0]) / POST_MEAN[k][1]])) as Record<Post, number>;
}

// The trial. 괴강·백호 (a fierce day pillar): a great event, war. A 충 between the month and day branches, or two
// 충 in the chart: the career is shaken hard, exile. 천을귀인 by the month or day branch: a patron lifts one up.
// One 충 elsewhere, or 비겁 crowding a thin 관성: rivals at court, a faction fight. Otherwise a quiet decade.
export function trialOf(f: Facts, p: Pillars): Trial {
  if (f.sals.has("괴강") || f.sals.has("백호")) return "war";
  if (f.clash > 1 || (p.monthBranch !== undefined && Math.abs(p.monthBranch - p.dayBranch) === 6)) return "exile";
  const near = [p.monthBranch, p.dayBranch].flatMap((b) => (b === undefined ? [] : salsAt(p, b)));
  if (near.includes("천을귀인")) return "patron";
  if (f.clash === 1 || (f.g.비겁 > f.g.관성 && f.g.관성 > 0.1)) return "faction";
  return "calm";
}

const best = <K extends string>(m: Record<K, number>) => (Object.keys(m) as K[]).reduce((a, b) => (m[b] > m[a] ? b : a));

// The age the exam is passed: the first 대운 from twenty whose element is the 용신 or 희신, a few years in (by the
// year branch, so two people in one decade differ); past fifty the door is late, never shut.
export function passAge(f: Facts, p: Pillars, daeun: Daeun[], birthYear: number): number {
  const els = [f.r.yong, f.r.hee];
  // Daeun carry calendar years; ages are counted from the birth year.
  const d = daeun.map((x) => ({ ...x, from: x.from - birthYear, to: x.to - birthYear })).find((x) => x.from >= 19 && (els.includes(Math.floor(x.stem / 2)) || els.includes([4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4][x.branch])));
  const start = d ? Math.max(19, d.from) : 51;
  return start + (p.yearBranch % 5);
}

export type Path = { exam: Exam; post: Post; trial: Trial; age: number; strength: Reading["strength"] };

export function sajuPath(p: Pillars, daeun: Daeun[], birthYear: number): Path | null {
  const f = factsOf(p);
  if (!f) return null;
  const exam = best(examFit(f));
  return { exam, post: best(postFit(f, exam)), trial: trialOf(f, p), age: passAge(f, p, daeun, birthYear), strength: f.r.strength };
}

export const __test = { factsOf };
