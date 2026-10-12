import { coupleOf } from "./couple";
import { meetings, stageOf, stemClash, stemCombine, type Meeting } from "./deep";
import { manseOf, salHanja, yearPreviewOf, type ManseCol } from "./freePreview";
import { BRANCH_EL, chartOf, ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, HIDDEN, luckFit, readChart, stemEl, tenGod, type GodGroup, type Slot } from "./myeongri";
import { profileOf, type Person } from "./pairToken";
import { perHundred, distinctOf } from "./rarity";
import { BRANCHES, isFull, STEMS } from "./saju";
import { NATAL_SAL } from "./yearText";
import { monthMarks, monthsOf, yearName, yearPillar } from "./yeonun";

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

// ── The full kit: every picture this answer may use, each null when this chart or room cannot draw it. The model
// is shown what each holds (figureMenu) and marks the two or three its answer needs: [[圖|合沖]].

export const FIGURE_KEYS = ["命盤", "五行", "月運", "稀貴", "合沖", "宮位", "大運", "年比", "神殺", "兩人"] as const;
export type FigureKey = (typeof FIGURE_KEYS)[number];
export const FIGURE_NAMES: Record<FigureKey, string> = {
  命盤: "여덟 글자 판",
  五行: "다섯 기운 비율",
  月運: "다가올 여섯 달",
  稀貴: "그대가 남다른 점",
  合沖: "지금 들어온 글자와 만나는 자리",
  宮位: "한 자리 들여다보기",
  大運: "10년 흐름",
  年比: "올해와 내년",
  神殺: "사주 속 신살",
  兩人: "두 사람",
};

const gz = (stem: number, branch: number) => `${STEMS[stem]}${BRANCHES[branch]}`;
const el = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

// 合沖: this year's and this month's characters against each seat of the chart.
export type Touch = { from: "올해" | "이달"; part: "천간" | "지지"; kind: string; good: boolean };
export type ClashFig = {
  incoming: { label: "올해" | "이달"; gz: string; stem: number; branch: number; god: string }[];
  cols: { pos: Slot["pos"]; stem: number | null; branch: number | null; touches: Touch[] }[];
};
const MEET_WORD: Partial<Record<Meeting, [string, boolean]>> = {
  육합: ["육합 · 끌어당김", true],
  삼합: ["삼합 · 힘을 모음", true],
  충: ["충 · 부딪혀 움직임", false],
  형: ["형 · 날이 섬", false],
  원진: ["원진 · 서운함", false],
};

function clashOf(p: Person["pillars"], at: number): ClashFig | null {
  if (!isFull(p)) return null;
  const kst = new Date(at + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const sy = m < 2 || (m === 2 && d < 4) ? y - 1 : y;
  const yp = yearPillar(sy);
  const nowT = Date.UTC(y, m - 1, d);
  const months = [sy - 1, sy].flatMap((yy) =>
    monthsOf(yy).map((mm, i) => {
      const [a, b] = mm.from.split("/").map(Number);
      return { ...mm, t: Date.UTC(a === 1 && i > 0 ? yy + 1 : yy, a - 1, b) };
    }),
  );
  const mp = months.findLast((x) => x.t <= nowT) ?? months[0];
  const incoming = [
    { label: "올해" as const, gz: gz(yp.stem, yp.branch), stem: yp.stem, branch: yp.branch, god: tenGod(p.dayStem, yp.stem) },
    { label: "이달" as const, gz: gz(mp.stem, mp.branch), stem: mp.stem, branch: mp.branch, god: tenGod(p.dayStem, mp.stem) },
  ];
  const cols = chartOf(p).map((s) => {
    const touches: Touch[] = [];
    for (const x of incoming) {
      if (s.stem !== null && s.pos !== "일" && stemCombine(x.stem, s.stem)) touches.push({ from: x.label, part: "천간", kind: "천간합 · 묶임", good: true });
      if (s.stem !== null && stemClash(x.stem, s.stem)) touches.push({ from: x.label, part: "천간", kind: "천간충 · 흔들림", good: false });
      if (s.pos === "일" && s.stem !== null && stemCombine(x.stem, s.stem))
        touches.push({ from: x.label, part: "천간", kind: "나와 합 · 마음이 묶임", good: true });
      if (s.branch !== null)
        for (const mt of meetings(x.branch, s.branch)) {
          const w = MEET_WORD[mt];
          if (w) touches.push({ from: x.label, part: "지지", kind: w[0], good: w[1] });
        }
    }
    return { pos: s.pos, stem: s.stem, branch: s.branch, touches };
  });
  return { incoming, cols };
}

// 宮位: one seat close up — what the seat means, its characters and hidden stems with their ten gods, its stage and
// 신살, and what this year does to it.
const SEAT_MEANING: Record<Slot["pos"], [string, string]> = {
  일: ["배우자 자리", "나와 가장 가까운 사람, 결혼 생활의 결, 내 속마음이 머무는 곳"],
  월: ["일터 자리", "사회에서 맡는 자리, 일하는 방식, 부모와 형제의 그늘"],
  연: ["뿌리 자리", "집안과 어린 시절, 윗사람과 나라·회사 같은 큰 울타리"],
  시: ["말년 자리", "자녀와 아랫사람, 늘그막의 모습, 품고 있는 꿈"],
};
export type SeatFig = {
  pos: Slot["pos"];
  name: string;
  meaning: string;
  stem: number | null;
  branch: number;
  stemGod: string;
  hidden: { stem: number; god: string; main: boolean }[];
  stage: string;
  sals: string[];
  year: { gz: string; kinds: string[] };
};
function seatOf(p: Person["pillars"], pos: Slot["pos"], manse: ManseCol[], at: number): SeatFig | null {
  if (!isFull(p)) return null;
  const s = chartOf(p).find((x) => x.pos === pos);
  if (!s || s.branch === null) return null;
  const col = manse.find((c) => c.pos === pos)!;
  const kst = new Date(at + 9 * 3600000);
  const sy = kst.getUTCMonth() < 1 || (kst.getUTCMonth() === 1 && kst.getUTCDate() < 4) ? kst.getUTCFullYear() - 1 : kst.getUTCFullYear();
  const yp = yearPillar(sy);
  return {
    pos,
    name: SEAT_MEANING[pos][0],
    meaning: SEAT_MEANING[pos][1],
    stem: s.stem,
    branch: s.branch,
    stemGod: pos === "일" ? "나" : col.stemGod,
    hidden: HIDDEN[s.branch].map(([h], i, all) => ({ stem: h, god: tenGod(p.dayStem, h), main: i === all.length - 1 })),
    stage: stageOf(p.dayStem, s.branch),
    sals: col.sals,
    year: { gz: gz(yp.stem, yp.branch), kinds: meetings(yp.branch, s.branch).map((m) => MEET_WORD[m]?.[0] ?? m) },
  };
}

// 大運: the ten-year spans, with where now falls and how each suits the chart.
export type DecadeFig = { spans: { gz: string; from: number; to: number; age: string; god: string; fit: 0 | 1 | 2 | 3; now: boolean }[]; nowIndex: number };
function decadesOf(person: Person, at: number): DecadeFig | null {
  const r = readChart(person.pillars);
  if (!r || !person.daeun?.length) return null;
  const y = new Date(at + 9 * 3600000).getUTCFullYear();
  const spans = person.daeun.map((d) => {
    const f = luckFit(r, person.pillars.dayStem, d.stem, d.branch);
    return {
      gz: gz(d.stem, d.branch),
      from: d.from,
      to: d.to,
      age: person.birthYear ? `${d.from - person.birthYear + 1}~${d.to - person.birthYear + 1}세` : "",
      god: tenGod(person.pillars.dayStem, d.stem),
      fit: (f >= 3 ? 3 : f >= 0 ? 2 : f > -3 ? 1 : 0) as 0 | 1 | 2 | 3,
      now: d.from <= y && y <= d.to,
    };
  });
  return { spans, nowIndex: spans.findIndex((s) => s.now) };
}

// 年比: this year and next, area by area (the same grades as the free year screen).
export type YearsFig = { years: { year: number; name: string; verdict: string; areas: { area: string; grade: string; score: number }[] }[] };
function yearsOf(person: Person, at: number): YearsFig | null {
  const y = new Date(at + 9 * 3600000).getUTCFullYear();
  const profile = profileOf(person);
  const a = yearPreviewOf(person.pillars, profile, y);
  const b = yearPreviewOf(person.pillars, profile, y + 1);
  if (!a || !b) return null;
  return {
    years: [a, b].map((x) => ({
      year: x.year,
      name: `${x.ko}년(${yearName(x.year).hanja})`,
      verdict: x.verdict,
      areas: x.areas.map((ar) => ({ area: ar.area, grade: ar.grade, score: ar.score })),
    })),
  };
}

// 神殺: the 신살 in the chart, each with where it sits and a plain line.
export type SalFig = { name: string; hanja: string; seats: string[]; line: string }[];
function salsOf(manse: ManseCol[]): SalFig | null {
  const by = new Map<string, string[]>();
  for (const c of manse) for (const s of c.sals) by.set(s, [...(by.get(s) ?? []), `${c.pos}지`]);
  const out = [...by].map(([name, seats]) => ({
    name,
    hanja: salHanja(name),
    seats,
    line: NATAL_SAL[name] ?? (name === "공망" ? "공망(空亡)이 앉은 자리는 애쓴 만큼 손에 덜 잡혀, 겉보다 실속을 챙기면 좋아요." : ""),
  }));
  return out.length ? out : null;
}

// 兩人: the two charts side by side and what passes between them (lib/couple.ts).
export type PairFig = {
  a: { name: string; ilju: string; el: number };
  b: { name: string; ilju: string; el: number };
  roles: [string, string];
  seat: string[];
  lends: { to: string; from: string; el: string; pct: number }[];
  years: { year: number; gz: string; mark: string; why: string }[];
};
function pairOf(a: Person, b: Person, label: string): PairFig | null {
  const c = coupleOf(a, b);
  if (!c) return null;
  const side = (x: Person, name: string) => ({ name, ilju: gz(x.pillars.dayStem, x.pillars.dayBranch), el: stemEl(x.pillars.dayStem) });
  return {
    a: side(a, a.name),
    b: side(b, label || b.name),
    roles: c.roles,
    seat: c.seat,
    lends: c.lends.map((l) => ({ ...l, el: el(l.el) })),
    years: c.years,
  };
}

export type FigureKit = {
  base: Figures;
  clash: ClashFig | null;
  seat: SeatFig | null;
  decades: DecadeFig | null;
  years: YearsFig | null;
  sals: SalFig | null;
  pair: PairFig | null;
};

export function figureKit(person: Person, other: Person | null, otherLabel: string, topic: string, question: string, at: number): FigureKit | null {
  const base = figuresOf(person, topic, question, at);
  const manse = manseOf(person.pillars);
  if (!base || !manse) return null;
  return {
    base,
    clash: clashOf(person.pillars, at),
    seat: seatOf(person.pillars, base.lens.seat?.pos ?? "일", manse, at),
    decades: decadesOf(person, at),
    years: yearsOf(person, at),
    sals: salsOf(manse),
    pair: other ? pairOf(person, other, otherLabel) : null,
  };
}

export const hasFigure = (kit: FigureKit, key: FigureKey) =>
  ({
    命盤: true,
    五行: true,
    月運: kit.base.months.length > 0,
    稀貴: kit.base.rare.length > 0,
    合沖: Boolean(kit.clash?.cols.some((c) => c.touches.length)),
    宮位: Boolean(kit.seat),
    大運: Boolean(kit.decades && kit.decades.nowIndex >= 0),
    年比: Boolean(kit.years),
    神殺: Boolean(kit.sals),
    兩人: Boolean(kit.pair),
  })[key];

// What each picture shows, for the model to choose from and write beside (lib/ask.ts).
export function figureMenu(kit: FigureKit): string {
  const b = kit.base;
  const MARK = ["✕", "△", "○", "◎"];
  const lines: Partial<Record<FigureKey, string>> = {
    命盤: `여덟 글자 표(십성·지장간·12운성·신살)${b.lens.group ? `. 질문의 별 '${b.lens.star}'(${b.gods}) 겉 ${b.lit}개${b.hiddenLit ? `, 지장간 속 ${b.hiddenLit}곳` : ""}${b.lens.seat ? `, ${b.lens.seat.label} 표시` : ""}` : ""}`,
    五行: `오행 비율 ${b.share.map((v, e) => `${ELEMENT_KO[e]} ${v}%`).join(" ")} · ${b.strength} · 용신 ${el(b.yong)}`,
    月運: `여섯 달 ${b.months.map((m) => `${m.label}${MARK[m.rating]}${m.tags.length ? `(${m.tags.join("·")})` : ""}${m.star ? "★" : ""}`).join(" ")}`,
    稀貴: b.rare.map((x) => `${x.plain}(${x.term}, ${x.rate})`).join(" / "),
    合沖: kit.clash
      ? `올해 ${kit.clash.incoming[0].gz}·이달 ${kit.clash.incoming[1].gz}가 만나는 자리: ${
          kit.clash.cols
            .filter((c) => c.touches.length)
            .map((c) => `${c.pos}주(${c.touches.map((t) => `${t.from} ${t.part} ${t.kind.split(" · ")[0]}`).join(", ")})`)
            .join(" / ") || "없음"
        }`
      : "",
    宮位: kit.seat
      ? `${kit.seat.name}(${kit.seat.pos}주) ${kit.seat.stem !== null ? STEMS[kit.seat.stem] : ""}${BRANCHES[kit.seat.branch]} · 지장간 ${kit.seat.hidden.map((h) => `${STEMS[h.stem]}${h.god}`).join(" ")} · ${kit.seat.stage}${kit.seat.sals.length ? ` · ${kit.seat.sals.join("·")}` : ""} · 올해 ${kit.seat.year.gz}와 ${kit.seat.year.kinds.join(", ") || "만남 없음"}`
      : "",
    大運:
      kit.decades && kit.decades.nowIndex >= 0
        ? kit.decades.spans
            .slice(Math.max(0, kit.decades.nowIndex - 1), kit.decades.nowIndex + 3)
            .map((s) => `${s.from}~${s.to} ${s.gz}(${s.god}) ${MARK[s.fit]}${s.now ? " ←지금" : ""}`)
            .join(" / ")
        : "",
    年比: kit.years ? kit.years.years.map((y) => `${y.year} ${y.verdict}: ${y.areas.map((a) => `${a.area} ${a.grade}`).join(" ")}`).join(" / ") : "",
    神殺: kit.sals ? kit.sals.map((s) => `${s.name}(${s.seats.join("·")})`).join(", ") : "",
    兩人: kit.pair
      ? `${kit.pair.a.name} ${kit.pair.a.ilju} · ${kit.pair.b.name} ${kit.pair.b.ilju} · 서로에게 ${kit.pair.roles.join("/")}${kit.pair.seat.length ? ` · ${kit.pair.seat.join(", ")}` : ""}`
      : "",
  };
  return FIGURE_KEYS.filter((k) => hasFigure(kit, k) && lines[k])
    .map((k) => `- ${k} (${FIGURE_NAMES[k]}): ${lines[k]}`)
    .join("\n");
}

// The default pair when an answer marks none (answers written before the marks): by topic.
export function defaultFigures(kit: FigureKit): FigureKey[] {
  const t = kit.base.lens.topic;
  const want: FigureKey[] =
    kit.pair && t === "연애"
      ? ["兩人", "月運"]
      : t === "연애"
        ? ["宮位", "月運"]
        : t === "일"
          ? ["大運", "年比"]
          : t === "돈"
            ? ["年比", "月運"]
            : ["合沖", "五行"];
  return want.filter((k) => hasFigure(kit, k));
}
