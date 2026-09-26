import type { FullPillars, Pillars } from "./saju";

// A deliberately small 자평명리 reading of the full eight-character chart: the five-element count, the ten
// gods (십신), how strong the day master is (신강/신약, weighing the month branch most, 득령·득지·득세), and the
// balancing element (용신, 억부 method). Only charts saved with the month pillar get this; older ones fall back.

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

export type Reading = {
  elements: number[]; // count of 木火土金水 across the chart (6 or 8 characters)
  gods: Record<GodGroup, number>; // ten-god groups across the other characters (day stem excluded)
  godList: TenGod[];
  strength: Strength;
  support: number; // 0..1 share of weight that backs the day master
  yong: number; // 용신 element
  gi: number; // 기신 element (the one that attacks 용신)
  missing: number[];
  reasons: string[];
};

export function readChart(p: Pillars): Reading | null {
  if (p.monthBranch === undefined || p.monthStem === undefined || p.yearStem === undefined) return null;
  const full = p as FullPillars;
  const dayEl = stemEl(full.dayStem);
  const elements = [0, 0, 0, 0, 0];
  const gods: Record<GodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const godList: TenGod[] = [];
  let support = 0;
  let total = 0;

  for (const slot of chartOf(full)) {
    if (slot.stem !== null) {
      elements[stemEl(slot.stem)]++;
      if (slot.pos !== "일") {
        const g = tenGod(full.dayStem, slot.stem);
        godList.push(g);
        gods[GROUP_OF[g]]++;
        total += 1;
        if (GROUP_OF[g] === "비겁" || GROUP_OF[g] === "인성") support += 1;
      }
    }
    if (slot.branch !== null) {
      elements[BRANCH_EL[slot.branch]]++;
      const g = tenGod(full.dayStem, BRANCH_MAIN_STEM[slot.branch]);
      godList.push(g);
      gods[GROUP_OF[g]]++;
      // The month branch (득령) outweighs everything; the day branch (득지) comes next.
      const w = slot.pos === "월" ? 3 : slot.pos === "일" ? 1.5 : 1;
      total += w;
      if (GROUP_OF[g] === "비겁" || GROUP_OF[g] === "인성") support += w;
    }
  }

  const share = support / total;
  // Cut points follow the spread of real charts (median share ≈ 0.4), so strong and weak come out about even.
  const strength: Strength = share >= 0.65 ? "극신강" : share >= 0.4 ? "신강" : share > 0.15 ? "신약" : "극신약";

  // 억부: a strong day master wants whatever drains or checks it (the scarcest of 식상·재성·관성);
  // a weak one wants resource (인성), or peers (비겁) if resource is already plentiful.
  let yong: number;
  if (share >= 0.4) {
    const outlets: GodGroup[] = ["식상", "재성", "관성"];
    const pick = outlets.reduce((a, b) => (elements[groupElement(dayEl, b)] < elements[groupElement(dayEl, a)] ? b : a));
    yong = groupElement(dayEl, pick);
  } else {
    yong = elements[groupElement(dayEl, "인성")] >= 3 ? dayEl : groupElement(dayEl, "인성");
  }
  const gi = (yong + 3) % 5;
  const missing = elements.flatMap((n, i) => (n === 0 ? [i] : []));

  const monthEl = BRANCH_EL[full.monthBranch];
  const season = ["봄", "여름", "환절기", "가을", "겨울"][monthEl];
  const dayName = `${ELEMENT_KO[dayEl]}(${ELEMENT_HANJA[dayEl]})`;
  const reasons = [
    monthEl === dayEl
      ? `${season}의 달에 태어난 ${dayName} 일간이라 제철을 만나 기운이 실하옵니다`
      : (monthEl + 1) % 5 === dayEl
        ? `${season}의 달이 ${dayName} 일간을 생(生)해 주니 뿌리가 든든하옵니다`
        : `${season}의 달에 태어난 ${dayName} 일간이라 제철을 벗어나 기운이 여위옵니다`,
    `하여 ${strength}한 사주이니, ${ELEMENT_KO[yong]}(${ELEMENT_HANJA[yong]}) 기운이 전하를 돕는 용신이옵니다`,
  ];
  return { elements, gods, godList, strength, support: share, yong, gi, missing, reasons };
}

// How much of a given element someone's chart carries (6 or 8 characters; 4-character legacy charts count what they have).
export function elementCount(p: Pillars, el: number): number {
  const stems = [p.dayStem, p.monthStem, p.yearStem, p.hourBranch === null ? undefined : ((p.dayStem % 5) * 2 + p.hourBranch) % 10];
  const branches = [p.dayBranch, p.monthBranch, p.yearBranch, p.hourBranch ?? undefined];
  return (
    stems.filter((s): s is number => s !== undefined && stemEl(s) === el).length +
    branches.filter((b): b is number => b !== undefined && BRANCH_EL[b] === el).length
  );
}
