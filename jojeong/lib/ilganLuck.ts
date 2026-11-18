import { CHEONEUL, MUNCHANG, stageOf, stemClash, stemCombine, YANGIN, type Stage } from "./deep";
import { BRANCH_EL, BRANCH_MAIN_STEM, ELEMENT_KO, GROUP_OF, stemEl, tenGod, type GodGroup, type TenGod } from "./myeongri";
import { BRANCHES, STEMS, STEMS_KO } from "./saju";

// 일간별 운 (2026-11-18 대표님, 도화도르 채널의 "이번 달 일간별 운세"를 보고): what a month or a year brings to each of
// the ten day masters, read only from what the day master alone can tell, so one post can speak to everyone:
//   · the ten god of the luck's stem and of its branch (본기): what comes in (돈, 일, 공부, 사람, 재주)
//   · the day master's 12운성 at the branch: how much strength it has to take it
//   · 천을귀인, 문창귀인, 양인 at the branch, and the luck's stem combining with or striking the day stem
//   · the season (조후): a winter luck is cold for every chart, harder on fire and wood; summer the other way
// A whole chart can turn any of these (that is the paid reading); these lines say so and never decide a life.

export type Strength = "강" | "중" | "약";
const STRENGTH: Record<Stage, Strength> = {
  장생: "강", 관대: "강", 건록: "강", 제왕: "강",
  목욕: "중", 쇠: "중", 태: "중", 양: "중",
  병: "약", 사: "약", 묘: "약", 절: "약",
};

export type IlganLuck = {
  dayStem: number;
  name: string; // 갑목
  stemGod: TenGod;
  branchGod: TenGod;
  groups: GodGroup[]; // distinct, stem first
  stage: Stage;
  strength: Strength;
  stars: ("천을귀인" | "문창귀인" | "양인")[];
  combine: boolean; // 천간합 with the day stem (a pull: 계약, 인연, 묶임)
  clash: boolean; // 천간충 (흔들림)
  season: "추위" | "더위" | null; // the luck's season is hard on this day master's element
  score: number; // for ordering only: higher reads easier
};

const EL_NAME = ["목", "화", "토", "금", "수"];
export const ilganName = (s: number) => `${STEMS_KO[s]}${EL_NAME[stemEl(s)]}`;

// The season a branch belongs to: 亥子丑 winter, 巳午未 summer.
const seasonOf = (b: number) => ([11, 0, 1].includes(b) ? "겨울" : [5, 6, 7].includes(b) ? "여름" : null);

export function ilganLuck(dayStem: number, stem: number, branch: number): IlganLuck {
  const stemGod = tenGod(dayStem, stem);
  const branchGod = tenGod(dayStem, BRANCH_MAIN_STEM[branch]);
  const stage = stageOf(dayStem, branch);
  const strength = STRENGTH[stage];
  const stars: IlganLuck["stars"] = [];
  if (CHEONEUL[dayStem].includes(branch)) stars.push("천을귀인");
  if (MUNCHANG[dayStem] === branch) stars.push("문창귀인");
  if (YANGIN[dayStem] === branch) stars.push("양인");
  const el = stemEl(dayStem);
  const season = seasonOf(branch);
  const hard = season === "겨울" && (el === 1 || el === 0) ? "추위" : season === "여름" && (el === 3 || el === 4) ? "더위" : null;
  const combine = stemCombine(dayStem, stem);
  const clash = stemClash(dayStem, stem);
  const score =
    (strength === "강" ? 1 : strength === "약" ? -1 : 0) +
    (stars.includes("천을귀인") ? 1 : 0) +
    (stars.includes("문창귀인") ? 0.5 : 0) +
    (combine ? 0.5 : 0) -
    (clash ? 1 : 0) -
    (hard ? 0.5 : 0);
  return {
    dayStem,
    name: ilganName(dayStem),
    stemGod,
    branchGod,
    groups: [...new Set([GROUP_OF[stemGod], GROUP_OF[branchGod]])],
    stage,
    strength,
    stars,
    combine,
    clash,
    season: hard,
    score,
  };
}

// What each kind of luck brings, in plain words (the reading follows the luck, never fixes the life).
export const GROUP_BRINGS: Record<GodGroup, string> = {
  비겁: "사람과 경쟁",
  식상: "재주와 표현",
  재성: "돈과 기회",
  관성: "자리와 책임",
  인성: "공부와 문서",
};

// One luck for all ten day masters, easiest first.
export function allIlgan(stem: number, branch: number): IlganLuck[] {
  return Array.from({ length: 10 }, (_, s) => ilganLuck(s, stem, branch)).sort((a, b) => b.score - a.score || a.dayStem - b.dayStem);
}

// How one luck compares with another for a day master (this year → next year): which way the strength moves.
export function shift(dayStem: number, from: { stem: number; branch: number }, to: { stem: number; branch: number }) {
  const a = ilganLuck(dayStem, from.stem, from.branch);
  const b = ilganLuck(dayStem, to.stem, to.branch);
  return { from: a, to: b, delta: b.score - a.score };
}

export const ganzhiName = (stem: number, branch: number) => `${STEMS[stem]}${BRANCHES[branch]}`;
export const elementWord = (stem: number, branch: number) => `${ELEMENT_KO[stemEl(stem)]}, ${ELEMENT_KO[BRANCH_EL[branch]]}`;
