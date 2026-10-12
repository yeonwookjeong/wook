import { manseOf, salHanja, type ManseCol } from "./freePreview";
import { BRANCH_EL, chartOf, GROUP_OF, HIDDEN, readChart, stemEl, tenGod, type GodGroup, type Slot } from "./myeongri";
import type { Person } from "./pairToken";
import { perHundred, distinctOf } from "./rarity";
import { isFull } from "./saju";
import { monthMarks, monthsOf } from "./yeonun";

// The pictures beside an answer (app/ask/Figures.tsx), worked out from the chart, never written by the model:
// what sets this chart apart (lib/rarity.ts), the 만세력 with the characters this question touches lit, the
// five elements as the reports weigh them (궁성·조후 보정, lib/myeongri.ts), and the months ahead. The model
// reads the same chart and month verdicts (lib/ask.ts context), so the pictures and the letter agree.

const GROUPS: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
const GROUP_GODS: Record<GodGroup, string> = { 비겁: "비견·겁재", 식상: "식신·상관", 재성: "편재·정재", 관성: "편관·정관", 인성: "편인·정인" };

type Lens = { topic: string; group: GodGroup | null; star: string; seat: { pos: Slot["pos"]; label: string; branchOnly?: boolean } | null };

// The topic picked, or (for 기타) read from the words of the question.
const WORDS: [string, RegExp][] = [
  ["연애", /연애|사랑|남자|여자|애인|연인|남친|여친|썸|소개팅|결혼|이별|재회|배우자|짝사랑|고백/],
  ["일", /이직|회사|직장|취업|퇴사|승진|사업|창업|시험|합격|진로|면접|커리어|공부/],
  ["돈", /돈|투자|재테크|빚|대출|월급|연봉|매출|부동산|주식|저축|수입/],
  ["사람", /친구|가족|부모|엄마|아빠|형제|자매|동료|상사|관계|사람|인간관계/],
];
export const topicOf = (topic: string, question: string) => (topic !== "기타" ? topic : (WORDS.find(([, re]) => re.test(question))?.[0] ?? "기타"));

function lensOf(topic: string, gender: Person["gender"]): Lens {
  if (topic === "연애")
    return {
      topic,
      group: gender === "f" ? "관성" : "재성",
      star: gender === "f" ? "남편·연인의 별" : gender === "m" ? "아내·연인의 별" : "연인의 별",
      seat: { pos: "일", label: "배우자 자리", branchOnly: true },
    };
  if (topic === "일") return { topic, group: "관성", star: "일과 자리의 별", seat: { pos: "월", label: "일터 자리" } };
  if (topic === "돈") return { topic, group: "재성", star: "재물의 별", seat: null };
  if (topic === "사람") return { topic, group: "비겁", star: "곁사람의 별", seat: { pos: "월", label: "곁사람 자리" } };
  return { topic, group: null, star: "", seat: null };
}

export type FigureCol = ManseCol & {
  stem: number | null;
  branch: number | null;
  stemLit: boolean;
  branchLit: boolean;
  hiddenLit: boolean; // the star sits in this branch's hidden stems (not its main one)
  seat: string | null;
  seatStem: boolean;
};
export type FigureMonth = { label: string; from: string; rating: 0 | 1 | 2 | 3; star: boolean; now: boolean; tags: string[] };
export type Figures = {
  lens: Lens;
  gods: string; // the ten gods that make the star: "편재·정재"
  starEl: number | null;
  cols: FigureCol[];
  lit: number; // stars among the eight (main characters)
  hiddenLit: number; // more in hidden stems
  share: number[]; // 0..100 per element, weighted as the reports do
  count: number[]; // characters per element
  yong: number;
  strength: string;
  months: FigureMonth[];
  rare: { plain: string; term: string; rate: string; meaning: string }[];
};

export function figuresOf(person: Person, topic: string, question: string, at: number): Figures | null {
  const p = person.pillars;
  const r = readChart(p);
  const manse = manseOf(p);
  if (!r || !manse || !isFull(p)) return null;
  const lens = lensOf(topicOf(topic, question), person.gender);
  const starEl = lens.group ? (stemEl(p.dayStem) + GROUPS.indexOf(lens.group)) % 5 : null;
  const isStar = (stem: number) => lens.group !== null && GROUP_OF[tenGod(p.dayStem, stem)] === lens.group;

  const cols = chartOf(p).map((s, i) => {
    const hidden = s.branch === null ? [] : HIDDEN[s.branch].map(([h]) => h);
    const main = hidden.at(-1);
    return {
      ...manse[i],
      stem: s.stem,
      branch: s.branch,
      stemLit: s.stem !== null && s.pos !== "일" && isStar(s.stem),
      branchLit: main !== undefined && isStar(main),
      hiddenLit: main !== undefined && !isStar(main) && hidden.some(isStar),
      seat: lens.seat?.pos === s.pos ? lens.seat.label : null,
      seatStem: lens.seat?.pos === s.pos && !lens.seat.branchOnly,
    };
  });
  const lit = cols.reduce((n, c) => n + (c.stemLit ? 1 : 0) + (c.branchLit ? 1 : 0), 0);
  const hiddenLit = cols.filter((c) => c.hiddenLit).length;

  const sum = r.weights.reduce((a, b) => a + b, 0) || 1;
  const share = r.weights.map((w) => Math.round((100 * w) / sum));

  // The month of the answer and five after it, across the turn of the year.
  const kst = new Date(at + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const all = [y - 1, y, y + 1].flatMap((yy) => {
    const marks = monthMarks(p, r, yy);
    return monthsOf(yy).map((m, i) => {
      const [mm, dd] = m.from.split("/").map(Number);
      const year = mm === 1 && i > 0 ? yy + 1 : yy;
      return { t: Date.UTC(year, mm - 1, dd), mm, from: m.from, mark: marks[i], stem: m.stem, branch: m.branch, year };
    });
  });
  const nowT = Date.UTC(y, kst.getUTCMonth(), kst.getUTCDate());
  const start = Math.max(
    0,
    all.findLastIndex((m) => m.t <= nowT),
  );
  const months = all.slice(start, start + 6).map((m, i) => ({
    label: `${m.year !== y ? "내년 " : ""}${m.mm}월`,
    from: m.from,
    rating: m.mark.rating,
    tags: m.mark.tags,
    star: starEl !== null && (stemEl(m.stem) === starEl || BRANCH_EL[m.branch] === starEl),
    now: i === 0,
  }));

  // What is rare in this chart: the question's own area first, then character.
  const d = distinctOf(p, person.gender);
  const pool = (d?.patterns ?? []).filter((x) => x.rate < 0.3);
  const area = lens.topic === "기타" ? "성격" : lens.topic;
  const rare = [...pool.filter((x) => x.area === area), ...pool.filter((x) => x.area === "성격" && x.area !== area)]
    .slice(0, 2)
    .map((x) => ({ plain: x.plain, term: x.term, rate: perHundred(x.rate), meaning: x.meaning }));

  return {
    lens,
    gods: lens.group ? GROUP_GODS[lens.group] : "",
    starEl,
    cols,
    lit,
    hiddenLit,
    share,
    count: r.elements,
    yong: r.yong,
    strength: r.strength,
    months,
    rare,
  };
}

export { salHanja };
