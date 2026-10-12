import { BRANCH_EL, ELEMENT_HANJA, ELEMENT_KO, elementCount, readChart, stemEl, type GodGroup } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, hourStemFor, STEMS } from "./saju";
import { monthMarks, monthsOf } from "./yeonun";

// The pictures beside an answer (app/ask/Figures.tsx), worked out from the chart, never written by the model: the
// eight characters with the ones this question touches lit, the balance of the five elements, and the months
// ahead with the ones where the question's star comes in. The model reads the same chart and month verdicts
// (lib/ask.ts context), so the pictures and the letter agree.

const GROUPS: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
const groupOfEl = (dayEl: number, el: number) => GROUPS[(el - dayEl + 5) % 5];

type Lens = { group: GodGroup | null; star: string; place: { pos: "일" | "월"; part: "branch" | "both"; label: string } | null };

// What each topic looks at: a star (one of the five groups, from the day stem) and a seat in the chart.
function lensOf(topic: string, gender: Person["gender"]): Lens {
  if (topic === "연애")
    return {
      group: gender === "f" ? "관성" : "재성",
      star: gender === "f" ? "남편·연인의 별" : gender === "m" ? "아내·연인의 별" : "연인의 별",
      place: { pos: "일", part: "branch", label: "배우자 자리" },
    };
  if (topic === "일") return { group: "관성", star: "일과 자리의 별", place: { pos: "월", part: "both", label: "사회 자리" } };
  if (topic === "돈") return { group: "재성", star: "재물의 별", place: null };
  if (topic === "사람") return { group: "비겁", star: "곁사람의 별", place: { pos: "월", part: "both", label: "곁사람 자리" } };
  return { group: null, star: "", place: null };
}

export type FigureCell = { ch: string; el: number; lit: boolean };
export type FigureCol = { pos: "시" | "일" | "월" | "연"; stem: FigureCell | null; branch: FigureCell | null; seat: string | null };
export type FigureMonth = { label: string; from: string; rating: 0 | 1 | 2 | 3; star: boolean; now: boolean };
export type Figures = {
  star: string;
  group: GodGroup | null;
  starEl: number | null;
  seat: string | null;
  chart: FigureCol[];
  elements: { el: number; n: number }[];
  months: FigureMonth[];
};

export function figuresOf(person: Person, topic: string, at: number): Figures | null {
  const p = person.pillars;
  const r = readChart(p);
  if (!r || p.monthStem === undefined || p.monthBranch === undefined || p.yearStem === undefined) return null;
  const dayEl = stemEl(p.dayStem);
  const lens = lensOf(topic, person.gender);
  const starEl = lens.group ? GROUPS.indexOf(lens.group) : -1;
  const starElement = lens.group ? (dayEl + starEl) % 5 : null;
  const cell = (ch: string, el: number, mine: boolean): FigureCell => ({ ch, el, lit: !mine && starElement !== null && el === starElement });
  const hourStem = hourStemFor(p);
  const cols: { pos: FigureCol["pos"]; stem: number | null; branch: number | null }[] = [
    { pos: "시", stem: hourStem, branch: p.hourBranch },
    { pos: "일", stem: p.dayStem, branch: p.dayBranch },
    { pos: "월", stem: p.monthStem, branch: p.monthBranch },
    { pos: "연", stem: p.yearStem, branch: p.yearBranch },
  ];
  const chart = cols.map((c) => ({
    pos: c.pos,
    stem: c.stem === null ? null : cell(STEMS[c.stem], stemEl(c.stem), c.pos === "일"),
    branch: c.branch === null ? null : cell(BRANCHES[c.branch], BRANCH_EL[c.branch], false),
    seat: lens.place?.pos === c.pos ? lens.place.label : null,
  }));
  const elements = [0, 1, 2, 3, 4].map((el) => ({ el, n: elementCount(p, el) }));

  // The month of the answer and five after it, across the turn of the year.
  const kst = new Date(at + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const all = [y - 1, y, y + 1].flatMap((yy) => {
    const marks = monthMarks(p, r, yy);
    return monthsOf(yy).map((m, i) => {
      const [mm, dd] = m.from.split("/").map(Number);
      const year = mm === 1 && i > 0 ? yy + 1 : yy;
      return { t: Date.UTC(year, mm - 1, dd), mm, from: m.from, rating: marks[i].rating, stem: m.stem, branch: m.branch, year };
    });
  });
  const nowT = Date.UTC(y, kst.getUTCMonth(), kst.getUTCDate());
  const start = all.findLastIndex((m) => m.t <= nowT);
  const months = all.slice(Math.max(0, start), Math.max(0, start) + 6).map((m, i) => ({
    label: `${m.year !== y ? "내년 " : ""}${m.mm}월`,
    from: m.from,
    rating: m.rating,
    star: starElement !== null && (stemEl(m.stem) === starElement || BRANCH_EL[m.branch] === starElement),
    now: i === 0,
  }));

  return { star: lens.star, group: lens.group, starEl: starElement, seat: lens.place?.label ?? null, chart, elements, months };
}

export const elName = (el: number) => `${ELEMENT_KO[el]}(${ELEMENT_HANJA[el]})`;
export { groupOfEl };
