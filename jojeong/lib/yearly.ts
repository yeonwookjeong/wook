import { BRANCH_EL, ELEMENT_KO, GROUP_OF, readChart, stemEl, tenGod, type GodGroup } from "./myeongri";
import type { Pillars } from "./saju";

// 2026 is 丙午. Its months run from 庚寅 (from 입춘, early Feb) to 辛丑 (Jan 2027).
const YEAR = { stem: 2, branch: 6 };
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ stem: (6 + i) % 10, branch: (2 + i) % 12 }));

const YEAR_TEXT: Record<GodGroup, string> = {
  관성: "나라의 법과 책임이 무거워지는 해이옵니다. 중책을 맡거나 자리가 오를 기회가 오나, 그만큼 어깨가 무겁사옵니다.",
  재성: "곳간이 들썩이는 해이옵니다. 들어오는 돈도 나가는 돈도 커지니, 장부를 꼼꼼히 보셔야 하옵니다.",
  식상: "전하의 말과 재주가 밖으로 드러나는 해이옵니다. 새 일을 벌이기 좋으나, 말 한마디가 화근이 되기도 하옵니다.",
  인성: "배움과 문서의 해이옵니다. 자격, 계약, 집 문서처럼 종이에 남는 일에 복이 따르옵니다.",
  비겁: "경쟁자가 나타나는 해이옵니다. 벗이 힘이 되기도 하고, 몫을 나눠 가져가기도 하옵니다.",
};

// Free first chapter of the 2026 report: the year's ten god against the day master, and how many months
// favour or trouble the chart (the months themselves stay behind the lock).
export function yearPreview(p: Pillars) {
  const group = GROUP_OF[tenGod(p.dayStem, YEAR.stem)];
  const chart = readChart(p);
  let verdict = "평년";
  let good = 0;
  let bad = 0;
  if (chart) {
    const strong = chart.strength === "신강" || chart.strength === "극신강";
    const helps = strong ? ["식상", "재성", "관성"].includes(group) : ["인성", "비겁"].includes(group);
    verdict = chart.yong === stemEl(YEAR.stem) ? "대길" : chart.gi === stemEl(YEAR.stem) ? "조심" : helps ? "길" : "평년";
    for (const m of MONTHS) {
      const els = [stemEl(m.stem), BRANCH_EL[m.branch]];
      const score = els.filter((e) => e === chart.yong).length - els.filter((e) => e === chart.gi).length;
      if (score > 0) good++;
      else if (score < 0) bad++;
    }
  }
  const lead =
    verdict === "대길"
      ? `병오년의 불(火) 기운이 곧 전하의 용신이니, 몇 해에 한 번 오는 큰 해이옵니다.`
      : verdict === "조심"
        ? `병오년의 불(火) 기운이 전하의 용신인 ${chart ? ELEMENT_KO[chart.yong] : ""} 기운을 누르니, 한 해 내내 발밑을 살피셔야 하옵니다.`
        : verdict === "길"
          ? "병오년의 기운이 전하의 사주를 알맞게 받쳐 주니, 순풍에 돛을 단 해이옵니다."
          : "병오년의 기운이 전하와 크게 부딪치지도 크게 돕지도 않으니, 하기 나름인 해이옵니다.";
  return { verdict, lead, text: YEAR_TEXT[group], good, bad, full: Boolean(chart) };
}
