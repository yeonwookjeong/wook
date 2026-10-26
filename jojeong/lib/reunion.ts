import { sajuYear, yearRows, type Verdict } from "./yeonun";
import { coupleOf } from "./couple";
import { meetings, stemClash, stemCombine, type Meeting } from "./deep";
import { BRANCH_EL, ELEMENT_HANJA, ELEMENT_KO, readChart, stemEl } from "./myeongri";
import { profileOf, type Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";

// 재회운: the threads that still tie two people who parted, what pushed them apart, and the years ahead that
// bring them back into reach. Feeds the free card (components/ReunionIntro.tsx) and the writer's brief.
//
// Each thread and each cause carries a weight, so one strong bond is not outweighed by two small frictions (and the
// reverse): the verdict compares the sums, not the counts (2026-10-23 강 어사 진단, B1). A 반합 counts only when a
// 왕지 (子午卯酉) is in it, and a 육합 that is also a 형 or 파 (巳申, 寅亥) counts as both, weakly (myeongri-study 2장).

export type Weighted = { line: string; w: number };
export type ReunionWindow = {
  year: number;
  gz: string;
  // "together": both spouse seats are joined that year, and neither is held back; "stir": one seat only, which may
  // as well be a new person coming in (the chart cannot tell which), so it is never called a window back.
  kind: "together" | "stir";
  why: string;
  // The current year has only its months up to 입춘 left.
  monthsLeft: number | null;
};
export type Reunion = {
  ties: string[];
  splits: string[];
  tieWeight: number;
  splitWeight: number;
  verdict: "끈이 남아 있는 인연" | "당기는 힘과 미는 힘이 비슷한 인연" | "끈이 약한 인연" | "사주보다 상황이 갈라놓은 인연";
  windows: ReunionWindow[];
  from: number;
  to: number;
};

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
// 子午卯酉: a 반합 with one of these in it is a real half of the three-way combination.
const WANGJI = (b: number) => b % 3 === 0;
const halfCombine = (a: number, b: number) => a !== b && a % 4 === b % 4 && (WANGJI(a) || WANGJI(b));
// A seat that a year joins: 육합, or a 반합 with its 왕지. A 육합 that is also a 형·파 is not a clean join.
const joins = (m: Meeting[], a: number, b: number) => (m.includes("육합") && !m.includes("형") && !m.includes("파")) || (m.includes("삼합") && halfCombine(a, b));
const strained = (m: Meeting[]) => m.some((x) => x === "충" || x === "형" || x === "파" || x === "원진");

// The verdict from the weights: threads outweigh causes by HOLDS (or by one less when the threads are heavy, two
// strong ones or more), set so that about four pairs in ten read "끈이 남아 있는" among random births
// (scripts/reunionSpread.mts).
const HOLDS = 3;

// v3: the year verdicts with the 용신 floor (lib/yeonun.ts yearScore); false for a report bought before it.
export function reunionOf(a: Person, b: Person, from = sajuYear(), now = new Date(), v3 = true): Reunion | null {
  const c = coupleOf(a, b);
  if (!c) return null;
  const ties: Weighted[] = [];
  const splits: Weighted[] = [];
  const [da, db] = [a.pillars.dayBranch, b.pillars.dayBranch];
  if (stemCombine(a.pillars.dayStem, b.pillars.dayStem)) ties.push({ w: 3, line: "두 사람의 일간이 천간합이에요. 마음의 결이 맞물리는, 서로를 끌어당기는 사이예요." });
  const seat = meetings(da, db);
  if (seat.includes("육합")) {
    const rough = seat.includes("형") || seat.includes("파");
    ties.push(
      rough
        ? { w: 1, line: `배우자 자리(일지)끼리 육합이면서 ${seat.filter((m) => m === "형" || m === "파").join("·")}이에요. 끌리면서도 자꾸 어긋나는 사이였을 거예요.` }
        : { w: 3, line: "배우자 자리(일지)끼리 육합이에요. 함께 있을 때의 편안함이 오래 남는 사이예요." },
    );
  } else if (seat.includes("삼합") && halfCombine(da, db)) ties.push({ w: 2, line: "배우자 자리(일지)끼리 반합이에요. 같은 곳을 바라보던 기억이 끈으로 남아 있어요." });
  // 용신 is read differently by some schools (myeongri-study 4장 ⚖️), so it is said as one way of seeing it.
  if (c.yongGive[0] >= 0.25) ties.push({ w: 2, line: `${a.name}님 사주에 필요하다고 보는 기운(용신)을 ${b.name}님이 넉넉히 갖고 있어요. 그래서 그 사람의 빈자리가 유난히 크게 느껴질 수 있어요.` });
  if (c.yongGive[1] >= 0.25) ties.push({ w: 2, line: `${b.name}님 사주에 필요하다고 보는 기운(용신)을 ${a.name}님이 넉넉히 갖고 있어요. 서로 채워 주던 몫이 커서 빈자리가 크게 느껴질 수 있는 사이예요.` });
  for (const l of c.lends.slice(0, 1)) ties.push({ w: 1, line: `${l.to}님에게 모자란 ${EL(l.el)} 기운을 ${l.from}님이 ${l.pct}% 갖고 있어요. 곁에 없으면 허전함이 남기 쉬운 사이예요.` });
  if (seat.includes("충")) splits.push({ w: 3, line: "배우자 자리(일지)끼리 충이에요. 끌림만큼 부딪힘도 커서, 같은 문제로 다시 멀어지기 쉬워요." });
  if (seat.includes("원진")) splits.push({ w: 3, line: "배우자 자리(일지)끼리 원진이에요. 말하지 않은 서운함이 쌓여 멀어진 사이일 가능성이 커요." });
  if (seat.includes("형")) splits.push({ w: 2, line: "배우자 자리(일지)끼리 형이에요. 가까울수록 날이 서는 순간이 있었을 거예요." });
  if (seat.includes("해") || seat.includes("파")) splits.push({ w: 1, line: "배우자 자리(일지)끼리 어긋나는 관계(해·파)예요. 작은 오해와 엇갈린 약속이 쌓이기 쉬웠어요." });
  if (c.sharedLack.length) splits.push({ w: 1, line: `둘 다 ${c.sharedLack.map(EL).join("·")} 기운이 부족해요. 서로 채워 주지 못한 빈틈이 있었어요.` });
  const T = ties.reduce((s, x) => s + x.w, 0);
  const S = splits.reduce((s, x) => s + x.w, 0);
  const verdict: Reunion["verdict"] =
    !T && !S ? "사주보다 상황이 갈라놓은 인연" : T - S >= HOLDS || (T - S >= HOLDS - 1 && T >= 5) ? "끈이 남아 있는 인연" : T - S > -HOLDS && T > 0 ? "당기는 힘과 미는 힘이 비슷한 인연" : "끈이 약한 인연";

  // This year and the four after. A year is a window back only when it joins both spouse seats and holds back
  // neither person: no 충·형·파·원진 on either seat, neither one's own year read as 인내, and for each, not a year
  // whose stem clashes their day stem or whose stem and branch are both their 기신 (2026-10-23 진단, B2). A year that joins one
  // seat only is kept apart as "마음이 움직이는 해".
  const to = from + 4;
  const ra = readChart(a.pillars);
  const rb = readChart(b.pillars);
  const rowsA = yearRows(a.pillars, profileOf(a), from, to, from, v3);
  const rowsB = yearRows(b.pillars, profileOf(b), from, to, from, v3);
  const verdictOf = (rows: typeof rowsA, y: number): Verdict | null => rows?.find((r) => r.year === y)?.verdict ?? null;
  const windows: ReunionWindow[] = [];
  for (let y = from; y <= to; y++) {
    const ys = (((y - 4) % 10) + 10) % 10;
    const yb = (((y - 4) % 12) + 12) % 12;
    const gz = `${STEMS[ys]}${BRANCHES[yb]}`;
    const side = (x: Person, r: ReturnType<typeof readChart>, rows: typeof rowsA) => {
      const m = meetings(yb, x.pillars.dayBranch);
      // A 기신 year: its stem and branch both the 기신 element (one of them alone is a mixed year, left to the verdict).
      const heavy = r && stemEl(ys) === r.gi && BRANCH_EL[yb] === r.gi;
      return {
        join: joins(m, yb, x.pillars.dayBranch),
        strained: strained(m),
        held: verdictOf(rows, y) === "인내" || stemClash(ys, x.pillars.dayStem) || Boolean(heavy),
      };
    };
    const sa = side(a, ra, rowsA);
    const sb = side(b, rb, rowsB);
    if (sa.strained || sb.strained) continue;
    // A year already gone by `now` (a report reopened later) is no longer a time to come.
    if (y < sajuYear(now)) continue;
    const monthsLeft = y === sajuYear(now) ? monthsToIpchun(now) : null;
    if (sa.join && sb.join && !sa.held && !sb.held) windows.push({ year: y, gz, kind: "together", why: "두 사람의 배우자 자리에 함께 합이 드는 해", monthsLeft });
    else if (sa.join !== sb.join) {
      const who = sa.join ? a : b;
      windows.push({ year: y, gz, kind: "stir", why: `${who.name}님의 배우자 자리에만 합이 드는 해(마음이 움직이는 해. 그 사람일지 새 인연일지는 사주로 가를 수 없음)`, monthsLeft });
    }
  }
  return { ties: ties.map((x) => x.line), splits: splits.map((x) => x.line), tieWeight: T, splitWeight: S, verdict, windows, from, to };
}

// Whole months left before the next 입춘 (about 4 February), at least one.
function monthsToIpchun(now: Date): number {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const y = kst.getUTCMonth() + 1 >= 2 && !(kst.getUTCMonth() === 1 && kst.getUTCDate() < 4) ? kst.getUTCFullYear() + 1 : kst.getUTCFullYear();
  const ipchun = Date.UTC(y, 1, 4) - 9 * 3600000;
  return Math.max(1, Math.round((ipchun - now.getTime()) / (30.44 * 86400000)));
}

const windowLine = (w: ReunionWindow) => `${w.year} ${w.gz}(${w.why}${w.monthsLeft ? `, 올해는 입춘 전까지 약 ${w.monthsLeft}달 남음` : ""})`;

// `from`: the year the brief is read for, and `at` the moment (the order's, so a report reopened after 입춘 keeps
// its years and its "months left").
export function reunionBrief(a: Person, b: Person, from = sajuYear(), at = Date.now(), v3 = true): string {
  const r = reunionOf(a, b, from, new Date(at), v3);
  if (!r) return "";
  const together = r.windows.filter((w) => w.kind === "together");
  const stir = r.windows.filter((w) => w.kind === "stir");
  return [
    `■ ★ 재회 근거 (이 보고서의 뼈대. 엔진 판정: ${r.verdict}, 끈의 무게 ${r.tieWeight} · 멀어지게 한 것의 무게 ${r.splitWeight})`,
    `- 남아 있는 끈: ${r.ties.length ? r.ties.join(" ") : "뚜렷한 끈 없음"}`,
    `- 멀어지게 한 것: ${r.splits.length ? r.splits.join(" ") : "뚜렷한 구조 없음(사주보다 상황이 멀어지게 했을 가능성)"}`,
    `- 다시 닿기 좋은 해(${r.from}~${r.to}, 두 사람 배우자 자리에 함께 합이 들고 둘 다 버거운 해가 아닌 해만): ${together.length ? together.map(windowLine).join(", ") : "뚜렷한 해 없음"}`,
    `- 마음이 움직이는 해(한쪽만 합. 재회의 때라고 쓰지 말 것): ${stir.length ? stir.map(windowLine).join(", ") : "없음"}`,
    `- 상대 마음은 "~하기 쉬운 사주예요"까지만 쓴다. 상대가 아직 사랑한다, 반드시 돌아온다, 기다리면 온다고 쓰지 않는다.`,
  ].join("\n");
}
