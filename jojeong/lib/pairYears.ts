import { SEAT_NAME, seatOf } from "./couple";
import { meetings } from "./deep";
import { profileOf, type Person } from "./pairToken";
import type { Relation } from "./relations";
import type { Rel } from "./rels";
import { BRANCHES, STEMS } from "./saju";
import { yearRows, type Verdict } from "./yeonun";

// Two people's next ten years side by side (궁합 v8): each one's year verdict, as their own 연운 grades it, and what
// the year does to the seat their relation lives in. The table is shown in the report and told to 정 훈도 as is.

export const REL_OF: Record<Relation, Rel> = { lover: "연인", some: "연인", ex: "연인", work: "일", friend: "친구", family: "가족" };

export type PairMark = "함께 좋은 해" | "정이 깊어지는 해" | "한쪽 흔들림" | "함께 조심" | "관계가 흔들리기 쉬운 해" | "무난한 해";
export type PairYear = { year: number; gz: string; me: Verdict; them: Verdict; mark: PairMark; why: string; now: boolean };
// noDaeun: who was read without their ten-year 대운 (gender not given), so their grades are said more lightly.
export type PairYears = { seat: string; rows: PairYear[]; noDaeun: string[] };

const good = (v: Verdict) => v === "대길" || v === "길";
const bad = (v: Verdict) => v === "조심" || v === "인내";

export function pairYears(a: Person, b: Person, relation: Relation, from: number, n = 10): PairYears | null {
  const rel = REL_OF[relation];
  const ya = yearRows(a.pillars, profileOf(a), from, from + n - 1, from);
  const yb = yearRows(b.pillars, profileOf(b), from, from + n - 1, from);
  if (!ya || !yb) return null;
  const sa = seatOf(a.pillars, rel);
  const sb = seatOf(b.pillars, rel);
  const seat = SEAT_NAME[rel];
  const rows = ya.map((ra, i): PairYear => {
    const rb = yb[i];
    const y = ra.year;
    const yBranch = (((y - 4) % 12) + 12) % 12;
    const gz = `${STEMS[(((y - 4) % 10) + 10) % 10]}${BRANCHES[yBranch]}`;
    const clash = [meetings(yBranch, sa).includes("충") && a.name, meetings(yBranch, sb).includes("충") && b.name].filter(Boolean) as string[];
    const joins = (s: number) => meetings(yBranch, s).some((m) => m === "육합" || m === "삼합");
    const tie = joins(sa) && joins(sb);
    const [me, them] = [ra.verdict, rb.verdict];
    const [mark, why]: [PairMark, string] = clash.length
      ? ["관계가 흔들리기 쉬운 해", `${clash.join("·")}의 ${seat}를 그해 기운이 충`]
      : good(me) && good(them)
        ? tie
          ? ["정이 깊어지는 해", `둘 다 좋은 해에 두 사람의 ${seat}와 모두 합`]
          : ["함께 좋은 해", "두 사람 모두 좋은 해"]
        : bad(me) && bad(them)
          ? ["함께 조심", "두 사람 모두 버거운 해"]
          : bad(me) || bad(them)
            ? ["한쪽 흔들림", `${bad(me) ? a.name : b.name}에게 버거운 해`]
            : tie
              ? ["정이 깊어지는 해", `두 사람의 ${seat}와 모두 합`]
              : ["무난한 해", "크게 밀지도 막지도 않는 해"];
    return { year: y, gz, me, them, mark, why, now: i === 0 };
  });
  return { seat, rows, noDaeun: [a, b].filter((p) => p.gender !== "m" && p.gender !== "f").map((p) => p.name) };
}

export function pairYearsBrief(a: Person, b: Person, x: PairYears): string {
  return [
    `■ ★ 두 사람의 10년 (${x.seat} 기준, 화면에 표로 그대로 보인다)`,
    ...x.rows.map((r) => `- ${r.year} ${r.gz}: ${a.name} ${r.me} / ${b.name} ${r.them} → ${r.mark} (${r.why})`),
    ...(x.noDaeun.length ? [`- ${x.noDaeun.join("·")}님은 성별을 몰라 10년 대운 없이 그해 기운만으로 본 판정이다. 이 사람의 해는 단정하지 말고 가볍게 짚는다.`] : []),
  ].join("\n");
}
