import { sajuYear } from "./yeonun";
import { meetings } from "./deep";
import { josa } from "./josa";
import { ROLE } from "./bond";
import { ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, readChart, tenGod } from "./myeongri";
import type { Person } from "./pairToken";
import { halfCombine, SEAT_NAME, seatOf, type Rel } from "./rels";
import { BRANCHES, matchPillars, STEMS } from "./saju";

// Two charts side by side for the 궁합 report: what each is to the other, which elements one lends the other,
// how the spouse seats meet, and the years ahead that pull the two together or apart.

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

// What two seats meeting says, in the reader's words (the term goes to the writer only, lib/couple.ts coupleBrief):
// for lovers about the bond itself, for the rest about getting along day to day (2026-10-25 강 어사 기준: no
// 끌림·정 outside lovers). 巳申·寅亥 are both a 합 and a 형/파, and say both. A 반합 is only a pull, not a bond.
const LOVER_LINE: Record<string, string> = {
  육합: "함께 있으면 편하고 정이 깊어지는 사이",
  삼합: "같은 쪽으로 기운이 모이려는 사이",
  방합: "생활 리듬이 닮은 사이",
  충: "끌림만큼 부딪힘도 큰 사이",
  원진: "이유 없이 서운함이 쌓이기 쉬운 사이",
  형: "가까울수록 날이 서기 쉬운 사이",
  해: "작은 오해가 쌓이기 쉬운 사이",
  파: "약속이 어긋나기 쉬운 사이",
};
const PLAIN_LINE: Record<string, string> = {
  ...LOVER_LINE,
  육합: "같이 있을 때 편하고 손발이 잘 맞는 사이",
  충: "가까이 붙어 지낼수록 생활 방식이 부딪히기 쉬운 사이(거리를 두면 오히려 편해요)",
  원진: "서운함이 쌓이기 쉬운 사이",
};
const TERM: Record<string, string> = { 육합: "합", 삼합: "반합", 방합: "같은 계절", 충: "충", 원진: "원진", 형: "형", 해: "해", 파: "파" };

// A seat a year joins: 육합 (not one that is also a 형·파), or a 반합 with its 왕지.
export function joinsYear(year: number, seat: number) {
  const m = meetings(year, seat);
  return (m.includes("육합") && !m.includes("형") && !m.includes("파")) || (m.includes("삼합") && halfCombine(year, seat));
}
// A year that binds both seats: each joined, or the year and the two seats make the whole 삼합 (寅午戌 …), even
// when one pair of the three has no 왕지.
export function tieYear(year: number, a: number, b: number) {
  const whole = new Set([year, a, b]).size === 3 && year % 4 === a % 4 && a % 4 === b % 4;
  return whole || (joinsYear(year, a) && joinsYear(year, b));
}

// The 궁합 score from ENGINE2_SINCE (2026-10-26 강 어사 기준): matchPillars without its hash jitter (no reason in
// the chart), a 반합 only with its 왕지, and for lovers of opposite known genders the other's day stem read as the
// spouse star: to a woman 정관 76 · 편관 66, to a man 정재 76 · 편재 70 (as high as 인성, not above: reading the
// spouse star between day stems is a modern way ⚖️). The game (lib/court.ts) keeps matchPillars as it is.
const BASE: Record<string, number> = { 인성: 76, 비겁: 70, 재성: 66, 식상: 64, 관성: 56 };
export function gunghapScore(a: Person, b: Person, rel: Rel): number {
  const f = matchPillars(a.pillars, b.pillars).facts;
  const god = tenGod(a.pillars.dayStem, b.pillars.dayStem);
  const lovers = rel === "연인" && a.gender && b.gender && a.gender !== b.gender;
  let score =
    lovers && a.gender === "f" && (god === "정관" || god === "편관")
      ? god === "정관" ? 76 : 66
      : lovers && a.gender === "m" && (god === "정재" || god === "편재")
        ? god === "정재" ? 76 : 70
        : BASE[f.group];
  if (f.stemCombine) score += 16;
  if (f.daySix) score += 12;
  if (f.dayThree && halfCombine(a.pillars.dayBranch, b.pillars.dayBranch)) score += 6;
  if (f.dayClash) score -= 18;
  if (f.dayWonjin) score -= 10;
  if (f.yearSix) score += 5;
  if (f.yearThree && halfCombine(a.pillars.yearBranch, b.pillars.yearBranch)) score += 4;
  if (f.yearClash) score -= 6;
  if (f.hourSix) score += 4;
  if (f.hourClash) score -= 4;
  if (f.yong) score += Math.min(3, f.yong.count) * 4 - Math.max(0, f.yong.giCount - 1) * 2 - 4;
  return Math.max(12, Math.min(99, score));
}
// The average of gunghapScore over random pairs, shown beside it (2026-10-26, 3,000 pairs): lovers of opposite
// known genders, where the spouse star counts, 70; every other pair 68.
export const GUNGHAP_AVG = 70;
export const GUNGHAP_AVG_OTHER = 68;
export const gunghapAvg = (a: Person, b: Person, rel: Rel) => (rel === "연인" && a.gender && b.gender && a.gender !== b.gender ? GUNGHAP_AVG : GUNGHAP_AVG_OTHER);

export type Couple = {
  score: number;
  avg: number; // the average shown beside it
  roles: [string, string]; // what b is to a, what a is to b
  lends: { to: string; from: string; el: number; pct: number }[]; // elements one has plenty of and the other lacks
  sharedLack: number[]; // elements both lack
  yongGive: [number, number]; // share of a's 용신 element in b, of b's in a
  seat: { term: string; line: string }[]; // what the two seats' meeting is called (writer only), and what it means
  seatName: string;
  years: { year: number; gz: string; mark: "함께 좋은 해" | "흔들리기 쉬운 해"; why: string }[];
};

// v2: the score as above (lib/patterns.ts ENGINE2_SINCE); false keeps the old one for a report bought before.
export function coupleOf(a: Person, b: Person, from = sajuYear(), rel: Rel = "연인", v2 = true): Couple | null {
  const ra = readChart(a.pillars);
  const rb = readChart(b.pillars);
  if (!ra || !rb) return null;
  const share = (w: number[]) => {
    const s = w.reduce((x, y) => x + y, 0) || 1;
    return w.map((v) => v / s);
  };
  const sa = share(ra.weights);
  const sb = share(rb.weights);
  const lends: Couple["lends"] = [];
  const sharedLack: number[] = [];
  for (let e = 0; e < 5; e++) {
    if (sa[e] < 0.08 && sb[e] >= 0.2) lends.push({ to: a.name, from: b.name, el: e, pct: Math.round(sb[e] * 100) });
    if (sb[e] < 0.08 && sa[e] >= 0.2) lends.push({ to: b.name, from: a.name, el: e, pct: Math.round(sa[e] * 100) });
    if (sa[e] < 0.08 && sb[e] < 0.08) sharedLack.push(e);
  }
  const name = SEAT_NAME[rel];
  const [seatA, seatB] = [seatOf(a.pillars, rel), seatOf(b.pillars, rel)];
  const seat = meetings(seatA, seatB)
    .filter((m) => m !== "삼합" || halfCombine(seatA, seatB))
    .map((m) => ({ term: TERM[m], line: (rel === "연인" ? LOVER_LINE : PLAIN_LINE)[m] }));
  // This year and the four after (from the year the report is read for): a year that combines with both seats pulls
  // the two together; one that clashes either seat shakes the bond. The same rule as the paid ten-year table (lib/pairYears.ts).
  const years: Couple["years"] = [];
  for (let y = from; y <= from + 4; y++) {
    const yb = (((y - 4) % 12) + 12) % 12;
    const gz = `${STEMS[(((y - 4) % 10) + 10) % 10]}${BRANCHES[yb]}`;
    const clashes = [a, b].filter((x) => meetings(yb, seatOf(x.pillars, rel)).includes("충"));
    if (clashes.length) years.push({ year: y, gz, mark: "흔들리기 쉬운 해", why: `${clashes.map((x) => x.name).join("·")}의 ${name}를 그해 기운이 충` });
    else if (tieYear(yb, seatA, seatB)) years.push({ year: y, gz, mark: "함께 좋은 해", why: `두 사람의 ${name}와 모두 합` });
  }
  return {
    score: v2 ? gunghapScore(a, b, rel) : matchPillars(a.pillars, b.pillars).score,
    avg: v2 ? gunghapAvg(a, b, rel) : 69,
    roles: [ROLE[rel][GROUP_OF[tenGod(a.pillars.dayStem, b.pillars.dayStem)]], ROLE[rel][GROUP_OF[tenGod(b.pillars.dayStem, a.pillars.dayStem)]]],
    lends,
    sharedLack,
    yongGive: [sb[ra.yong], sa[rb.yong]],
    seat,
    seatName: name,
    years,
  };
}

// The pair's lines for the writer's brief. `from`: the year the brief is read for (the order's year). `years`: false
// when the report has the ten-year table (궁합 v8+), so the years are told once, by that table.
export function coupleBrief(a: Person, b: Person, from = sajuYear(), rel: Rel = "연인", years = true, v2 = true): string {
  const c = coupleOf(a, b, from, rel, v2);
  if (!c) return "";
  const ra = readChart(a.pillars)!;
  const rb = readChart(b.pillars)!;
  return [
    `■ ★ 두 사람 사이 (엔진 궁합 점수 ${c.score}점, 평균 ${c.avg}. 점수는 판정이 아니다)`,
    `- ${josa(b.name, "은/는")} ${a.name}에게 "${c.roles[0]}" (${tenGod(a.pillars.dayStem, b.pillars.dayStem)})`,
    `- ${josa(a.name, "은/는")} ${b.name}에게 "${c.roles[1]}" (${tenGod(b.pillars.dayStem, a.pillars.dayStem)})`,
    `- 용신 채워 주기: ${a.name}의 용신 ${josa(EL(ra.yong), "을/를")} ${josa(b.name, "이/가")} ${Math.round(c.yongGive[0] * 100)}% 가짐 / ${b.name}의 용신 ${josa(EL(rb.yong), "을/를")} ${josa(a.name, "이/가")} ${Math.round(c.yongGive[1] * 100)}% 가짐`,
    `- 오행 보완: ${c.lends.length ? c.lends.map((l) => `${l.to}에게 부족한 ${josa(EL(l.el), "을/를")} ${josa(l.from, "이/가")} ${l.pct}% 가짐`).join("; ") : "뚜렷한 보완 없음"}${c.sharedLack.length ? ` / 둘 다 부족: ${c.sharedLack.map(EL).join("·")} (함께 채워야 할 것)` : ""}`,
    `- 관계 자리(${c.seatName}): ${c.seat.length ? c.seat.map((x) => `${x.term}: ${x.line}`).join("; ") : "특별한 합충 없음"}`,
    ...(years ? [`- ★ 두 사람의 해(${from}~${from + 4}): ${c.years.length ? c.years.map((y) => `${y.year} ${y.gz} ${y.mark}(${y.why})`).join(", ") : "크게 흔들리거나 겹치는 해 없음"}`] : []),
  ].join("\n");
}
