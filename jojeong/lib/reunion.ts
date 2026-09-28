import { coupleOf } from "./couple";
import { meetings, stemCombine } from "./deep";
import { ELEMENT_HANJA, ELEMENT_KO } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";

// 재회운: the threads that still tie two people who parted, what pushed them apart, and the years ahead that
// bring them back into reach. Feeds the free card (components/ReunionIntro.tsx) and the writer's brief.

export type Reunion = {
  ties: string[];
  splits: string[];
  verdict: "끈이 남아 있는 인연" | "당기는 힘과 미는 힘이 비슷한 인연" | "끈이 약한 인연" | "사주보다 상황이 갈라놓은 인연";
  windows: { year: number; gz: string; why: string }[];
};

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

export function reunionOf(a: Person, b: Person): Reunion | null {
  const c = coupleOf(a, b);
  if (!c) return null;
  const ties: string[] = [];
  const splits: string[] = [];
  if (stemCombine(a.pillars.dayStem, b.pillars.dayStem)) ties.push("두 사람의 일간이 천간합이에요. 헤어져도 쉽게 끊어지지 않는, 서로를 끌어당기는 끈이에요.");
  const seat = meetings(a.pillars.dayBranch, b.pillars.dayBranch);
  if (seat.includes("육합")) ties.push("배우자 자리(일지)끼리 육합이에요. 함께 있을 때의 편안함이 오래 남는 사이예요.");
  else if (seat.includes("삼합")) ties.push("배우자 자리(일지)끼리 반합이에요. 같은 곳을 바라보던 기억이 끈으로 남아 있어요.");
  if (c.yongGive[0] >= 0.25) ties.push(`${a.name}님에게 가장 필요한 기운을 ${b.name}님이 넉넉히 갖고 있어요. 그래서 그 사람의 빈자리가 유난히 크게 느껴져요.`);
  if (c.yongGive[1] >= 0.25) ties.push(`${b.name}님에게 가장 필요한 기운을 ${a.name}님이 넉넉히 갖고 있어요. 그 사람도 ${a.name}님의 빈자리를 느끼기 쉬워요.`);
  for (const l of c.lends.slice(0, 1)) ties.push(`${l.to}님에게 모자란 ${EL(l.el)} 기운을 ${l.from}님이 ${l.pct}% 갖고 있어요. 곁에 없으면 허전함이 오래 남는 사이예요.`);
  if (seat.includes("충")) splits.push("배우자 자리(일지)끼리 충이에요. 끌림만큼 부딪힘도 커서, 같은 문제로 다시 멀어지기 쉬워요.");
  if (seat.includes("원진")) splits.push("배우자 자리(일지)끼리 원진이에요. 말하지 않은 서운함이 쌓여 멀어진 사이일 가능성이 커요.");
  if (seat.includes("형")) splits.push("배우자 자리(일지)끼리 형이에요. 가까울수록 날이 서는 순간이 있었을 거예요.");
  if (seat.includes("해") || seat.includes("파")) splits.push("배우자 자리(일지)끼리 어긋나는 관계(해·파)예요. 작은 오해와 엇갈린 약속이 쌓이기 쉬웠어요.");
  if (c.sharedLack.length) splits.push(`둘 다 ${c.sharedLack.map(EL).join("·")} 기운이 부족해요. 서로 채워 주지 못한 빈틈이 있었어요.`);
  const verdict: Reunion["verdict"] = !ties.length && !splits.length ? "사주보다 상황이 갈라놓은 인연" : ties.length > splits.length ? "끈이 남아 있는 인연" : ties.length === splits.length ? "당기는 힘과 미는 힘이 비슷한 인연" : "끈이 약한 인연";

  // 2026–2030: a year that combines with either spouse seat, and clashes with neither, brings them back in reach.
  const windows: Reunion["windows"] = [];
  for (let y = 2026; y <= 2030; y++) {
    const yb = (y - 4) % 12;
    const joins = [a, b].filter((x) => meetings(yb, x.pillars.dayBranch).some((m) => m === "육합" || m === "삼합"));
    const clash = [a, b].some((x) => meetings(yb, x.pillars.dayBranch).includes("충"));
    if (!joins.length || clash) continue;
    windows.push({ year: y, gz: `${STEMS[(y - 4) % 10]}${BRANCHES[yb]}`, why: joins.length === 2 ? "두 사람의 배우자 자리에 모두 합이 드는 해" : `${joins[0].name}님의 배우자 자리에 합이 드는 해` });
  }
  return { ties, splits, verdict, windows };
}

export function reunionBrief(a: Person, b: Person): string {
  const r = reunionOf(a, b);
  if (!r) return "";
  return [
    `■ ★ 재회 근거 (이 보고서의 뼈대. 엔진 판정: ${r.verdict})`,
    `- 남아 있는 끈: ${r.ties.length ? r.ties.join(" ") : "뚜렷한 끈 없음"}`,
    `- 멀어지게 한 것: ${r.splits.length ? r.splits.join(" ") : "뚜렷한 구조 없음(사주보다 상황이 멀어지게 했을 가능성)"}`,
    `- 다시 닿기 좋은 해(2026~2030): ${r.windows.length ? r.windows.map((w) => `${w.year} ${w.gz}(${w.why})`).join(", ") : "뚜렷한 해 없음"}`,
  ].join("\n");
}
