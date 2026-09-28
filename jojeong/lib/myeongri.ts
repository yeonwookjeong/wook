import { josa } from "./josa";
import { BRANCHES, hourStemFor, STEMS, type FullPillars, type Pillars } from "./saju";

// 자평명리 reading of the full eight-character chart: the five elements weighed through every hidden stem
// (지장간), the ten gods (십신), how strong the day master is (득령·득지·득세, the month branch weighing most),
// the frame of the chart (격국), and the balancing element (용신) by 억부 checked against the season (조후).
// Combinations (합) move or bind elements before the balance is taken, and a chart that has given itself over
// to one force is read as following it (종격).
// Only charts saved with the month pillar get this; older ones fall back.

export const ELEMENT_KO = ["목", "화", "토", "금", "수"] as const;
export const ELEMENT_HANJA = ["木", "火", "土", "金", "水"] as const;
// Branch elements: 子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水
export const BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
// Main hidden stem (본기) of each branch, used for its yin/yang in the ten gods.
const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];
export const stemEl = (stem: number) => Math.floor(stem / 2);

export type TenGod = "비견" | "겁재" | "식신" | "상관" | "편재" | "정재" | "편관" | "정관" | "편인" | "정인";
export type GodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";
export const GROUP_OF: Record<TenGod, GodGroup> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

// Element that stands in a given relation to the day master's element.
export const groupElement = (dayEl: number, g: GodGroup) =>
  ({ 비겁: dayEl, 식상: (dayEl + 1) % 5, 재성: (dayEl + 2) % 5, 관성: (dayEl + 3) % 5, 인성: (dayEl + 4) % 5 })[g];

export function tenGod(dayStem: number, otherStem: number): TenGod {
  const d = stemEl(dayStem);
  const o = stemEl(otherStem);
  const same = dayStem % 2 === otherStem % 2;
  if (o === d) return same ? "비견" : "겁재";
  if (o === (d + 1) % 5) return same ? "식신" : "상관";
  if (o === (d + 2) % 5) return same ? "편재" : "정재";
  if (o === (d + 3) % 5) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

export type Slot = { pos: "시" | "일" | "월" | "연"; stem: number | null; branch: number | null };

export function chartOf(p: FullPillars): Slot[] {
  const hourStem = hourStemFor(p);
  return [
    { pos: "시", stem: hourStem, branch: p.hourBranch },
    { pos: "일", stem: p.dayStem, branch: p.dayBranch },
    { pos: "월", stem: p.monthStem, branch: p.monthBranch },
    { pos: "연", stem: p.yearStem, branch: p.yearBranch },
  ];
}

export type Strength = "극신강" | "신강" | "신약" | "극신약";

// ── 지장간 (hidden stems): 여기 → 중기 → 본기, with the days each rules in the month (30 in all).
export const HIDDEN: [stem: number, days: number][][] = [
  [[8, 10], [9, 20]], // 子 壬癸
  [[9, 9], [7, 3], [5, 18]], // 丑 癸辛己
  [[4, 7], [2, 7], [0, 16]], // 寅 戊丙甲
  [[0, 10], [1, 20]], // 卯 甲乙
  [[1, 9], [9, 3], [4, 18]], // 辰 乙癸戊
  [[4, 7], [6, 7], [2, 16]], // 巳 戊庚丙
  [[2, 10], [5, 9], [3, 11]], // 午 丙己丁
  [[3, 9], [1, 3], [5, 18]], // 未 丁乙己
  [[4, 7], [8, 7], [6, 16]], // 申 戊壬庚
  [[6, 10], [7, 20]], // 酉 庚辛
  [[7, 9], [3, 3], [4, 18]], // 戌 辛丁戊
  [[4, 7], [0, 7], [8, 16]], // 亥 戊甲壬
];

// 궁성 보정: how much each position counts, as in the common Korean 만세력 (포스텔러 and the like): every
// stem 2, the month branch 7 (월령, 득령), the day branch 3 (득지), the year and hour branches 2 — 22 in
// all, scaled ×5 here. Each branch counts as its main element (본기); hidden stems are read for 격국 and
// the chart table, not for the balance.
export const POS_WEIGHT = { stem: { 연: 10, 월: 10, 일: 10, 시: 10 }, branch: { 연: 10, 월: 35, 일: 15, 시: 10 } } as const;

// Strength cut points on the share of weight that backs the day master. As in the classical 득령·득지·득세
// count, the day master is strong only when more than half of the chart backs it; the outer bands mark the
// extremes. The day master itself counts on its own side, as 만세력 do (real births: about 53% weak).
const CUTS = { weak: 0.25, mid: 0.5, strong: 0.7 };

export type Reading = {
  elements: number[]; // count of 木火土金水 across the chart (6 or 8 characters)
  weights: number[]; // the same, weighted by position and hidden stems (the chart's real balance)
  gods: Record<GodGroup, number>; // ten-god groups across the other characters (day stem excluded)
  godWeights: Record<GodGroup, number>; // weighted, hidden stems included
  godList: TenGod[];
  strength: Strength;
  balanced: boolean; // close to 중화 (neither clearly strong nor weak)
  support: number; // 0..1 share of weight that backs the day master
  yong: number; // 용신 element
  hee: number; // 희신: feeds the 용신
  gi: number; // 기신: attacks the 용신
  method: "억부" | "조후" | "종격";
  outer: Outer | null; // 종격: the chart follows one overwhelming force instead of being balanced
  bonds: string[]; // the combinations (합) that moved or bound elements, in words
  eokbu: number; // the 억부 answer, even when 조후 wins
  johu: number | null; // element the season calls for, when it calls urgently
  season: "봄" | "여름" | "가을" | "겨울";
  gyeok: TenGod; // 격국 from the month branch
  missing: number[];
  reasons: string[];
};

// The season of each month branch. The earth months belong to the season they close (辰 late spring, 未 late
// summer, 戌 late autumn, 丑 late winter): a 未 month is the hottest of the year, not a neutral one.
const SEASON_OF = ["겨울", "겨울", "봄", "봄", "봄", "여름", "여름", "여름", "가을", "가을", "가을", "겨울"] as const;

// 조후 보정: an earth branch in the month carries the climate of its season. The high-summer 未 reads as
// fire (丁) and the deep-winter 丑 as water (癸); 戌 on the way into winter turns partly to cold water (壬),
// and 辰 on the way out of spring partly to wood (乙). Matches 포스텔러's corrected values.
const SEASON_TURN: Record<number, [stem: number, share: number]> = { 7: [3, 1], 1: [9, 1], 10: [8, 4 / 7], 4: [1, 4 / 7] };
function branchParts(branch: number, pos: Slot["pos"]): [stem: number, share: number][] {
  const main = BRANCH_MAIN_STEM[branch];
  const turn = pos === "월" ? SEASON_TURN[branch] : undefined;
  return turn ? [[main, 1 - turn[1]], [turn[0], turn[1]]] : [[main, 1]];
}

// ── 합 (combinations), applied before the balance is taken.
// 삼합·방합: all three branches present make one element (국). The element's yin stem stands for it.
const TRIADS: [branches: number[], el: number, name: string][] = [
  [[8, 0, 4], 4, "申子辰 삼합 수국"],
  [[2, 6, 10], 1, "寅午戌 삼합 화국"],
  [[5, 9, 1], 3, "巳酉丑 삼합 금국"],
  [[11, 3, 7], 0, "亥卯未 삼합 목국"],
  [[2, 3, 4], 0, "寅卯辰 방합 목국"],
  [[5, 6, 7], 1, "巳午未 방합 화국"],
  [[8, 9, 10], 3, "申酉戌 방합 금국"],
  [[11, 0, 1], 4, "亥子丑 방합 수국"],
];
const EL_STEM = [1, 3, 5, 7, 9];
// 육합 of two neighbouring branches, and the element the pair makes.
const SIX_HAP: Record<string, number> = { "0-1": 2, "2-11": 0, "3-10": 1, "4-9": 3, "5-8": 4, "6-7": 1 };
const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
// 천간합 甲己 土, 乙庚 金, 丙辛 水, 丁壬 木, 戊癸 火.
const stemHapEl = (a: number, b: number) => (Math.abs(a - b) === 5 ? [2, 3, 4, 0, 1][Math.min(a, b)] : null);
// A bound character (합거·기반) keeps its element but loses part of its force.
const BOUND = { stem: 0.5, branch: 0.7 };

export type Outer = "종아격" | "종재격" | "종살격" | "종왕격" | "종강격";
const OUTER_OF: Record<GodGroup, Outer> = { 식상: "종아격", 재성: "종재격", 관성: "종살격", 비겁: "종왕격", 인성: "종강격" };

// 격국: the hidden stem of the month branch that shows itself among the heavenly stems (투출) sets the frame;
// with none showing, the main hidden stem (본기) does.
function gyeokOf(p: FullPillars): TenGod {
  const hourStem = hourStemFor(p);
  const shown = [p.yearStem, p.monthStem, hourStem];
  const hidden = [...HIDDEN[p.monthBranch]].reverse(); // 본기 first
  const out = hidden.find(([s]) => shown.includes(s) && s !== p.dayStem) ?? hidden[0];
  return tenGod(p.dayStem, out[0]);
}

export function readChart(p: Pillars): Reading | null {
  if (p.monthBranch === undefined || p.monthStem === undefined || p.yearStem === undefined) return null;
  const full = p as FullPillars;
  const dayEl = stemEl(full.dayStem);
  const elements = [0, 0, 0, 0, 0];
  const weights = [0, 0, 0, 0, 0];
  const gods: Record<GodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const godWeights: Record<GodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const godList: TenGod[] = [];
  let support = 0;
  let total = 0;

  // Every character as a unit: its element parts (a branch by its main element, the month's earth by its
  // season) and a force factor. Combinations then move a unit to another element or bind it.
  type Unit = { pos: Slot["pos"]; stem: boolean; char: number; w: number; parts: [stem: number, share: number][]; factor: number };
  const units: Unit[] = [];
  for (const slot of chartOf(full)) {
    if (slot.stem !== null) {
      elements[stemEl(slot.stem)]++;
      if (slot.pos !== "일") {
        const g = tenGod(full.dayStem, slot.stem);
        godList.push(g);
        gods[GROUP_OF[g]]++;
      }
      units.push({ pos: slot.pos, stem: true, char: slot.stem, w: POS_WEIGHT.stem[slot.pos], parts: [[slot.stem, 1]], factor: 1 });
    }
    if (slot.branch !== null) {
      elements[BRANCH_EL[slot.branch]]++;
      godList.push(tenGod(full.dayStem, BRANCH_MAIN_STEM[slot.branch]));
      gods[GROUP_OF[tenGod(full.dayStem, BRANCH_MAIN_STEM[slot.branch])]]++;
      units.push({ pos: slot.pos, stem: false, char: slot.branch, w: POS_WEIGHT.branch[slot.pos], parts: branchParts(slot.branch, slot.pos), factor: 1 });
    }
  }
  const at = (pos: Slot["pos"], stem: boolean) => units.find((u) => u.pos === pos && u.stem === stem);
  const branchUnits = units.filter((u) => !u.stem);
  const monthEl = BRANCH_EL[full.monthBranch];
  const EL_NAME = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
  const bonds: string[] = [];
  const moved = new Set<Unit>();
  const become = (u: Unit, el: number) => {
    u.parts = [[EL_STEM[el], 1]];
    moved.add(u);
  };
  // 삼합·방합: a full set anywhere in the chart turns its branches to one element.
  for (const [set, el, name] of TRIADS) {
    if (!set.every((b) => branchUnits.some((u) => u.char === b && !moved.has(u)))) continue;
    for (const u of branchUnits) if (set.includes(u.char) && !moved.has(u)) become(u, el);
    bonds.push(`${name}: 세 지지가 모여 ${EL_NAME(el)} 기운으로 뭉침`);
  }
  // 육합 of neighbouring branches, unless a clash from another branch breaks it. With the month on the side
  // of the element it makes, the pair turns into it (합화); otherwise the two only bind each other, the month
  // branch keeping its hold on the season.
  const NEIGHBOURS: [Slot["pos"], Slot["pos"]][] = [["연", "월"], ["월", "일"], ["일", "시"]];
  const paired = new Set<Unit>();
  for (const [a, b] of NEIGHBOURS) {
    const x = at(a, false);
    const y = at(b, false);
    if (!x || !y || moved.has(x) || moved.has(y) || paired.has(x) || paired.has(y)) continue;
    const el = SIX_HAP[pairKey(x.char, y.char)];
    if (el === undefined) continue;
    if (branchUnits.some((o) => o !== x && o !== y && (Math.abs(o.char - x.char) === 6 || Math.abs(o.char - y.char) === 6))) continue;
    paired.add(x);
    paired.add(y);
    const name = `${a}지 ${BRANCHES[x.char]}·${b}지 ${BRANCHES[y.char]} 육합`;
    if (el === monthEl) {
      become(x, el);
      become(y, el);
      bonds.push(`${name}: 태어난 달이 ${EL_NAME(el)} 기운이라 합이 이루어져 ${EL_NAME(el)}로 변함(합화)`);
    } else {
      for (const u of [x, y]) if (u.pos !== "월") u.factor = BOUND.branch;
      bonds.push(`${name}: 서로 묶여 제 힘을 다 쓰지 못함`);
    }
  }
  // 천간합 of neighbouring stems. The day master never changes: a stem combining with it is bound to it in
  // affection (유정), not weakened. The year and month stems combining turn with the month, or bind.
  for (const [a, b] of NEIGHBOURS) {
    const x = at(a, true);
    const y = at(b, true);
    if (!x || !y) continue;
    const el = stemHapEl(x.char, y.char);
    if (el === null) continue;
    const name = `${a}간 ${STEMS[x.char]}·${b}간 ${STEMS[y.char]} 천간합`;
    if (a === "일" || b === "일") bonds.push(`${name}: 일간과 정으로 묶임(유정), 힘은 그대로`);
    else if (el === monthEl) {
      become(x, el);
      become(y, el);
      bonds.push(`${name}: 태어난 달이 ${EL_NAME(el)} 기운이라 ${EL_NAME(el)}로 변함(합화)`);
    } else {
      x.factor = BOUND.stem;
      y.factor = BOUND.stem;
      bonds.push(`${name}: 서로 묶여 제 힘을 다 쓰지 못함`);
    }
  }

  for (const u of units) {
    if (u.stem && u.pos === "일") {
      // The day master counts toward the balance and backs itself (득세 counts it, as 만세력 do).
      weights[dayEl] += u.w;
      support += u.w;
      total += u.w;
      continue;
    }
    for (const [stem, share] of u.parts) {
      const part = u.w * share * u.factor;
      const g = GROUP_OF[tenGod(full.dayStem, stem)];
      godWeights[g] += part;
      weights[stemEl(stem)] += part;
      total += part;
      if (g === "비겁" || g === "인성") support += part;
    }
  }

  const share = support / total;
  const strength: Strength = share >= CUTS.strong ? "극신강" : share >= CUTS.mid ? "신강" : share > CUTS.weak ? "신약" : "극신약";
  const balanced = Math.abs(share - CUTS.mid) < 0.06; // 중화에 가까움
  const strong = share >= CUTS.mid;

  // 종격: a day master with no root, no help showing and one draining force filling the chart gives itself
  // over to that force; one backed by nearly everything, with no officer or wealth to check it, follows its
  // own side. Kept strict (진종 only).
  const helps = (e: number) => e === dayEl || e === (dayEl + 4) % 5;
  const rooted = branchUnits.some((u) => (moved.has(u) ? u.parts.some(([st]) => stemEl(st) === dayEl) : HIDDEN[u.char].some(([h]) => stemEl(h) === dayEl)));
  const helpShows = units.some((u) => u.stem && u.pos !== "일" && u.factor === 1 && helps(stemEl(u.parts[0][0])));
  // An officer anywhere, even hidden in a branch, keeps a strong chart from following itself.
  const officerAnywhere =
    godWeights.관성 > 0 || branchUnits.some((u) => !moved.has(u) && HIDDEN[u.char].some(([h]) => stemEl(h) === (dayEl + 3) % 5));
  let outer: Outer | null = null;
  if (share < 0.15 && !rooted && !helpShows) {
    const drains: GodGroup[] = ["식상", "재성", "관성"];
    const lead = drains.reduce((a, b) => (godWeights[b] > godWeights[a] ? b : a));
    // Following the officer fails when the output that attacks it is also strong.
    const attacked = lead === "관성" && godWeights.식상 / total >= 0.15;
    if (godWeights[lead] / total >= 0.45 && !attacked) outer = OUTER_OF[lead];
  } else if (share >= 0.85 && godWeights.재성 / total < 0.06 && !officerAnywhere) {
    outer = OUTER_OF[godWeights.비겁 >= godWeights.인성 ? "비겁" : "인성"];
  }

  // 억부: a strong day master wants what drains or checks it, a weak one what feeds or backs it — and which
  // one depends on what made it strong or weak. An element the chart is already heavy in is no cure, so the
  // next remedy in line is taken instead.
  const el = (g: GodGroup) => groupElement(dayEl, g);
  const sum = weights.reduce((a, b) => a + b, 0);
  let remedies: GodGroup[];
  if (strong) {
    if (godWeights.인성 > godWeights.비겁) remedies = ["재성", "식상", "관성"]; // 재극인: break the surplus resource
    else if (godWeights.관성 >= 6) remedies = ["관성", "식상", "재성"]; // crowded peers, an officer keeps order
    else remedies = ["식상", "재성", "관성"]; // no officer to lean on, let the surplus flow out
  } else {
    const drains: GodGroup[] = ["식상", "재성", "관성"];
    const heaviest = drains.reduce((a, b) => (godWeights[b] > godWeights[a] ? b : a));
    remedies = heaviest === "재성" ? ["비겁", "인성"] : ["인성", "비겁"]; // 재다신약 wants peers; 관살·식상 wants resource
  }
  // Only an element that already dominates the chart is passed over: a remedy that is present and working is
  // still the 용신 (in 토다금매 the wood that breaks the earth, not the water the earth would bury).
  const pick = remedies.find((g) => weights[el(g)] / sum < 0.4) ?? remedies.reduce((a, b) => (weights[el(b)] < weights[el(a)] ? b : a));
  const eokbu = el(pick);

  // 조후: a chart born deep in summer with no water, or deep in winter with no fire, needs that first.
  const season = SEASON_OF[full.monthBranch];
  const heat = weights[1] + (season === "여름" ? 18 : 0);
  const cold = weights[4] + (season === "겨울" ? 18 : 0);
  let johu: number | null = null;
  if (season === "여름" && weights[4] < 10 && heat - weights[4] > 25) johu = 4;
  else if (season === "겨울" && weights[1] < 10 && cold - weights[1] > 25) johu = 1;
  // The season wins when it pulls the same way as 억부 (or the element is all but absent); otherwise 억부 stands.
  const backs = (e: number) => e === dayEl || e === el("인성");
  const aligned = johu !== null && (strong ? !backs(johu) : backs(johu));
  const followed = outer ? (Object.keys(OUTER_OF) as GodGroup[]).find((g) => OUTER_OF[g] === outer)! : null;
  const method = followed ? "종격" : johu !== null && johu !== eokbu && (aligned || weights[johu] < 4) ? "조후" : "억부";
  const yong = followed ? el(followed) : method === "조후" ? johu! : eokbu;
  // 희신 is what feeds the 용신, unless that would feed the wrong side: a strong chart's 식상 용신 is fed by the
  // day master's own element, so its 희신 is what the 용신 feeds (식상생재); a weak chart's 인성 용신 is fed by
  // the officer that attacks the day master, so its 희신 is the day master's own element.
  const feeds = (yong + 4) % 5;
  const hee = followed || method === "조후" ? feeds : strong && backs(feeds) ? (yong + 1) % 5 : !strong && !backs(feeds) ? dayEl : feeds;
  const gi = (yong + 3) % 5;
  const missing = elements.flatMap((n, i) => (n === 0 ? [i] : []));
  const gyeok = gyeokOf(full);

  const dayName = `${ELEMENT_KO[dayEl]}(${ELEMENT_HANJA[dayEl]})`;
  const yongName = `${ELEMENT_KO[yong]}(${ELEMENT_HANJA[yong]})`;
  const reasons = [
    monthEl === dayEl
      ? `${season}의 달에 태어난 ${dayName} 일간이라 제철을 만나 기운이 실하옵니다`
      : (monthEl + 1) % 5 === dayEl
        ? `${season}의 달이 ${dayName} 일간을 생(生)해 주니 뿌리가 든든하옵니다`
        : `${season}의 달에 태어난 ${dayName} 일간이라 제철을 벗어나 기운이 여위옵니다`,
    `태어난 달의 기운이 ${josa(GOD_GLOSS[gyeok], "으로/로")} 드러나니 ${GYEOK_NAME[gyeok]}의 그릇이옵니다`,
    method === "종격"
      ? `일간이 기댈 뿌리 없이 한 기운이 사주를 채우니, 버티지 않고 그 흐름을 따르는 ${outer}이옵니다. ${yongName} 기운이 용신이옵니다`
      : method === "조후"
      ? `${season}에 태어나 ${johu === 4 ? "물이 말라 조열하니" : "불이 꺼져 한습하니"}, 무엇보다 ${yongName} 기운이 급한 용신이옵니다`
      : `하여 ${balanced ? "중화에 가까운 " : ""}${strength}한 사주이니, ${yongName} 기운이 전하를 돕는 용신이옵니다`,
  ];
  return { elements, weights, gods, godWeights, godList, strength, balanced, support: share, yong, hee, gi, method, outer, bonds, eokbu, johu, season, gyeok, missing, reasons };
}

// A plain-words gloss of each ten god, for sentences that name one.
export const GOD_GLOSS: Record<TenGod, string> = {
  비견: "제 힘(비견)",
  겁재: "다투는 힘(겁재)",
  식신: "재주(식신)",
  상관: "끼와 말(상관)",
  편재: "큰 재물(편재)",
  정재: "알뜰한 재물(정재)",
  편관: "거센 책임(편관)",
  정관: "바른 명예(정관)",
  편인: "남다른 촉(편인)",
  정인: "배움과 보살핌(정인)",
};

export const GYEOK_NAME: Record<TenGod, string> = {
  비견: "건록격",
  겁재: "양인격",
  식신: "식신격",
  상관: "상관격",
  편재: "편재격",
  정재: "정재격",
  편관: "칠살격",
  정관: "정관격",
  편인: "편인격",
  정인: "정인격",
};

// How much of a given element someone's chart carries (6 or 8 characters; 4-character legacy charts count what they have).
export function elementCount(p: Pillars, el: number): number {
  const stems = [p.dayStem, p.monthStem, p.yearStem, hourStemFor(p) ?? undefined];
  const branches = [p.dayBranch, p.monthBranch, p.yearBranch, p.hourBranch ?? undefined];
  return (
    stems.filter((s): s is number => s !== undefined && stemEl(s) === el).length +
    branches.filter((b): b is number => b !== undefined && BRANCH_EL[b] === el).length
  );
}
