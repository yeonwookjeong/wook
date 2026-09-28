import { meetings, salsAt, stemCombine } from "./deep";
import { josa } from "./josa";
import { chartOf, readChart } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, isFull, STEMS } from "./saju";

// 속궁합: what the charts say about closeness between two people — attraction, warmth, pace and how
// affection is shown. Kept to the classical signs, and written as closeness, never explicit. The same reading
// feeds the free card (components/IntimacyIntro.tsx) and the writer's brief.

// 홍염(紅艶): by day stem, the branch that gives charm and allure.
const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];

// How warm a person runs (fire against water) and how fast they show it (expression against restraint).
export const TEMPERS = {
  flame: { name: "불꽃형", line: "금방 달아오르고 마음이 바로 표정과 말에 드러나요. 설렘을 먼저 만드는 쪽이에요." },
  ember: { name: "숯불형", line: "속은 뜨거운데 겉으로는 천천히 보여 줘요. 한번 불이 붙으면 오래가요." },
  wave: { name: "물결형", line: "부드럽고 다정하게 먼저 다가가요. 분위기와 공감으로 가까워지는 쪽이에요." },
  spring: { name: "샘물형", line: "조용하고 깊어요. 마음을 여는 데 시간이 걸리지만, 열리면 누구보다 깊게 스며들어요." },
  sun: { name: "봄볕형", line: "뜨겁지도 차갑지도 않게 한결같이 따뜻해요. 편안함 속에서 애정을 자주 표현해요." },
  ondol: { name: "온돌형", line: "은근하게 데워지는 사람이에요. 말보다 곁에 있어 주는 것으로 마음을 전해요." },
} as const;
export type Temper = keyof typeof TEMPERS;

export type Signs = {
  temper: Temper;
  fire: number; // 화(열기) %
  water: number; // 수(촉촉함) %
  express: number; // 식상 %
  restrain: number; // 관성 %
  dohwa: string[];
  hong: string[];
  yang: number;
  count: number;
};

function signsOf(x: Person): Signs | null {
  const p = x.pillars;
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const slots = chartOf(p).filter((s) => s.branch !== null);
  const at = (b: number) => slots.filter((s) => s.branch === b).map((s) => `${s.pos}지`);
  const dohwa = [...new Set(slots.flatMap((s) => (salsAt(p, s.branch!).includes("도화") ? [`${s.pos}지 ${BRANCHES[s.branch!]}`] : [])))];
  const hong = at(HONGYEOM[p.dayStem]);
  const total = r.weights.reduce((a, b) => a + b, 0) || 1;
  const pct = (e: number) => Math.round((r.weights[e] / total) * 100);
  const g = r.godWeights;
  const gTotal = Object.values(g).reduce((a, b) => a + b, 0) || 1;
  const gp = (k: keyof typeof g) => Math.round((g[k] / gTotal) * 100);
  // Yang stems 甲丙戊庚壬 and yang branches 子寅辰午申戌 (even index).
  const chars = [...chartOf(p).flatMap((s) => [s.stem, s.branch])].filter((v): v is number => v !== null);
  const yang = chars.filter((v) => v % 2 === 0).length;
  const fire = pct(1);
  const water = pct(4);
  const express = gp("식상");
  const restrain = gp("관성");
  const heat = fire - water;
  const quick = express > restrain;
  const temper: Temper = heat >= 15 ? (quick ? "flame" : "ember") : heat <= -15 ? (quick ? "wave" : "spring") : quick ? "sun" : "ondol";
  return { temper, fire, water, express, restrain, dohwa, hong, yang, count: chars.length };
}

export type Intimacy = {
  a: Signs;
  b: Signs;
  gap: "비슷함" | "조금 다름" | "많이 다름";
  warmer: string | null; // who runs hotter, when the gap is not small
  faster: string; // who shows it first
  pulls: string[]; // signs that draw the two together
  snags: string[]; // signs where they can miss each other
  months: { label: string; why: string }[]; // the months ahead that bring them closer
};

// Solar month m (from its 절기, around the 5th) holds branch m % 12: February 寅 … January 丑.
const monthBranch = (m: number) => m % 12;

export function intimacyOf(a: Person, b: Person, now = new Date()): Intimacy | null {
  const sa = signsOf(a);
  const sb = signsOf(b);
  if (!sa || !sb) return null;
  const heat = sa.fire - sa.water - (sb.fire - sb.water);
  // The gap follows the same three bands the types do: hot, middle, cool.
  const band = (x: Signs) => (x.fire - x.water >= 15 ? 1 : x.fire - x.water <= -15 ? -1 : 0);
  const apart = Math.abs(band(sa) - band(sb));
  const gap = apart === 0 ? "비슷함" : apart === 1 ? "조금 다름" : "많이 다름";
  const pulls: string[] = [];
  const snags: string[] = [];
  if (stemCombine(a.pillars.dayStem, b.pillars.dayStem)) pulls.push("두 사람의 일간이 천간합을 이뤄요. 이유 없이 서로 끌리는 인연의 표시예요.");
  const seat = meetings(a.pillars.dayBranch, b.pillars.dayBranch);
  if (seat.includes("육합")) pulls.push("배우자 자리(일지)끼리 육합이에요. 함께 있으면 몸도 마음도 편안해지는 사이예요.");
  else if (seat.includes("삼합")) pulls.push("배우자 자리(일지)끼리 반합이에요. 같은 리듬으로 가까워지는 사이예요.");
  if (salsAt(a.pillars, b.pillars.dayBranch).includes("도화")) pulls.push(`${b.name}님의 배우자 자리가 ${a.name}님에게 도화예요. ${a.name}님이 ${b.name}님에게 끌리는 힘이 커요.`);
  if (salsAt(b.pillars, a.pillars.dayBranch).includes("도화")) pulls.push(`${a.name}님의 배우자 자리가 ${b.name}님에게 도화예요. ${b.name}님이 ${a.name}님에게 끌리는 힘이 커요.`);
  if (HONGYEOM[a.pillars.dayStem] === b.pillars.dayBranch) pulls.push(`${b.name}님의 배우자 자리가 ${a.name}님의 홍염 글자예요. 곁에 있으면 설렘이 쉽게 살아나요.`);
  if (HONGYEOM[b.pillars.dayStem] === a.pillars.dayBranch) pulls.push(`${a.name}님의 배우자 자리가 ${b.name}님의 홍염 글자예요. 곁에 있으면 설렘이 쉽게 살아나요.`);
  const ya = sa.yang / (sa.count || 1);
  const yb = sb.yang / (sb.count || 1);
  if (apart === 2) pulls.push("한 사람은 뜨겁고 한 사람은 촉촉해요. 서로에게 없는 온도라 곁에 있으면 자꾸 끌려요.");
  if ((ya >= 0.6 && yb <= 0.4) || (yb >= 0.6 && ya <= 0.4)) pulls.push("한 사람은 양, 한 사람은 음의 기운이 강해요. 이끄는 쪽과 받아 주는 쪽이 자연스럽게 나뉘어요.");
  if (seat.includes("충")) snags.push("배우자 자리(일지)끼리 충이에요. 끌림이 강한 만큼 기분의 파도도 커요.");
  if (seat.includes("원진")) snags.push("배우자 자리(일지)끼리 원진이에요. 말 안 한 서운함이 스킨십의 거리로 나타나기 쉬워요.");
  if (seat.includes("형")) snags.push("배우자 자리(일지)끼리 형이에요. 가까울수록 예민해지는 순간이 있어요.");
  if (gap === "많이 다름") snags.push("두 사람의 온도 차가 커요. 한 사람이 뜨거울 때 다른 사람은 아직 준비가 덜 됐을 수 있어요.");
  const pace = sa.express - sa.restrain - (sb.express - sb.restrain);
  if (Math.abs(pace) >= 25) snags.push("애정을 표현하는 속도가 많이 달라요. 기다려 주는 연습이 필요해요.");
  if (ya >= 0.6 && yb >= 0.6) snags.push("둘 다 양의 기운이 강해요. 서로 이끌려다 부딪히기 쉬워요.");

  // The next twelve months: one that combines with a spouse seat, or brings either one's 도화.
  const kst = new Date(now.getTime() + 9 * 3600000);
  const months: Intimacy["months"] = [];
  for (let i = 1; i <= 12 && months.length < 4; i++) {
    const t = kst.getUTCFullYear() * 12 + kst.getUTCMonth() + i;
    const y = Math.floor(t / 12);
    const m = (t % 12) + 1;
    const mb = monthBranch(m);
    const both = meetings(mb, a.pillars.dayBranch).includes("육합") || meetings(mb, b.pillars.dayBranch).includes("육합");
    const blossom = salsAt(a.pillars, mb).includes("도화") || salsAt(b.pillars, mb).includes("도화");
    const clash = meetings(mb, a.pillars.dayBranch).includes("충") || meetings(mb, b.pillars.dayBranch).includes("충");
    if (clash || !(both || blossom)) continue;
    months.push({ label: `${y}년 ${m}월`, why: both ? "배우자 자리에 합이 드는 달" : "도화가 피는 달" });
  }

  return {
    a: sa,
    b: sb,
    gap,
    warmer: gap === "비슷함" ? null : heat > 0 ? a.name : b.name,
    faster: pace >= 0 ? a.name : b.name,
    pulls,
    snags,
    months,
  };
}

export function intimacyBrief(a: Person, b: Person): string {
  const x = intimacyOf(a, b);
  if (!x) return "";
  const line = (p: Person, s: Signs) =>
    `- ${p.name}: 애정 온도 유형 '${TEMPERS[s.temper].name}'(${TEMPERS[s.temper].line}) / 도화 ${s.dohwa.length ? s.dohwa.join(", ") : "없음"} / 홍염 ${s.hong.length ? s.hong.join(", ") : "없음"} / 화(열기) ${s.fire}% · 수(촉촉함) ${s.water}% / 표현하는 힘(식상) ${s.express}% · 절제하는 힘(관성) ${s.restrain}% / 양 ${s.yang}:음 ${s.count - s.yang}`;
  return [
    "■ ★ 속궁합 근거 (이 보고서의 뼈대. 친밀감·스킨십·애정 표현의 궁합. 노골적인 묘사 없이 분위기와 장면으로 쓸 것)",
    line(a, x.a),
    line(b, x.b),
    `- 일간끼리: ${STEMS[a.pillars.dayStem]}·${STEMS[b.pillars.dayStem]}${stemCombine(a.pillars.dayStem, b.pillars.dayStem) ? " 천간합(서로 끌어당기는 인연)" : ""} / 배우자 자리(일지)끼리: ${BRANCHES[a.pillars.dayBranch]}·${BRANCHES[b.pillars.dayBranch]}`,
    `- 온도 차: ${x.gap}${x.warmer ? ` (${josa(x.warmer, "이/가")} 더 뜨거움)` : ""} / 먼저 표현하는 쪽: ${x.faster}`,
    `- 끌어당기는 표시: ${x.pulls.length ? x.pulls.join(" ") : "뚜렷한 표시 없음(끌림보다 함께 쌓는 친밀감의 사이)"}`,
    `- 엇갈리기 쉬운 표시: ${x.snags.length ? x.snags.join(" ") : "뚜렷한 표시 없음"}`,
    `- 가까워지는 달(앞으로 12개월): ${x.months.length ? x.months.map((m) => `${m.label}(${m.why})`).join(", ") : "뚜렷한 달 없음"}`,
  ].join("\n");
}
