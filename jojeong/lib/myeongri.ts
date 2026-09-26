import { josa } from "./josa";
import type { FullPillars, Pillars } from "./saju";

// 자평명리 reading of the full eight-character chart: the five elements weighed through every hidden stem
// (지장간), the ten gods (십신), how strong the day master is (득령·득지·득세, the month branch weighing most),
// the frame of the chart (격국), and the balancing element (용신) by 억부 checked against the season (조후).
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
  const hourStem = p.hourBranch === null ? null : ((p.dayStem % 5) * 2 + p.hourBranch) % 10;
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

// How much each position counts toward the day master's strength. The month branch (월령, 득령) outweighs
// everything, the day branch (득지) comes next; stems count less than the branches they sit on.
const POS_WEIGHT = { stem: { 연: 8, 월: 12, 시: 10 }, branch: { 연: 10, 월: 30, 일: 16, 시: 12 } } as const;

// Strength cut points on the share of weight that backs the day master. Set at the 12th / 50th / 88th
// percentiles of real birth charts (1950–2008) so the four labels stay evenly spread.
const CUTS = { weak: 0.2, mid: 0.393, strong: 0.607 };

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
  method: "억부" | "조후";
  eokbu: number; // the 억부 answer, even when 조후 wins
  johu: number | null; // element the season calls for, when it calls urgently
  season: "봄" | "여름" | "환절기" | "가을" | "겨울";
  gyeok: TenGod; // 격국 from the month branch
  missing: number[];
  reasons: string[];
};

const SEASON_OF = ["겨울", "겨울", "봄", "봄", "환절기", "여름", "여름", "환절기", "가을", "가을", "환절기", "겨울"] as const;

// 격국: the hidden stem of the month branch that shows itself among the heavenly stems (투출) sets the frame;
// with none showing, the main hidden stem (본기) does.
function gyeokOf(p: FullPillars): TenGod {
  const hourStem = p.hourBranch === null ? null : ((p.dayStem % 5) * 2 + p.hourBranch) % 10;
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

  for (const slot of chartOf(full)) {
    if (slot.stem !== null) {
      elements[stemEl(slot.stem)]++;
      if (slot.pos === "일") weights[dayEl] += 10;
      else {
        const w = POS_WEIGHT.stem[slot.pos];
        const g = tenGod(full.dayStem, slot.stem);
        godList.push(g);
        gods[GROUP_OF[g]]++;
        godWeights[GROUP_OF[g]] += w;
        weights[stemEl(slot.stem)] += w;
        total += w;
        if (GROUP_OF[g] === "비겁" || GROUP_OF[g] === "인성") support += w;
      }
    }
    if (slot.branch !== null) {
      elements[BRANCH_EL[slot.branch]]++;
      godList.push(tenGod(full.dayStem, BRANCH_MAIN_STEM[slot.branch]));
      gods[GROUP_OF[tenGod(full.dayStem, BRANCH_MAIN_STEM[slot.branch])]]++;
      // A branch counts through every stem hidden in it, each by the share of the month it rules.
      const w = POS_WEIGHT.branch[slot.pos];
      for (const [stem, days] of HIDDEN[slot.branch]) {
        const part = (w * days) / 30;
        const g = GROUP_OF[tenGod(full.dayStem, stem)];
        godWeights[g] += part;
        weights[stemEl(stem)] += part;
        total += part;
        if (g === "비겁" || g === "인성") support += part;
      }
    }
  }

  const share = support / total;
  const strength: Strength = share >= CUTS.strong ? "극신강" : share >= CUTS.mid ? "신강" : share > CUTS.weak ? "신약" : "극신약";
  const balanced = Math.abs(share - CUTS.mid) < 0.05;
  const strong = share >= CUTS.mid;

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
  const pick = remedies.find((g) => weights[el(g)] / sum < 0.25) ?? remedies.reduce((a, b) => (weights[el(b)] < weights[el(a)] ? b : a));
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
  const method = johu !== null && johu !== eokbu && (aligned || weights[johu] < 4) ? "조후" : "억부";
  const yong = method === "조후" ? johu! : eokbu;
  const hee = (yong + 4) % 5;
  const gi = (yong + 3) % 5;
  const missing = elements.flatMap((n, i) => (n === 0 ? [i] : []));
  const gyeok = gyeokOf(full);

  const monthEl = BRANCH_EL[full.monthBranch];
  const dayName = `${ELEMENT_KO[dayEl]}(${ELEMENT_HANJA[dayEl]})`;
  const yongName = `${ELEMENT_KO[yong]}(${ELEMENT_HANJA[yong]})`;
  const reasons = [
    monthEl === dayEl
      ? `${season}의 달에 태어난 ${dayName} 일간이라 제철을 만나 기운이 실하옵니다`
      : (monthEl + 1) % 5 === dayEl
        ? `${season}의 달이 ${dayName} 일간을 생(生)해 주니 뿌리가 든든하옵니다`
        : `${season}의 달에 태어난 ${dayName} 일간이라 제철을 벗어나 기운이 여위옵니다`,
    `태어난 달의 기운이 ${josa(GOD_GLOSS[gyeok], "으로/로")} 드러나니 ${GYEOK_NAME[gyeok]}의 그릇이옵니다`,
    method === "조후"
      ? `${season}에 태어나 ${johu === 4 ? "물이 말라 조열하니" : "불이 꺼져 한습하니"}, 무엇보다 ${yongName} 기운이 급한 용신이옵니다`
      : `하여 ${balanced ? "중화에 가까운 " : ""}${strength}한 사주이니, ${yongName} 기운이 전하를 돕는 용신이옵니다`,
  ];
  return { elements, weights, gods, godWeights, godList, strength, balanced, support: share, yong, hee, gi, method, eokbu, johu, season, gyeok, missing, reasons };
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
  const stems = [p.dayStem, p.monthStem, p.yearStem, p.hourBranch === null ? undefined : ((p.dayStem % 5) * 2 + p.hourBranch) % 10];
  const branches = [p.dayBranch, p.monthBranch, p.yearBranch, p.hourBranch ?? undefined];
  return (
    stems.filter((s): s is number => s !== undefined && stemEl(s) === el).length +
    branches.filter((b): b is number => b !== undefined && BRANCH_EL[b] === el).length
  );
}
