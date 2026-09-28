import { Solar } from "lunar-javascript";
import { isBaekho, isGoegang, salsAt, type Sal } from "./deep";
import { luckFit, readChart } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO, type FullPillars } from "./saju";

// "오늘 태어난 인물의 사주": famous people whose birthday is well recorded and whose chart has something to say
// about their life. The chart and the decades are computed here with the site's engine; only the life facts
// (and how they pair with the chart) are written by hand, with a source.
export type Figure = {
  id: string;
  name: string;
  born: { y: number; m: number; d: number; hour?: number }; // solar date (Gregorian); hour 0–23 when recorded
  male: boolean;
  died?: number; // the decades shown stop at the one they died in
  line: string; // 1901 · 이탈리아 · 물리학자
  hook: string; // the cover's one line
  pairs: { sign: string; life: string }[]; // what the chart shows → what the life did
  events: { year: number; text: string }[];
  source: string;
};

export const FIGURES: Figure[] = [
  {
    id: "fermi",
    name: "엔리코 페르미",
    born: { y: 1901, m: 9, d: 29 },
    male: true,
    died: 1954,
    line: "1901 · 이탈리아 로마 · 물리학자",
    hook: "용광로를 품고 태어난 무쇠, 원자의 불을 켜다",
    pairs: [
      { sign: "일간 경금(庚金), 단단한 무쇠", life: "끝까지 파고들어 답을 내는 실험의 천재" },
      { sign: "태어난 달에 丁火, 쇠를 녹이는 용광로", life: "평생 원자를 쪼개는 '불'을 다룬 사람" },
      { sign: "일주 庚戌, 판이 큰 괴강", life: "인류 최초의 원자로를 세운 가장 큰 판" },
      { sign: "용신(가장 필요한 기운) 화(火), 불", life: "핵에너지, 인류에게 새 불을 건넨 사람" },
    ],
    events: [
      { year: 1934, text: "느린 중성자 발견 (노벨상 업적)" },
      { year: 1938, text: "노벨 물리학상 · 미국으로 망명" },
      { year: 1942, text: "인류 최초 원자로 가동" },
    ],
    source: "NobelPrize.org · Britannica",
  },
];

export const figureById = (id: unknown) => FIGURES.find((f) => f.id === id) ?? null;

const WEEK = "일월화수목금토";
export function figureChart(f: Figure) {
  const { y, m, d, hour } = f.born;
  const solar = Solar.fromYmdHms(y, m, d, hour ?? 12, 0, 0);
  const e = solar.getLunar().getEightChar();
  const si = (g: string) => STEMS.indexOf(g as (typeof STEMS)[number]);
  const bi = (z: string) => BRANCHES.indexOf(z as (typeof BRANCHES)[number]);
  const p: FullPillars = {
    yearStem: si(e.getYearGan()),
    yearBranch: bi(e.getYearZhi()),
    monthStem: si(e.getMonthGan()),
    monthBranch: bi(e.getMonthZhi()),
    dayStem: si(e.getDayGan()),
    dayBranch: bi(e.getDayZhi()),
    hourStem: hour !== undefined ? si(e.getTimeGan()) : 0,
    hourBranch: hour !== undefined ? bi(e.getTimeZhi()) : null,
  };
  const r = readChart(p);
  const pillar = (s: number, b: number) => ({ hanja: `${STEMS[s]}${BRANCHES[b]}`, ko: `${STEMS_KO[s]}${BRANCHES_KO[b]}` });
  const decades = e
    .getYun(f.male ? 1 : 0)
    .getDaYun()
    .slice(1, 9)
    .map((dy) => {
      const gz = dy.getGanZhi();
      const fit = r ? luckFit(r, p.dayStem, si(gz[0]), bi(gz[1])) : 0;
      return {
        gz,
        from: dy.getStartYear(),
        to: dy.getEndYear(),
        ages: `${dy.getStartAge()}~${dy.getEndAge()}세`,
        mark: fit >= 3 ? "◎" : fit <= -3 ? "△" : "○",
        events: f.events.filter((ev) => ev.year >= dy.getStartYear() && ev.year <= dy.getEndYear()),
      };
    });
  const branches = [p.yearBranch, p.monthBranch, p.dayBranch, ...(p.hourBranch !== null ? [p.hourBranch] : [])];
  return {
    year: pillar(p.yearStem, p.yearBranch),
    month: pillar(p.monthStem, p.monthBranch),
    day: pillar(p.dayStem, p.dayBranch),
    hour: p.hourBranch !== null ? pillar(p.hourStem, p.hourBranch) : null,
    reading: r,
    decades,
    sals: [...[...new Set(branches.flatMap((b) => salsAt(p, b)))].filter((s: Sal) => s !== "공망"), ...(isGoegang(p) ? ["괴강"] : []), ...(isBaekho(p) ? ["백호"] : [])] as string[],
    weekday: WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
  };
}
