import { STEMS } from "./saju";
import type { Pillars } from "./saju";
import type { Profile } from "./profile";
import { readMe } from "./me";
import { isPreview, newYearOf, thisYear, yearDetail, yearName } from "./yeonun";

// 연운 and 평생 사주 are sold for the chart remembered in this browser (the order carries its birth data, which a
// court never keeps), so the links name no court: they open straight on the chart when the remembered one is this
// person's (saved when they played), and otherwise ask for it (?new=1) rather than show someone else's.
export async function bridgeQuery(pillars: Pillars): Promise<string> {
  const me = await readMe();
  const same =
    me &&
    me.person.pillars.dayStem === pillars.dayStem &&
    me.person.pillars.dayBranch === pillars.dayBranch &&
    me.person.pillars.yearBranch === pillars.yearBranch &&
    me.person.pillars.monthBranch === pillars.monthBranch;
  return same ? "" : "new=1";
}

// The two free pages the game leads to, worded for the chart at hand: the coming year (next year's from September,
// this year's after 입춘) and the free analysis of the whole chart.
export function yearBridge(pillars: Pillars, profile: Profile | null, query: string, who: string) {
  const y = newYearOf() ?? thisYear();
  const verdict = yearDetail(pillars, profile, y, thisYear())?.verdict;
  const n = yearName(y);
  return {
    href: `/reports/yeonun?${query ? `${query}&` : ""}y=${y}`,
    seal: verdict ?? n.hanja,
    kicker: `${n.hanja}年 · ${isPreview(y) ? "미리 보는 신년운세" : "올해 운세"}`,
    title: `${who}의 ${y} ${n.ko} 운세`,
    line: "한 해 판정과 달마다 좋은 달·조심할 달까지 무료로 먼저",
  };
}

export function chartBridge(pillars: Pillars, query: string, kicker: string, title: string) {
  return {
    href: `/reports/pyeongsaeng${query ? `?${query}` : ""}`,
    seal: `${STEMS[pillars.dayStem]}`,
    kicker,
    title,
    line: "여덟 글자의 무게, 다섯 가지 힘, 10년 흐름까지 무료 사주 분석",
  };
}
