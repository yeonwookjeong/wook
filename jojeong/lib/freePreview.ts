import { gongmang, isBaekho, isGoegang, meetings, salsAt, stageOf, stemClash, stemCombine } from "./deep";
import { BRANCH_EL, chartOf, elScore, groupElement, GROUP_OF, HIDDEN, readChart, stemEl, tenGod, type GodGroup, type Slot } from "./myeongri";
import type { Daeun, Profile } from "./profile";
import { BRANCHES, isFull, STEMS, type FullPillars, type Pillars } from "./saju";
import { monthMarks, yearName, yearPillar, yearScore, type Verdict } from "./yeonun";

// The leaner free screen being tried on the owner's page (/admin/free-preview): more labels and numbers, no
// sentences. Everything here is computed (no writer, no cost); nothing is stored.

// ① 만세력 줄: under each pillar, its ten gods (stem above, branch's 본기 below), hidden stems, 12운성 and 신살.
export type ManseCol = { pos: Slot["pos"]; stemGod: string; branchGod: string; hidden: string; stage: string; sals: string[] };

const SAL_HANJA: Record<string, string> = {
  천을귀인: "天乙貴人",
  문창귀인: "文昌貴人",
  도화: "桃花",
  역마: "驛馬",
  화개: "華蓋",
  양인: "羊刃",
  공망: "空亡",
  괴강: "魁罡",
  백호: "白虎",
};
export const salHanja = (name: string) => SAL_HANJA[name] ?? name;

export function manseOf(p: Pillars): ManseCol[] | null {
  if (!isFull(p)) return null;
  return chartOf(p).map((s) => ({
    pos: s.pos,
    stemGod: s.stem === null ? "" : s.pos === "일" ? "일간" : tenGod(p.dayStem, s.stem),
    branchGod: s.branch === null ? "" : tenGod(p.dayStem, HIDDEN[s.branch].at(-1)![0]),
    hidden: s.branch === null ? "" : HIDDEN[s.branch].map(([h]) => STEMS[h]).join(""),
    stage: s.branch === null ? "" : stageOf(p.dayStem, s.branch),
    sals: s.branch === null ? [] : [...salsAt(p, s.branch), ...(s.pos === "일" && isGoegang(p) ? ["괴강" as const] : []), ...(s.pos === "일" && isBaekho(p) ? ["백호" as const] : [])],
  }));
}

// ⑥ Where each 신살 sits in the chart (일지 午, 연지 寅 …); 괴강·백호 are the day pillar itself.
export function salSeats(p: Pillars): Record<string, string> {
  if (!isFull(p)) return {};
  const out: Record<string, string[]> = {};
  for (const s of chartOf(p)) {
    if (s.branch === null) continue;
    for (const x of salsAt(p, s.branch)) (out[x] ??= []).push(`${s.pos}지 ${BRANCHES[s.branch]}`);
  }
  if (isGoegang(p)) out.괴강 = [`일주 ${STEMS[p.dayStem]}${BRANCHES[p.dayBranch]}`];
  if (isBaekho(p)) out.백호 = [`일주 ${STEMS[p.dayStem]}${BRANCHES[p.dayBranch]}`];
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join(" · ")]));
}

// ⑧ A decade's characters against the chart, as bare tags: its branch with each natal branch (寅巳 형, 子未 원진),
// its stem with the day stem (甲己 합). No explanation.
export function decadeTags(p: Pillars, d: Daeun): string[] {
  if (!isFull(p)) return [];
  const tags: string[] = [];
  for (const s of chartOf(p)) {
    if (s.branch === null) continue;
    for (const m of meetings(d.branch, s.branch)) {
      const tag = `${BRANCHES[d.branch]}${BRANCHES[s.branch]} ${m}`;
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  if (stemCombine(d.stem, p.dayStem)) tags.push(`${STEMS[d.stem]}${STEMS[p.dayStem]} 합`);
  if (stemClash(d.stem, p.dayStem)) tags.push(`${STEMS[d.stem]}${STEMS[p.dayStem]} 충`);
  if (gongmang(p).includes(d.branch)) tags.push(`${BRANCHES[d.branch]} 공망`);
  return tags;
}

// ⑨ One year (2027 丁未) in five areas, graded from the same 연운 scoring (lib/yeonun.ts yearScore), tilted by
// what the year's ten gods and meetings touch in each area. Three grades only; the reasons are the paid report's.
export type AreaGrade = "좋음" | "보통" | "조심";
export type YearPreview = {
  year: number;
  hanja: string;
  ko: string;
  verdict: Verdict;
  gods: [string, string];
  // why: what moved the area's grade, in plain words (+ helps, − costs); months: the months whose stars touch it.
  areas: { area: "돈" | "일" | "사랑" | "사람" | "몸"; grade: AreaGrade; grade5: Grade5; score: number; why: AreaWhy[]; months: number[] }[];
  months: { from: string; gz: string; rating: 0 | 1 | 2 | 3 }[];
  // Where the year's branch meets the chart's seats (연 바깥·윗사람, 월 부모·형제·일터, 일 나·배우자, 시 자녀).
  meets: { pos: Slot["pos"]; meeting: string }[];
};
export type AreaWhy = { text: string; up: boolean };

const gradeOf = (x: number): AreaGrade => (x >= 0.7 ? "좋음" : x > -0.5 ? "보통" : "조심");
// The five grades of the second pass (lib/open.ts RENEW2), the three above split at their ends: of all charts in
// a year about a tenth each are 아주 좋음 and 많이 조심 (sampled over 2,200 charts for 2027), so 보통 stays the middle.
export const GRADES5 = ["아주 좋음", "좋음", "보통", "조심", "많이 조심"] as const;
export type Grade5 = (typeof GRADES5)[number];
export const grade5Of = (x: number): Grade5 => (x >= 1.4 ? "아주 좋음" : x >= 0.7 ? "좋음" : x > -0.5 ? "보통" : x > -1.2 ? "조심" : "많이 조심");

export function yearPreviewOf(p: Pillars, profile: Profile | null, y: number): YearPreview | null {
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const full = p as FullPillars;
  const s = yearScore(full, r, profile, y);
  const { stem, branch } = yearPillar(y);
  const gods = [tenGod(p.dayStem, stem), tenGod(p.dayStem, HIDDEN[branch].at(-1)![0])] as const;
  const groups = new Set<GodGroup>(gods.map((g) => GROUP_OF[g]));
  const dayEl = stemEl(p.dayStem);
  // The overall year weighs a quarter in each area, so no area reads against the year's verdict by much.
  const base = s.score / 4;
  const welcome = (g: GodGroup) => elScore(r, groupElement(dayEl, g));
  const meetAt = (pos: Slot["pos"]) => s.meets.find((m) => m.pos === pos)?.meeting;
  const hard = (m: string | undefined) => m === "충" ? -1 : m === "형" || m === "원진" ? -0.5 : 0;
  const soft = (m: string | undefined) => (m === "육합" || m === "삼합" ? 0.7 : 0);

  const EL_KO = ["목", "화", "토", "금", "수"];
  const why: Record<"돈" | "일" | "사랑" | "사람" | "몸", AreaWhy[]> = { 돈: [], 일: [], 사랑: [], 사람: [], 몸: [] };
  const add = (area: keyof typeof why, x: number, text: string) => {
    if (x) why[area].push({ text, up: x > 0 });
    return x;
  };
  const SEAT = { 연: "연주(바깥·윗사람 자리)", 월: "월주(일터·부모 자리)", 일: "일지(나·배우자 자리)", 시: "시주(자녀 자리)" } as const;
  const meetWord = (pos: Slot["pos"]) => (meetAt(pos) ? `${y}년 글자가 ${SEAT[pos]}와 ${meetAt(pos)}` : "");
  const welcomeWord = (g: GodGroup) => (welcome(g) > 0 ? ", 내 사주가 반기는 기운" : welcome(g) < 0 ? ", 다만 내 사주엔 버거운 기운" : "");
  if (Math.abs(base) >= 0.15) for (const a of Object.keys(why) as (keyof typeof why)[]) add(a, base, `한 해 전체 흐름이 ${s.verdict}`);

  const money =
    base +
    (groups.has("재성") ? add("돈", 0.6 + 0.4 * welcome("재성"), `재물의 별(재성)이 들어오는 해${welcomeWord("재성")}`) : 0) +
    (gods.includes("겁재") ? add("돈", -0.6, "겁재(돈을 나눠 가져가는 기운)가 함께 들어옴") : 0);
  const work =
    base +
    (groups.has("관성") ? add("일", 0.6 + 0.4 * welcome("관성"), `직장·자리의 별(관성)이 들어오는 해${welcomeWord("관성")}`) : 0) +
    (gods.includes("상관") && r.gods.관성 > 0 ? add("일", -0.6, "상관이 들어와 내 사주의 자리 별(관성)을 건드림") : 0) +
    add("일", hard(meetAt("월")), meetWord("월"));
  const spouse: GodGroup | null = profile?.gender === "m" ? "재성" : profile?.gender === "f" ? "관성" : null;
  const love =
    base +
    (spouse && groups.has(spouse) ? add("사랑", 0.8, `배우자의 별(${spouse})이 들어오는 해`) : 0) +
    add("사랑", soft(meetAt("일")) + hard(meetAt("일")), meetWord("일")) +
    (s.sals.includes("도화") ? add("사랑", 0.5, "도화(끌림의 별)가 드는 해") : 0) +
    (stemCombine(stem, p.dayStem) ? add("사랑", 0.5, `${y}년 천간이 내 일간과 합`) : 0);
  const people =
    base +
    (groups.has("인성") ? add("사람", 0.5 * Math.sign(welcome("인성")), `도와주는 윗사람의 별(인성)이 들어옴${welcomeWord("인성")}`) : 0) +
    (groups.has("비겁") ? add("사람", 0.5 * Math.sign(welcome("비겁")), `동료·경쟁자의 별(비겁)이 들어옴${welcomeWord("비겁")}`) : 0) +
    (s.sals.includes("천을귀인") ? add("사람", 1, "천을귀인(돕는 사람의 별)이 드는 해") : 0) +
    add("사람", hard(meetAt("연")), meetWord("연"));
  const bodyEl = elScore(r, BRANCH_EL[branch]) * 0.3;
  const body =
    0.5 +
    base +
    add("몸", bodyEl, `${y}년의 ${EL_KO[BRANCH_EL[branch]]} 기운이 내 사주에 ${bodyEl > 0 ? "맞는 기운" : "버거운 기운"}`) +
    add("몸", hard(meetAt("일")), meetWord("일")) +
    add("몸", hard(meetAt("월")), meetWord("월")) +
    (s.sals.includes("양인") ? add("몸", -0.7, "양인(과로·다침을 조심할 별)이 드는 해") : 0) +
    (stemClash(stem, p.dayStem) ? add("몸", -0.5, `${y}년 천간이 내 일간과 충`) : 0);

  // The months each area moves in: the month's own stars, read the way the year's are.
  const marks = monthMarks(p, r, y);
  const monthGroups = marks.map((m) => new Set<GodGroup>([GROUP_OF[tenGod(p.dayStem, m.stem)], GROUP_OF[tenGod(p.dayStem, HIDDEN[m.branch].at(-1)![0])]]));
  const monthsWhere = (f: (i: number) => boolean) => marks.map((_, i) => i).filter(f);
  const areaMonths = {
    돈: monthsWhere((i) => monthGroups[i].has("재성")),
    일: monthsWhere((i) => monthGroups[i].has("관성")),
    // The spouse's star comes in many months: only where it lands well, or where a meeting ties the day seat.
    사랑: monthsWhere((i) => marks[i].tags.includes("인연·약속") || marks[i].tags.includes("합") || (!!spouse && monthGroups[i].has(spouse) && marks[i].rating >= 2)),
    사람: monthsWhere((i) => marks[i].tags.includes("귀인") || monthGroups[i].has("인성")),
    몸: monthsWhere((i) => marks[i].tags.includes("변동") || marks[i].rating === 0),
  };

  const n = yearName(y);
  return {
    year: y,
    hanja: n.hanja,
    ko: n.ko,
    verdict: s.verdict,
    gods: [gods[0], gods[1]],
    areas: [
      { area: "돈", grade: gradeOf(money), grade5: grade5Of(money), score: money, why: why.돈, months: areaMonths.돈 },
      { area: "일", grade: gradeOf(work), grade5: grade5Of(work), score: work, why: why.일, months: areaMonths.일 },
      { area: "사랑", grade: gradeOf(love), grade5: grade5Of(love), score: love, why: why.사랑, months: areaMonths.사랑 },
      { area: "사람", grade: gradeOf(people), grade5: grade5Of(people), score: people, why: why.사람, months: areaMonths.사람 },
      { area: "몸", grade: gradeOf(body), grade5: grade5Of(body), score: body, why: why.몸, months: areaMonths.몸 },
    ],
    months: marks.map((m) => ({ from: m.from, gz: m.gz, rating: m.rating })),
    meets: s.meets.map((m) => ({ pos: m.pos, meeting: m.meeting })),
  };
}

// 겹쳐 보기: the coming year stacked on the chart the way it is read, one layer at a time: the chart, the decade
// it falls in (with its characters against the chart), the year (against the chart and against the decade), then
// its months (drawn from yearPreviewOf). Tags only.
export type Layers = {
  natal: { pos: Slot["pos"]; gz: string }[];
  daeun: { gz: string; from: number; to: number; tags: string[] } | null;
  year: { gz: string; natal: string[]; daeun: string[] };
};

export function layersOf(p: Pillars, profile: Profile | null, y: number): Layers | null {
  if (!isFull(p)) return null;
  const { stem, branch } = yearPillar(y);
  const d = profile?.daeun?.find((x) => x.from <= y && y <= x.to) ?? null;
  const natal: string[] = [];
  for (const s of chartOf(p)) {
    if (s.branch !== null)
      for (const m of meetings(branch, s.branch)) {
        const tag = `${s.pos}지 ${BRANCHES[branch]}${BRANCHES[s.branch]} ${m}`;
        if (!natal.includes(tag)) natal.push(tag);
      }
    if (s.stem !== null && stemCombine(stem, s.stem)) natal.push(`${s.pos}간 ${STEMS[stem]}${STEMS[s.stem]} 합`);
    if (s.stem !== null && stemClash(stem, s.stem)) natal.push(`${s.pos}간 ${STEMS[stem]}${STEMS[s.stem]} 충`);
  }
  const withDaeun = d
    ? [
        ...meetings(branch, d.branch).map((m) => `${BRANCHES[branch]}${BRANCHES[d.branch]} ${m}`),
        ...(stemCombine(stem, d.stem) ? [`${STEMS[stem]}${STEMS[d.stem]} 합`] : []),
        ...(stemClash(stem, d.stem) ? [`${STEMS[stem]}${STEMS[d.stem]} 충`] : []),
      ]
    : [];
  return {
    natal: chartOf(p).map((s) => ({ pos: s.pos, gz: `${s.stem === null ? "?" : STEMS[s.stem]}${s.branch === null ? "?" : BRANCHES[s.branch]}` })),
    daeun: d ? { gz: `${STEMS[d.stem]}${BRANCHES[d.branch]}`, from: d.from, to: d.to, tags: decadeTags(p, d) } : null,
    year: { gz: `${STEMS[stem]}${BRANCHES[branch]}`, natal, daeun: withDaeun },
  };
}
