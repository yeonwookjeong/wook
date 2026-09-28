import { Solar } from "lunar-javascript";
import { meetings, salsAt, stageOf, stemClash, stemCombine, type Meeting } from "./deep";
import { BRANCH_EL, chartOf, elScore, ELEMENT_HANJA, luckFit, ELEMENT_KO, GROUP_OF, HIDDEN, readChart, type GodGroup, type Reading, stemEl, tenGod } from "./myeongri";
import { josa } from "./josa";
import type { Profile } from "./profile";
import { BRANCHES, BRANCHES_KO, isFull, STEMS, STEMS_KO, type FullPillars, type Pillars } from "./saju";

// 연운: any year against the chart, past or future. The same scoring the 2026 reading uses (lib/yearly.ts calls
// yearScore and monthMarks for 丙午), so a year never reads one way here and another on the free 2026 page.
// Computed only; the written report (paid) explains what this finds.

export type Verdict = "대길" | "길" | "평" | "조심" | "인내";
export const VERDICT_MARK: Record<Verdict, string> = { 대길: "◎", 길: "○", 평: "·", 조심: "△", 인내: "✕" };

// The year pillar (the year turns at 입춘, early February).
export const yearPillar = (y: number) => ({ stem: (((y - 4) % 10) + 10) % 10, branch: (((y - 4) % 12) + 12) % 12 });
export const yearName = (y: number) => {
  const { stem, branch } = yearPillar(y);
  return { hanja: `${STEMS[stem]}${BRANCHES[branch]}`, ko: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}년` };
};

// The element a 삼합 or 방합 with this branch gathers into (申子辰 水, 亥卯未 木, 寅午戌 火, 巳酉丑 金; 寅卯辰 木,
// 巳午未 火, 申酉戌 金, 亥子丑 水).
const SAMHAP_EL = [4, 3, 1, 0, 4, 3, 1, 0, 4, 3, 1, 0];
const BANGHAP_EL = [4, 4, 0, 0, 0, 1, 1, 1, 3, 3, 3, 4];
const POS_WEIGHT = { 일: 1.5, 월: 1, 연: 0.5, 시: 0.5 } as const;
const MEET_SCORE: Record<Meeting, number> = { 육합: 1, 삼합: 0.8, 방합: 0.5, 충: -1.5, 형: -0.7, 원진: -0.7, 해: -0.5, 파: -0.5 };

export type YearFactor = { tag: string; delta: number };
export type YearScore = {
  score: number;
  verdict: Verdict;
  factors: YearFactor[]; // what moved the score, largest first
  meets: { meeting: Meeting; pos: "연" | "월" | "일" | "시"; branch: number; gathers: boolean }[];
  stemMeets: { kind: "합" | "충"; pos: "연" | "월" | "시" | "일"; stem: number }[];
  sals: string[];
  daeun: { stem: number; branch: number; from: number; to: number } | null;
};

export const verdictOf = (score: number): Verdict => (score >= 3.5 ? "대길" : score >= 1 ? "길" : score > -1 ? "평" : score > -3 ? "조심" : "인내");
const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
// A branch as 申(신), with the particle its Korean reading takes.
const BJ = (b: number, pair: Parameters<typeof josa>[1]) => josa(`${BRANCHES[b]}(${BRANCHES_KO[b]})`, pair);
const ROLE = (r: Reading, e: number) =>
  e === r.yong ? "용신" : e === r.hee ? "희신" : e === r.gi ? "기신" : e === (r.gi + 4) % 5 ? "구신" : e === r.burden ? "부담" : null;

// The year's pillar against the chart: its elements (the stem and branch together weigh 1.5 of an element's
// welcome), how its branch meets each natal branch (by seat: 일 1.5, 월 1, 연·시 0.5; a 삼합·방합 that gathers an
// unwelcome element counts nothing), its stem against the natal stems, the 신살 it brings, and the decade it
// falls in.
export function yearScore(p: FullPillars, r: Reading, profile: Profile | null, y: number): YearScore {
  const { stem, branch } = yearPillar(y);
  const factors: YearFactor[] = [];
  let score = 0;
  const add = (tag: string, delta: number) => {
    if (delta === 0) return;
    score += delta;
    factors.push({ tag, delta });
  };
  const se = stemEl(stem);
  const be = BRANCH_EL[branch];
  if (se === be) add(`${EL(se)} 기운(${ROLE(r, se) ?? "중립"})`, 1.5 * elScore(r, se));
  else {
    add(`천간 ${EL(se)} 기운(${ROLE(r, se) ?? "중립"})`, 0.75 * elScore(r, se));
    add(`지지 ${EL(be)} 기운(${ROLE(r, be) ?? "중립"})`, 0.75 * elScore(r, be));
  }

  const meets: YearScore["meets"] = [];
  for (const s of chartOf(p)) {
    if (s.branch === null) continue;
    const main = meetings(branch, s.branch)[0];
    if (!main) continue;
    const gathered = main === "삼합" ? SAMHAP_EL[branch] : main === "방합" ? BANGHAP_EL[branch] : null;
    const gathers = gathered !== null && elScore(r, gathered) < 0;
    meets.push({ meeting: main, pos: s.pos, branch: s.branch, gathers });
    add(`${s.pos}지 ${BRANCHES[s.branch]}와 ${main}${gathers ? `(모이는 ${ELEMENT_KO[gathered!]} 기운이 버거워 상쇄)` : ""}`, gathers ? 0 : POS_WEIGHT[s.pos] * MEET_SCORE[main]);
  }

  const stemMeets: YearScore["stemMeets"] = [];
  for (const s of chartOf(p)) {
    if (s.stem === null || s.pos === "일") continue;
    if (stemCombine(stem, s.stem)) {
      stemMeets.push({ kind: "합", pos: s.pos, stem: s.stem });
      add(`${s.pos}간 ${STEMS[s.stem]}와 천간합`, 0.5);
    } else if (stemClash(stem, s.stem)) {
      stemMeets.push({ kind: "충", pos: s.pos, stem: s.stem });
      add(`${s.pos}간 ${STEMS[s.stem]}와 천간충`, -0.5);
    }
  }
  if (stemCombine(stem, p.dayStem)) {
    stemMeets.push({ kind: "합", pos: "일", stem: p.dayStem });
    add(`일간 ${STEMS[p.dayStem]}와 천간합`, 1);
  }
  if (stemClash(stem, p.dayStem)) {
    stemMeets.push({ kind: "충", pos: "일", stem: p.dayStem });
    add(`일간 ${STEMS[p.dayStem]}와 천간충`, -1);
  }

  const sals = salsAt(p, branch).filter((s) => ["천을귀인", "문창귀인", "도화", "양인", "공망", "역마"].includes(s));
  if (sals.includes("천을귀인")) add("천을귀인", 1);
  if (sals.includes("공망")) add("공망", -0.5);

  // The decade is the ground a year stands on: graded exactly as the free life flow grades it (luckFit, its
  // branch weighing twice its stem), so a ◎ decade lifts each of its years by about one step's worth. A year
  // whose branch clashes the decade's branch shakes that ground: bad when the decade's branch is welcome,
  // a relief when it is not.
  const d = profile?.daeun?.find((x) => x.from <= y && y <= x.to) ?? null;
  if (d) {
    add(`대운 ${STEMS[d.stem]}${BRANCHES[d.branch]}`, luckFit(r, p.dayStem, d.stem, d.branch) * 0.3);
    if (meetings(branch, d.branch).includes("충")) {
      const welcome = elScore(r, BRANCH_EL[d.branch]);
      add(`대운 지지 ${BRANCHES[d.branch]}와 충`, welcome > 0 ? -1 : welcome < 0 ? 0.5 : -0.5);
    }
  }

  factors.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { score, verdict: verdictOf(score), factors, meets, stemMeets, sals, daeun: d ? { stem: d.stem, branch: d.branch, from: d.from, to: d.to } : null };
}

// Month pillars of a year (寅月 from 입춘 to 丑月 of the next January) and the date each starts, read from the
// calendar itself.
const monthCache = new Map<number, { stem: number; branch: number; from: string }[]>();
export function monthsOf(y: number): { stem: number; branch: number; from: string }[] {
  const hit = monthCache.get(y);
  if (hit) return hit;
  const out: { stem: number; branch: number; from: string }[] = [];
  let prev = "";
  for (let t = Date.UTC(y, 1, 1); t <= Date.UTC(y + 1, 0, 10); t += 86400000) {
    const d = new Date(t);
    const ec = Solar.fromYmdHms(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 12, 0, 0).getLunar().getEightChar();
    const gz = ec.getMonthGan() + ec.getMonthZhi();
    if (gz !== prev) {
      prev = gz;
      out.push({
        stem: STEMS.indexOf(ec.getMonthGan() as (typeof STEMS)[number]),
        branch: BRANCHES.indexOf(ec.getMonthZhi() as (typeof BRANCHES)[number]),
        from: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      });
    }
  }
  const months = out.filter((m) => m.branch !== 1 || out.indexOf(m) > 0).slice(0, 12);
  monthCache.set(y, months);
  return months;
}

export type MonthMark = { from: string; stem: number; branch: number; gz: string; rating: 0 | 1 | 2 | 3; tags: string[]; score: number };

// Each month: its elements (the branch weighs 1.2), a clash or meeting with the day branch, 천을귀인, a stem
// combining with the day stem. ◎ 3 · ○ 2 · △ 1 · ✕ 0.
export function monthMarks(p: Pillars, r: Reading, y: number): MonthMark[] {
  return monthsOf(y).map((m) => {
    const s = elScore(r, stemEl(m.stem)) + elScore(r, BRANCH_EL[m.branch]) * 1.2;
    const ms = meetings(m.branch, p.dayBranch);
    const tags: string[] = [];
    let adj = 0;
    const mark = (tag: string, delta: number) => {
      tags.push(tag);
      adj += delta;
    };
    if (ms.includes("충")) mark("변동", -1.2);
    if (ms.includes("육합") || ms.includes("삼합")) mark("인연·약속", 0.8);
    if (salsAt(p, m.branch).includes("천을귀인")) mark("귀인", 1);
    if (stemCombine(m.stem, p.dayStem)) mark("합", 0.5);
    const total = s + adj;
    const rating = (total >= 2 ? 3 : total >= 0 ? 2 : total > -2.5 ? 1 : 0) as MonthMark["rating"];
    return { from: m.from, stem: m.stem, branch: m.branch, gz: `${STEMS[m.stem]}${BRANCHES[m.branch]}`, rating, tags, score: total };
  });
}

// ── The free year list and the free top of one year.

const THEME: Record<GodGroup, string> = {
  비겁: "독립과 경쟁의 해",
  식상: "재주와 표현의 해",
  재성: "돈과 기회의 해",
  관성: "자리와 책임의 해",
  인성: "공부와 문서의 해",
};
const THEME_LINE: Record<GodGroup, string> = {
  비겁: "나와 같은 기운이 들어와 내 힘으로 서려는 마음이 커져요. 동료가 생기는 만큼 경쟁과 돈 나감도 함께 와요.",
  식상: "생각과 재주가 밖으로 나오는 해예요. 말하고 만들고 보여 주는 일이 늘어요.",
  재성: "돈과 현실의 일이 커지는 해예요. 벌 기회도, 써야 할 일도 함께 늘어요.",
  관성: "나를 평가하고 맡기는 자리가 생기는 해예요. 책임이 커지는 만큼 이름도 올라가요.",
  인성: "배우고 준비하고 문서를 받는 해예요. 자격, 계약, 윗사람의 도움과 인연이 있어요.",
};

export type YearRow = {
  year: number;
  hanja: string;
  ko: string;
  age: number | null;
  verdict: Verdict;
  theme: string;
  line: string; // the one or two things that decide it, in plain words
  when: "past" | "now" | "future";
  turning: boolean; // a ten-year luck pillar starts this year
};

// The plainest reason a year reads as it does: the element's role, then the strongest meeting or star.
function reasonLine(r: Reading, s: YearScore, y: number): string {
  const { stem, branch } = yearPillar(y);
  const parts: string[] = [];
  const els = [...new Set([stemEl(stem), BRANCH_EL[branch]])];
  const good = els.filter((e) => elScore(r, e) > 0);
  const bad = els.filter((e) => elScore(r, e) < 0);
  if (good.length && !bad.length) parts.push(`필요한 ${good.map((e) => ELEMENT_KO[e]).join("·")} 기운이 들어와요`);
  else if (bad.length && !good.length) parts.push(`버거운 ${bad.map((e) => ELEMENT_KO[e]).join("·")} 기운이 몰려요`);
  else if (good.length && bad.length) parts.push(`반가운 ${ELEMENT_KO[good[0]]} 기운과 버거운 ${ELEMENT_KO[bad[0]]} 기운이 섞여요`);
  const day = s.meets.find((m) => m.pos === "일");
  if (day?.meeting === "충") parts.push("내 자리(일지)가 흔들려 변화가 커요");
  else if (day && (day.meeting === "육합" || day.meeting === "삼합") && !day.gathers) parts.push("내 자리와 합이 들어 인연이 붙어요");
  else if (s.meets.some((m) => m.meeting === "충")) parts.push("사주와 부딪히는 자리가 있어 변동이 있어요");
  if (s.sals.includes("천을귀인")) parts.push("귀인이 드는 해예요");
  if (!parts.length) parts.push("크게 밀지도 막지도 않는 기운이에요");
  return parts.slice(0, 2).join(" · ");
}

export function yearRows(p: Pillars, profile: Profile | null, from: number, to: number, now: number): YearRow[] | null {
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const by = profile?.birthYear ?? null;
  const rows: YearRow[] = [];
  for (let y = from; y <= to; y++) {
    const s = yearScore(p, r, profile, y);
    const { stem } = yearPillar(y);
    const g = GROUP_OF[tenGod(p.dayStem, stem)];
    const n = yearName(y);
    rows.push({
      year: y,
      hanja: n.hanja,
      ko: n.ko,
      age: by === null ? null : y - by,
      verdict: s.verdict,
      theme: THEME[g],
      line: reasonLine(r, s, y),
      when: y < now ? "past" : y === now ? "now" : "future",
      turning: Boolean(profile?.daeun?.some((d) => d.from === y) && profile.daeun[0].from !== y),
    });
  }
  return rows;
}

// The current year in Korea.
export const thisYear = (now = new Date()) => new Date(now.getTime() + 9 * 3600000).getUTCFullYear();

// The coming year sold on its own as 신년운세 (the same 연운 report and order for that year): from September,
// when people start asking about next year, through February, when the new year has turned at 입춘. Null in
// between.
export function newYearOf(now = new Date()): number | null {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const m = kst.getUTCMonth() + 1;
  return m >= 9 ? kst.getUTCFullYear() + 1 : m <= 2 ? kst.getUTCFullYear() : null;
}
// The 연운 product dressed as that year's 신년운세, for its header. Before the year begins it is a preview
// ("미리 보는"), said plainly so an early reader knows it is early on purpose.
export const isPreview = (y: number, now = new Date()) => thisYear(now) < y;
export function newYearProduct<T extends { title: string; hanja: string; tagline: string }>(product: T, y: number, now = new Date()): T {
  return {
    ...product,
    title: isPreview(y, now) ? `미리 보는 ${y} 신년운세` : `${y} 신년운세`,
    hanja: yearName(y).hanja,
    tagline: `${y}년 나한테 어떤 일이 생길까? 돈·일·사랑·몸부터 달마다 할 일까지`,
  };
}

// The range a reader can open: from the birth year (or twenty years back when it is unknown) to ten years ahead.
export function yearRange(profile: Profile | null, now: number): { from: number; to: number } {
  return { from: profile?.birthYear ?? now - 20, to: now + 10 };
}
export function yearOf(v: unknown, profile: Profile | null, now: number): number | null {
  const y = typeof v === "string" && /^\d{4}$/.test(v) ? Number(v) : NaN;
  const { from, to } = yearRange(profile, now);
  return Number.isInteger(y) && y >= Math.max(1900, from) && y <= to ? y : null;
}

export type YearDetail = {
  year: number;
  hanja: string;
  ko: string;
  age: number | null;
  verdict: Verdict;
  theme: string;
  themeLine: string;
  line: string;
  when: "past" | "now" | "future";
  gods: [string, string]; // the year's stem and branch as ten gods
  stage: string; // the day stem's 12운성 at the year's branch
  points: string[]; // plain-word findings, for the free screen
  months: MonthMark[];
  best: number[];
  worst: number[];
  score: YearScore;
};

const MEET_PLAIN: Partial<Record<Meeting, string>> = {
  육합: "짝을 이뤄(육합) 그 자리의 일이 순하게 풀려요",
  삼합: "한 기운으로 뭉쳐(삼합) 그 자리의 일이 커져요",
  방합: "한 계절로 모여(방합) 그 자리에 힘이 실려요",
  충: "정면으로 부딪혀(충) 그 자리에 변동이 와요",
  형: "서로 조여(형) 그 자리의 일이 예민해져요",
  원진: "은근히 꺼려(원진) 그 자리에 서운함이 쌓이기 쉬워요",
  해: "서로 해쳐(해) 그 자리의 일이 어긋나기 쉬워요",
  파: "깨뜨려(파) 그 자리의 일이 한 번 틀어졌다 다시 맞춰져요",
};
const SEAT: Record<"연" | "월" | "일" | "시", string> = { 연: "집안·윗사람 자리(연지)", 월: "일터·생활 자리(월지)", 일: "나와 배우자 자리(일지)", 시: "자녀·앞날 자리(시지)" };
const SAL_PLAIN: Record<string, string> = {
  천을귀인: "천을귀인이 드는 해라, 곤란할 때 뜻밖의 도움이 와요.",
  문창귀인: "문창귀인이 드는 해라, 시험·글·자격에 운이 붙어요.",
  도화: "도화가 드는 해라, 사람을 끄는 매력과 인연이 커져요.",
  역마: "역마가 드는 해라, 이사·이직·먼 길처럼 움직일 일이 생겨요.",
  양인: "양인이 드는 해라, 추진력이 세지는 만큼 다툼과 부상을 조심해요.",
  공망: "공망이 드는 해라, 애쓴 만큼 손에 잡히지 않는 일이 있어요. 실속을 챙기세요.",
};

export function yearDetail(p: Pillars, profile: Profile | null, y: number, now: number): YearDetail | null {
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const s = yearScore(p, r, profile, y);
  const { stem, branch } = yearPillar(y);
  const n = yearName(y);
  const g = GROUP_OF[tenGod(p.dayStem, stem)];
  const points: string[] = [];
  const els = [...new Set([stemEl(stem), BRANCH_EL[branch]])];
  // Elements of the same kind read as one line (화·토 together), and so do the same meeting with the same
  // natal branch in several seats (three 戌 read once).
  const kindOf = (e: number) => {
    const role = ROLE(r, e);
    return role === "용신" ? "need" : role === "희신" ? "help" : role === "기신" ? "worst" : role === "구신" || role === "부담" ? "feed" : null;
  };
  const ELINE = {
    need: "사주에 가장 필요한 기운이라 일이 힘을 덜 들이고 풀려요.",
    help: "사주에 도움이 되는 기운이라 일이 순하게 풀려요.",
    worst: "사주를 가장 버겁게 하는 기운이라 무리하면 막히기 쉬워요.",
    feed: "사주에 이미 넘치는 쪽을 거드는 기운이라 속도를 조절해야 해요.",
  } as const;
  for (const k of ["need", "help", "worst", "feed"] as const) {
    const es = els.filter((e) => kindOf(e) === k);
    if (es.length) points.push(`${es.map((e) => ELEMENT_KO[e]).join("·")}(${es.map((e) => ELEMENT_HANJA[e]).join("")}) 기운이 들어와요. ${ELINE[k]}`);
  }
  const groups = new Map<string, typeof s.meets>();
  for (const m of s.meets) groups.set(`${m.meeting}-${m.branch}`, [...(groups.get(`${m.meeting}-${m.branch}`) ?? []), m]);
  for (const ms of groups.values()) {
    const m = ms[0];
    const plain = MEET_PLAIN[m.meeting];
    if (!plain) continue;
    const seats = ms.length === 1 ? SEAT[m.pos] : `${ms.map((x) => SEAT[x.pos].replace(/ 자리\(.*\)$/, "")).join(", ")} 자리(${ms.map((x) => `${x.pos}지`).join("·")})`;
    points.push(`${n.ko}의 ${BJ(branch, "이/가")} ${seats}의 ${BJ(m.branch, "과/와")} ${plain.replace("그 자리의", ms.length > 1 ? "그 자리들의" : "그 자리의")}.${m.gathers ? " 다만 모이는 기운이 사주에 버거워 좋은 만큼 부담도 커요." : ""}`);
  }
  for (const x of s.stemMeets) {
    if (x.pos === "일") points.push(x.kind === "합" ? `천간 ${STEMS[stem]}이 나(일간 ${STEMS[x.stem]})와 합해요. 나를 찾는 사람과 제안이 들어와요.` : `천간 ${STEMS[stem]}이 나(일간 ${STEMS[x.stem]})와 부딪혀요. 마음이 흔들리는 일이 생겨요.`);
  }
  for (const x of s.sals) if (SAL_PLAIN[x]) points.push(SAL_PLAIN[x]);
  if (s.daeun) {
    const dz = `${STEMS[s.daeun.stem]}${BRANCHES[s.daeun.branch]}`;
    const turning = s.daeun.from === y && profile?.daeun?.[0].from !== y;
    const fit = luckFit(r, p.dayStem, s.daeun.stem, s.daeun.branch);
    const ground =
      fit >= 3
        ? "바탕이 든든한 10년(◎)이라, 이 해가 버거워도 크게 무너지지 않아요."
        : fit <= -3
          ? "기반을 다질 10년(△)이라, 좋은 해라도 욕심을 줄이는 편이 안전해요."
          : "좋고 나쁨이 섞인 10년(○)이라, 한 해의 기운이 그대로 드러나요.";
    points.push(
      turning
        ? `이해에 10년 대운이 ${dz}로 바뀌어요. 태어난 날 무렵부터 삶의 판이 새로 짜여요. 새 대운은 ${ground}`
        : `${dz} 대운(${s.daeun.from}~${s.daeun.to}년) 안의 한 해예요. ${ground}`,
    );
    if (meetings(branch, s.daeun.branch).includes("충"))
      points.push(
        elScore(r, BRANCH_EL[s.daeun.branch]) > 0
          ? `${n.ko}의 ${BJ(branch, "이/가")} 대운의 ${BJ(s.daeun.branch, "을/를")} 충해요. 10년을 받치던 바탕이 한 번 흔들리는 해라, 큰 결정과 큰돈은 신중하게.`
          : `${n.ko}의 ${BJ(branch, "이/가")} 대운의 ${BJ(s.daeun.branch, "을/를")} 충해요. 버겁던 바탕이 한 번 흔들리니, 묵은 것을 정리하고 바꾸기 좋은 해예요.`,
      );
  }
  const months = monthMarks(p, r, y);
  const order = months.map((m, i) => ({ i, s: m.score })).sort((a, b) => b.s - a.s);
  return {
    year: y,
    hanja: n.hanja,
    ko: n.ko,
    age: profile?.birthYear ? y - profile.birthYear : null,
    verdict: s.verdict,
    theme: THEME[g],
    themeLine: THEME_LINE[g],
    line: reasonLine(r, s, y),
    when: y < now ? "past" : y === now ? "now" : "future",
    gods: [tenGod(p.dayStem, stem), tenGod(p.dayStem, HIDDEN[branch].at(-1)![0])],
    stage: stageOf(p.dayStem, branch),
    points,
    months,
    best: order.slice(0, 2).map((o) => o.i).sort((a, b) => a - b),
    worst: order.slice(-2).map((o) => o.i).sort((a, b) => a - b),
    score: s,
  };
}

// For the writer: everything the free screen showed, and the evidence behind it.
export function yeonunBrief(p: Pillars, profile: Profile | null, y: number, now: number): string {
  const d = yearDetail(p, profile, y, now);
  if (!d) return "";
  const when =
    d.when === "past"
      ? `이미 지난 해다(지금은 ${now}년). "그해에는 이런 일이 있었을 거예요"처럼 되짚어 확인하는 말투로 쓰고, 단정하지 말고 가능성으로 말한다. 그 경험이 지금에 남긴 것과, 같은 기운이 다시 올 때를 함께 짚는다.`
      : d.when === "now"
        ? `올해다. 이미 지난 달은 되짚고, 남은 달은 할 일로 쓴다.`
        : `앞으로 올 해다(지금은 ${now}년). 미리 준비할 것과 그해에 붙잡을 것을 쓴다.`;
  return [
    `■ ★ 연운 근거 (이 보고서의 뼈대. 판정과 달별 기호는 이미 계산됐고 읽는 사람이 무료 화면에서 봤다. 같은 방향으로 쓴다)`,
    `- 대상 연도: ${y}년 ${d.hanja}(${d.ko})${d.age !== null ? `, 그해 나이 ${d.age}세 무렵` : ""} / ${when}`,
    `- 판정: ${d.verdict} (점수 ${d.score.score.toFixed(1)}) / 그해의 결: ${d.theme} — ${d.themeLine}`,
    `- 세운 천간 = ${d.gods[0]}, 지지 = ${d.gods[1]} / 일간의 12운성: ${d.stage}`,
    `- 판정을 움직인 것(큰 순서): ${d.score.factors.map((f) => `${f.tag} ${f.delta > 0 ? "+" : ""}${f.delta.toFixed(1)}`).join(", ") || "없음"}`,
    `- 무료 화면의 풀이: ${d.points.join(" / ")}`,
    `- 달별(절기 기준, ◎좋음 ○무난 △조심 ✕고비): ${d.months.map((m) => `${m.from.split("/")[0]}월(${m.from}~) ${m.gz} ${"✕△○◎"[m.rating]}${m.tags.length ? `(${m.tags.join(",")})` : ""}`).join(" / ")}`,
    `- 가장 좋은 달: ${d.best.map((i) => `${d.months[i].from.split("/")[0]}월`).join(", ")} / 조심할 달: ${d.worst.map((i) => `${d.months[i].from.split("/")[0]}월`).join(", ")}`,
    ...(d.score.daeun ? [] : ["- 성별을 몰라 대운을 계산하지 않았다(대운 이야기는 하지 않는다)."]),
  ].join("\n");
}
