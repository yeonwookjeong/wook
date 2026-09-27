import { meetings } from "./deep";
import { josa } from "./josa";
import { ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, readChart, tenGod, type GodGroup } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, matchPillars, STEMS } from "./saju";

// Two charts side by side for the 궁합 report: what each is to the other, which elements one lends the other,
// how the spouse seats meet, and the years ahead that pull the two together or apart.

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

// What the other's day master is to me, by the ten-god group it falls in.
const ROLE: Record<GodGroup, string> = {
  비겁: "친구처럼 대등하게 맞서는 사람",
  식상: "나도 모르게 챙기고 표현하게 되는 사람",
  재성: "내가 이끌고 싶고 곁에 두고 싶은 사람",
  관성: "나를 긴장시키고 바로잡아 주는 사람",
  인성: "나를 품어 주고 기대게 되는 사람",
};

const SEAT: Record<string, string> = {
  육합: "배우자 자리끼리 합: 함께 있으면 편하고 정이 깊어지는 사이",
  삼합: "배우자 자리끼리 반합: 같은 곳을 바라보는 사이",
  방합: "배우자 자리가 같은 계절: 생활 리듬이 닮은 사이",
  충: "배우자 자리끼리 충: 끌림만큼 부딪힘도 큰 사이",
  원진: "배우자 자리끼리 원진: 이유 없이 서운함이 쌓이기 쉬운 사이",
  형: "배우자 자리끼리 형: 가까울수록 날이 서기 쉬운 사이",
  해: "배우자 자리끼리 해: 작은 오해가 쌓이기 쉬운 사이",
  파: "배우자 자리끼리 파: 약속이 어긋나기 쉬운 사이",
};

export type Couple = {
  score: number;
  roles: [string, string]; // what b is to a, what a is to b
  lends: { to: string; from: string; el: number; pct: number }[]; // elements one has plenty of and the other lacks
  sharedLack: number[]; // elements both lack
  yongGive: [number, number]; // share of a's 용신 element in b, of b's in a
  seat: string[];
  years: { year: number; gz: string; mark: "함께 좋은 해" | "흔들리기 쉬운 해"; why: string }[];
};

export function coupleOf(a: Person, b: Person): Couple | null {
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
  const seat = meetings(a.pillars.dayBranch, b.pillars.dayBranch)
    .map((m) => SEAT[m])
    .filter(Boolean);
  // 2026–2030: a year that combines with both spouse seats pulls the two together; one that clashes either
  // seat shakes the bond.
  const years: Couple["years"] = [];
  for (let y = 2026; y <= 2030; y++) {
    const yb = (y - 4) % 12;
    const gz = `${STEMS[(y - 4) % 10]}${BRANCHES[yb]}`;
    const joins = (d: number) => meetings(yb, d).some((m) => m === "육합" || m === "삼합");
    const clashes = [a, b].filter((x) => meetings(yb, x.pillars.dayBranch).includes("충"));
    if (clashes.length) years.push({ year: y, gz, mark: "흔들리기 쉬운 해", why: `${clashes.map((x) => x.name).join("·")}의 배우자 자리를 충` });
    else if (joins(a.pillars.dayBranch) && joins(b.pillars.dayBranch)) years.push({ year: y, gz, mark: "함께 좋은 해", why: "두 사람의 배우자 자리와 모두 합" });
  }
  return {
    score: matchPillars(a.pillars, b.pillars).score,
    roles: [ROLE[GROUP_OF[tenGod(a.pillars.dayStem, b.pillars.dayStem)]], ROLE[GROUP_OF[tenGod(b.pillars.dayStem, a.pillars.dayStem)]]],
    lends,
    sharedLack,
    yongGive: [sb[ra.yong], sa[rb.yong]],
    seat,
    years,
  };
}

// The pair's lines for the writer's brief.
export function coupleBrief(a: Person, b: Person): string {
  const c = coupleOf(a, b);
  if (!c) return "";
  const ra = readChart(a.pillars)!;
  const rb = readChart(b.pillars)!;
  return [
    `■ ★ 두 사람 사이 (엔진 궁합 점수 ${c.score}점, 평균 69)`,
    `- ${josa(b.name, "은/는")} ${a.name}에게 "${c.roles[0]}" (${tenGod(a.pillars.dayStem, b.pillars.dayStem)})`,
    `- ${josa(a.name, "은/는")} ${b.name}에게 "${c.roles[1]}" (${tenGod(b.pillars.dayStem, a.pillars.dayStem)})`,
    `- 용신 채워 주기: ${a.name}의 용신 ${josa(EL(ra.yong), "을/를")} ${josa(b.name, "이/가")} ${Math.round(c.yongGive[0] * 100)}% 가짐 / ${b.name}의 용신 ${josa(EL(rb.yong), "을/를")} ${josa(a.name, "이/가")} ${Math.round(c.yongGive[1] * 100)}% 가짐`,
    `- 오행 보완: ${c.lends.length ? c.lends.map((l) => `${l.to}에게 부족한 ${josa(EL(l.el), "을/를")} ${josa(l.from, "이/가")} ${l.pct}% 가짐`).join("; ") : "뚜렷한 보완 없음"}${c.sharedLack.length ? ` / 둘 다 부족: ${c.sharedLack.map(EL).join("·")} (함께 채워야 할 것)` : ""}`,
    `- 배우자 자리(일지)끼리: ${c.seat.length ? c.seat.join("; ") : "특별한 합충 없음"}`,
    `- ★ 두 사람의 해(2026~2030): ${c.years.length ? c.years.map((y) => `${y.year} ${y.gz} ${y.mark}(${y.why})`).join(", ") : "크게 흔들리거나 겹치는 해 없음"}`,
  ].join("\n");
}
