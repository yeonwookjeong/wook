import { birthYearOf } from "./brief";
import type { Profile } from "./profile";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO, type Pillars } from "./saju";

// "Was it like this in that year?": the free screen's guess at the reader's own past, from the same marks the
// written reports name (lib/brief.ts pastYears): the year the ten-year flow turned, the years that struck or
// joined the spouse seat (day branch), the year that struck the seat of work and home (month branch). Only with a
// birth year the reader gave (never a guessed one), from age 16 to last year, the latest of each kind, three at most.
export type PastHit = { year: number; ask: string; why: string };

export function pastHits(p: Pillars, profile: Profile | null, lastYear = 2025): PastHit[] {
  const by = birthYearOf(p, profile);
  if (!by?.certain) return [];
  const from = by.year + 16;
  const gz = (y: number) => `${STEMS_KO[(y - 4) % 10]}${BRANCHES_KO[(y - 4) % 12]}(${STEMS[(y - 4) % 10]}${BRANCHES[(y - 4) % 12]})년`;
  const last = (branch: number) => {
    for (let y = lastYear; y >= from; y--) if ((y - 4) % 12 === branch) return y;
    return null;
  };
  const out: PastHit[] = [];
  const turn = (profile?.daeun ?? []).map((d) => d.from).filter((y) => y >= from && y <= lastYear).at(-1);
  if (turn) out.push({ year: turn, ask: "일이나 사는 곳, 곁의 사람이 크게 바뀌지 않았나요?", why: "10년마다 바뀌는 큰 흐름이 이 무렵 넘어갔어요. 삶의 판이 바뀌기 쉬운 때예요." });
  const work = p.monthBranch === undefined ? null : last((p.monthBranch + 6) % 12);
  if (work) out.push({ year: work, ask: "이직이나 이사처럼 일터나 집이 바뀌지 않았나요?", why: `${gz(work)} 기운이 일터와 집의 자리를 정면으로 쳤어요.` });
  const clash = last((p.dayBranch + 6) % 12);
  if (clash) out.push({ year: clash, ask: "가까운 사람과의 관계가 크게 흔들리지 않았나요?", why: `${gz(clash)} 기운이 나 자신과 짝의 자리를 정면으로 쳤어요.` });
  const join = last((13 - p.dayBranch) % 12);
  if (join) out.push({ year: join, ask: "마음 가는 인연이 들어오거나 관계가 깊어지지 않았나요?", why: `${gz(join)} 기운이 짝의 자리와 손을 잡았어요.` });
  // Three at most, newest first, one per year.
  const seen = new Set<number>();
  return out
    .sort((a, b) => b.year - a.year)
    .filter((h) => !seen.has(h.year) && (seen.add(h.year), true))
    .slice(0, 3);
}
