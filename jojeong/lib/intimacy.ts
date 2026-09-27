import { meetings, salsAt, stemCombine } from "./deep";
import { josa } from "./josa";
import { chartOf, readChart } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, isFull, STEMS } from "./saju";

// 속궁합: what the charts say about closeness between two people — attraction, warmth, pace and how
// affection is shown. Kept to the classical signs, and written as closeness, never explicit.

// 홍염(紅艶): by day stem, the branch that gives charm and allure.
const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];

function signsOf(x: Person) {
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
  return { r, dohwa, hong, fire: pct(1), water: pct(4), express: gp("식상"), restrain: gp("관성"), yang, count: chars.length };
}

export function intimacyBrief(a: Person, b: Person): string {
  const sa = signsOf(a);
  const sb = signsOf(b);
  if (!sa || !sb) return "";
  const line = (x: Person, s: NonNullable<ReturnType<typeof signsOf>>) =>
    `- ${x.name}: 도화 ${s.dohwa.length ? s.dohwa.join(", ") : "없음"} / 홍염 ${s.hong.length ? s.hong.join(", ") : "없음"} / 화(열기) ${s.fire}% · 수(촉촉함) ${s.water}% / 표현하는 힘(식상) ${s.express}% · 절제하는 힘(관성) ${s.restrain}% / 양 ${s.yang}:음 ${s.count - s.yang}`;
  const seat = meetings(a.pillars.dayBranch, b.pillars.dayBranch);
  const heat = sa.fire - sa.water - (sb.fire - sb.water);
  return [
    "■ ★ 속궁합 근거 (친밀감·스킨십·애정 표현의 궁합. 노골적인 묘사 없이 분위기와 장면으로 쓸 것)",
    line(a, sa),
    line(b, sb),
    `- 배우자 자리(일지)끼리: ${BRANCHES[a.pillars.dayBranch]}·${BRANCHES[b.pillars.dayBranch]} ${seat.length ? seat.join("·") : "특별한 합충 없음"}`,
    `- 일간끼리: ${STEMS[a.pillars.dayStem]}·${STEMS[b.pillars.dayStem]}${stemCombine(a.pillars.dayStem, b.pillars.dayStem) ? " 천간합(서로 끌어당기는 인연)" : ""}`,
    `- 온도 차: ${Math.abs(heat) < 15 ? "두 사람의 열기와 촉촉함이 비슷함" : `${josa(heat > 0 ? a.name : b.name, "이/가")} 더 뜨겁고 ${josa(heat > 0 ? b.name : a.name, "이/가")} 더 차분함`}`,
    `- 다가가는 속도: ${sa.express - sa.restrain > sb.express - sb.restrain ? a.name : b.name} 쪽이 먼저 표현하는 편`,
  ].join("\n");
}
