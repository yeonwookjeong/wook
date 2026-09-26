import { BRANCH_EL, stemEl } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO, type Pillars } from "./saju";

// The finer layers of a chart reading: 12운성, 신살, 공망, and how branches and stems meet (합·충·형·파·해·원진).

export const ganzhi = (stem: number, branch: number) => `${STEMS[stem]}${BRANCHES[branch]}`;
export const ganzhiKo = (stem: number, branch: number) => `${STEMS_KO[stem]}${BRANCHES_KO[branch]}`;

// ── 12운성: the day master's life stage at a branch. Yang stems run forward from their 장생, yin stems backward.
export const STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
export type Stage = (typeof STAGES)[number];
const BIRTH_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯
export function stageOf(stem: number, branch: number): Stage {
  const start = BIRTH_BRANCH[stem];
  return STAGES[stem % 2 === 0 ? (branch - start + 12) % 12 : (start - branch + 12) % 12];
}

// ── 신살
const TRIAD_HEAD = (b: number) => [8, 5, 2, 11][b % 4]; // 申子辰→申, 巳酉丑→巳, 寅午戌→寅, 亥卯未→亥
// 삼합 group of a branch, keyed by its 생지 (申 巳 寅 亥).
const DOHWA: Record<number, number> = { 8: 9, 5: 6, 2: 3, 11: 0 }; // 도화: 申子辰→酉, 巳酉丑→午, 寅午戌→卯, 亥卯未→子
const YEOKMA: Record<number, number> = { 8: 2, 5: 11, 2: 8, 11: 5 }; // 역마: 申子辰→寅, 巳酉丑→亥, 寅午戌→申, 亥卯未→巳
const HWAGAE: Record<number, number> = { 8: 4, 5: 1, 2: 10, 11: 7 }; // 화개: 申子辰→辰, 巳酉丑→丑, 寅午戌→戌, 亥卯未→未
const CHEONEUL: number[][] = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]]; // 천을귀인 by day stem
const MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3]; // 문창귀인 by day stem
const YANGIN: Record<number, number> = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 }; // 양인 (yang day stems)

export type Sal = "천을귀인" | "문창귀인" | "도화" | "역마" | "화개" | "양인" | "공망";

// Which 신살 a branch carries for this chart (read from the year and day branches, as is usual).
export function salsAt(p: Pillars, branch: number): Sal[] {
  const out: Sal[] = [];
  if (CHEONEUL[p.dayStem].includes(branch)) out.push("천을귀인");
  if (MUNCHANG[p.dayStem] === branch) out.push("문창귀인");
  const heads = new Set([TRIAD_HEAD(p.yearBranch), TRIAD_HEAD(p.dayBranch)]);
  if ([...heads].some((h) => DOHWA[h] === branch)) out.push("도화");
  if ([...heads].some((h) => YEOKMA[h] === branch)) out.push("역마");
  if ([...heads].some((h) => HWAGAE[h] === branch)) out.push("화개");
  if (YANGIN[p.dayStem] === branch) out.push("양인");
  if (gongmang(p).includes(branch)) out.push("공망");
  return out;
}

// 공망: the two branches left over in the day pillar's ten-day cycle (순중공망).
export function gongmang(p: Pillars): number[] {
  const start = (p.dayBranch - p.dayStem + 12) % 12;
  return [(start + 10) % 12, (start + 11) % 12];
}

// 괴강·백호 day pillars.
export const isGoegang = (p: Pillars) => ["6-4", "6-10", "8-4", "8-10", "4-10"].includes(`${p.dayStem}-${p.dayBranch}`);
export const isBaekho = (p: Pillars) => ["0-4", "1-7", "2-10", "3-1", "4-4", "8-10", "9-1"].includes(`${p.dayStem}-${p.dayBranch}`);

// ── Meetings between two branches, strongest first.
export type Meeting = "육합" | "삼합" | "방합" | "충" | "형" | "원진" | "해" | "파";
const pair = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const WONJIN = new Set(["0-7", "1-6", "2-9", "3-8", "4-11", "5-10"]);
const HAE = new Set(["0-7", "1-6", "2-5", "3-4", "8-11", "9-10"]);
const PA = new Set(["0-9", "3-6", "2-11", "5-8", "1-4", "7-10"]);
const HYEONG = new Set(["2-5", "5-8", "2-8", "1-10", "7-10", "1-7", "0-3"]); // 寅巳申, 丑戌未, 子卯
const SELF_HYEONG = new Set([4, 6, 9, 11]); // 辰午酉亥 자형
const SEASON_GROUP = (b: number) => Math.floor(((b + 10) % 12) / 3); // 寅卯辰 / 巳午未 / 申酉戌 / 亥子丑

export function meetings(a: number, b: number): Meeting[] {
  const out: Meeting[] = [];
  const k = pair(a, b);
  if (a === b) {
    if (SELF_HYEONG.has(a)) out.push("형");
    return out;
  }
  if ((a + b) % 12 === 1) out.push("육합");
  if (a % 4 === b % 4) out.push("삼합");
  else if (SEASON_GROUP(a) === SEASON_GROUP(b)) out.push("방합");
  if (Math.abs(a - b) === 6) out.push("충");
  if (HYEONG.has(k)) out.push("형");
  if (WONJIN.has(k)) out.push("원진");
  if (HAE.has(k)) out.push("해");
  if (PA.has(k)) out.push("파");
  return out;
}

// Stems: 합 (甲己 乙庚 丙辛 丁壬 戊癸) and 충 (甲庚 乙辛 丙壬 丁癸).
export const stemCombine = (a: number, b: number) => Math.abs(a - b) === 5;
export const stemClash = (a: number, b: number) => Math.abs(a - b) === 6 && stemEl(a) !== 2 && stemEl(b) !== 2;
export const COMBINE_INTO = [2, 3, 4, 0, 1]; // 甲己→土, 乙庚→金, 丙辛→水, 丁壬→木, 戊癸→火 (by min stem % 5)

export const branchEl = (b: number) => BRANCH_EL[b];
