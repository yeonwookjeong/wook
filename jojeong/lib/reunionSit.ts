import { meetings, stemClash } from "./deep";
import type { Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";
export { JAEHOE_TOC } from "./products";

// 재회운 v2: the reader says where things stand (연락이 끊겼나, 왔나, 오래 못 잊고 있나, and how long ago), and the
// report's chapters come in the order that situation asks them. Carried in the link as `kind` ("cut.y1").

export const SITS = { cut: "연락이 끊겼어요", back: "그 사람에게서 연락이 왔어요", linger: "오래 못 잊고 있어요" } as const;
export const SINCES = { m1: "한 달 안", y1: "1년 안", yp: "1년 넘게" } as const;
export type Sit = keyof typeof SITS;
export type Since = keyof typeof SINCES;
export type Situation = { sit: Sit; since: Since };

export function situationOf(kind: unknown): Situation | null {
  const m = typeof kind === "string" ? /^(cut|back|linger)\.(m1|y1|yp)$/.exec(kind) : null;
  return m ? { sit: m[1] as Sit, since: m[2] as Since } : null;
}
export const kindOf = (s: Situation) => `${s.sit}.${s.since}`;

// The order each situation reads them in.
const ORDER: Record<Sit, number[]> = {
  cut: [0, 1, 2, 3, 4, 5, 6, 7],
  // A message came: what it means, whether the old fight comes back with them, then the rest.
  back: [2, 0, 5, 1, 4, 3, 6, 7],
  // Long unforgotten: whether anything is left, then what comes if not, before any timing.
  linger: [0, 1, 6, 2, 3, 4, 5, 7],
};
export const chaptersForSit = (toc: string[], s: Situation | null) => (s && toc.length === 8 ? ORDER[s.sit].map((i) => toc[i]) : toc);

const SIT_FOCUS: Record<Sit, string> = {
  cut: "연락이 끊긴 사람이다. 지금 연락해도 될지, 언제가 나은지가 가장 궁금하다. 기다림을 부추기지 않는다.",
  back: "그 사람에게서 연락이 온 사람이다. 이 연락을 어떻게 읽을지, 다시 만나면 같은 일로 또 멀어지지 않을지가 가장 궁금하다. 받아들이라거나 끊으라고 정해 주지 않고, 볼 것을 짚어 준다.",
  linger: "오래 못 잊고 있는 사람이다. 아직 끈이 남았는지, 아니면 마음을 정리할 때인지가 가장 궁금하다. 판정이 약하면 놓아 주는 쪽을 분명히 쓰고, 새 인연이 드는 해로 시선을 옮겨 준다.",
};
const SINCE_FOCUS: Record<Since, string> = {
  m1: "헤어진 지 한 달이 안 됐다. 감정이 가장 날 선 때라 서두르지 말라는 쪽으로 쓴다.",
  y1: "헤어진 지 1년이 안 됐다.",
  yp: "헤어진 지 1년이 넘었다. 그 사이 두 사람 모두 달라졌을 수 있다는 점을 짚는다.",
};
export const situationBrief = (s: Situation) =>
  `■ ★ 읽는 사람의 상황: ${SITS[s.sit]}, 헤어진 지 ${SINCES[s.since]}\n- ${SIT_FOCUS[s.sit]}\n- ${SINCE_FOCUS[s.since]}\n- 장 순서는 이 상황에 맞춘 것이니 바꾸지 않는다.`;

// The next twelve months, each read on both spouse seats (일지) and day stems. "good": the month joins a seat
// (육합 or 삼합) and strains neither, and its stem clashes neither day stem; "both" when it joins both seats.
// "avoid": a 충·형·원진 on either seat. A month starts at its 절기 (about the 4th to the 8th of the solar month).
export type MonthWindow = { label: string; gz: string; kind: "both" | "good" | "avoid" };
const sajuMonth = (y: number, m: number) => {
  // On the 20th the 절기 has passed: the month branch is the solar month's (2월 寅 … 12월 子, 1월 丑).
  const branch = m % 12;
  const sy = m === 1 ? y - 1 : y;
  const ys = (((sy - 4) % 10) + 10) % 10;
  const k = (branch - 2 + 12) % 12; // months since 寅
  return { stem: ((ys % 5) * 2 + 2 + k) % 10, branch };
};
export function reunionMonths(a: Person, b: Person, now = new Date()): MonthWindow[] {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const out: MonthWindow[] = [];
  for (let i = 0; i < 12; i++) {
    const t = kst.getUTCFullYear() * 12 + kst.getUTCMonth() + i;
    const y = Math.floor(t / 12);
    const m = (t % 12) + 1;
    const { stem, branch } = sajuMonth(y, m);
    const side = (x: Person) => {
      const ms = meetings(branch, x.pillars.dayBranch);
      return {
        join: (ms.includes("육합") && !ms.includes("형") && !ms.includes("파")) || ms.includes("삼합"),
        bad: ms.some((q) => q === "충" || q === "형" || q === "원진"),
        clash: stemClash(stem, x.pillars.dayStem),
      };
    };
    const [sa, sb] = [side(a), side(b)];
    const label = `${y}년 ${m}월`;
    const gz = `${STEMS[stem]}${BRANCHES[branch]}`;
    if (sa.bad || sb.bad) out.push({ label, gz, kind: "avoid" });
    else if ((sa.join || sb.join) && !sa.clash && !sb.clash) out.push({ label, gz, kind: sa.join && sb.join ? "both" : "good" });
  }
  return out;
}
export const monthsBrief = (ms: MonthWindow[]) => {
  const pick = (k: MonthWindow["kind"]) => ms.filter((x) => x.kind === k).map((x) => `${x.label}(${x.gz}월)`).join(", ") || "없음";
  return [
    "■ ★ 앞으로 열두 달 (닿기 좋은 달, 피할 달 장의 근거. 달은 절기로 바뀌어 양력 4~8일쯤 시작)",
    `- 두 사람 배우자 자리에 함께 합이 드는 달: ${pick("both")}`,
    `- 한 사람 배우자 자리에 합이 들고 둘 다 부딪힘이 없는 달: ${pick("good")}`,
    `- 배우자 자리에 충·형·원진이 드는 달(말이 어긋나기 쉬우니 큰 이야기를 피할 달): ${pick("avoid")}`,
    "- 여기 없는 달을 새로 고르지 않는다. 좋은 달도 '그때 연락하면 된다'고 장담하지 않고, 마음을 전하기 덜 어긋나는 때로만 쓴다.",
  ].join("\n");
};
