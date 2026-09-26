import { Lunar, Solar } from "lunar-javascript";
import { josa } from "./josa";
import { ELEMENT_HANJA, ELEMENT_KO, elementCount, readChart } from "./myeongri";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const STEMS_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const BRANCHES_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
export const ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"] as const;
export const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
export const ELEMENTS_KO = ["목", "화", "토", "금", "수"] as const;

export const HOUR_SLOTS = [
  "자시 (23:30~01:29)",
  "축시 (01:30~03:29)",
  "인시 (03:30~05:29)",
  "묘시 (05:30~07:29)",
  "진시 (07:30~09:29)",
  "사시 (09:30~11:29)",
  "오시 (11:30~13:29)",
  "미시 (13:30~15:29)",
  "신시 (15:30~17:29)",
  "유시 (17:30~19:29)",
  "술시 (19:30~21:29)",
  "해시 (21:30~23:29)",
] as const;

// The four fields every stored chart has. Charts made after the full-chart update also carry the year
// stem and the month pillar; older ones only have these four, so the extra fields are optional.
export type Pillars = {
  dayStem: number;
  dayBranch: number;
  yearBranch: number;
  hourBranch: number | null;
  yearStem?: number;
  monthStem?: number;
  monthBranch?: number;
};

export type FullPillars = Required<Omit<Pillars, "hourBranch">> & { hourBranch: number | null };
export const isFull = (p: Pillars): p is FullPillars => p.monthBranch !== undefined && p.monthStem !== undefined && p.yearStem !== undefined;

// Hour stem follows from the day stem (甲己 days start the day at 甲子, 乙庚 at 丙子, ...).
export const hourStemOf = (dayStem: number, hourBranch: number) => ((dayStem % 5) * 2 + hourBranch) % 10;

export type BirthInput = {
  year: number;
  month: number;
  day: number;
  calendar: "solar" | "lunar" | "lunar-leap";
  hourBranch: number | null;
};

export class BirthInputError extends Error {}

export function computePillars(input: BirthInput): Pillars {
  const { year, month, day, calendar, hourBranch } = input;
  if (year < 1920 || year > 2025) throw new BirthInputError("1920년부터 2025년 사이로 입력해 주시옵소서.");

  let solar;
  try {
    // Day pillar is taken at noon; the hour slot only feeds the hour branch.
    solar =
      calendar === "solar"
        ? Solar.fromYmdHms(year, month, day, 12, 0, 0)
        : Lunar.fromYmdHms(year, calendar === "lunar-leap" ? -month : month, day, 12, 0, 0).getSolar();
  } catch {
    throw new BirthInputError(
      calendar === "lunar-leap" ? "그 해에는 해당 윤달이 없사옵니다." : "존재하지 않는 날짜이옵니다.",
    );
  }
  // lunar-javascript keeps impossible solar dates like 2/31 as-is, so check them against the real calendar.
  if (calendar === "solar") {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) throw new BirthInputError("존재하지 않는 날짜이옵니다.");
  }

  const ec = solar.getLunar().getEightChar();
  // Year and month change at solar terms, which can fall on the birthday itself, so when the hour is known
  // they are read at the middle of that hour slot instead of at noon.
  const exact =
    hourBranch === null
      ? ec
      : Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hourBranch * 2, 30, 0).getLunar().getEightChar();
  const stem = (s: string) => STEMS.indexOf(s as (typeof STEMS)[number]);
  const branch = (b: string) => BRANCHES.indexOf(b as (typeof BRANCHES)[number]);
  return {
    dayStem: stem(ec.getDayGan()),
    dayBranch: branch(ec.getDayZhi()),
    yearBranch: branch(exact.getYearZhi()),
    hourBranch,
    yearStem: stem(exact.getYearGan()),
    monthStem: stem(exact.getMonthGan()),
    monthBranch: branch(exact.getMonthZhi()),
  };
}

const elementOf = (stem: number) => Math.floor(stem / 2);
const isYang = (stem: number) => stem % 2 === 0;

export function dayMasterLabel(p: Pillars) {
  const el = elementOf(p.dayStem);
  return `${STEMS[p.dayStem]}${ELEMENTS[el]} (${STEMS_KO[p.dayStem]}${ELEMENTS_KO[el]})`;
}

export type RelationGroup = "인성" | "비겁" | "재성" | "식상" | "관성";

function relationGroup(king: number, minister: number): RelationGroup {
  const k = elementOf(king);
  const m = elementOf(minister);
  if (k === m) return "비겁";
  if ((m + 1) % 5 === k) return "인성";
  if ((k + 1) % 5 === m) return "식상";
  if ((k + 2) % 5 === m) return "재성";
  return "관성";
}

const isStemCombine = (a: number, b: number) => Math.abs(a - b) === 5;
const isSixCombine = (a: number, b: number) => (a + b) % 12 === 1;
const isThreeCombine = (a: number, b: number) => a !== b && a % 4 === b % 4;
const isClash = (a: number, b: number) => Math.abs(a - b) === 6;
const WONJIN = new Set(["0-7", "1-6", "2-9", "3-8", "4-11", "5-10"]);
const isWonjin = (a: number, b: number) => WONJIN.has(`${Math.min(a, b)}-${Math.max(a, b)}`);

function jitter(k: Pillars, m: Pillars) {
  const s = `${k.dayStem}${k.dayBranch}${k.yearBranch}${k.hourBranch}|${m.dayStem}${m.dayBranch}${m.yearBranch}${m.hourBranch}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 9) - 4;
}

export type RoleKey =
  | "yeong"
  | "jwa"
  | "daejehak"
  | "byeongjo"
  | "hojo"
  | "yejo"
  | "daesaheon"
  | "gansin"
  | "yubae";

export type Facts = {
  group: RelationGroup;
  sameYinYang: boolean;
  stemCombine: boolean;
  daySix: boolean;
  dayThree: boolean;
  dayClash: boolean;
  dayWonjin: boolean;
  yearSix: boolean;
  yearThree: boolean;
  yearClash: boolean;
  hourSix: boolean;
  hourClash: boolean;
  // Full-chart kings only: how much of the king's 용신 (and 기신) element the minister carries.
  yong: { el: number; count: number; giCount: number } | null;
};

export type Match = { score: number; role: RoleKey; facts: Facts };

export function matchPillars(king: Pillars, minister: Pillars): Match {
  const hoursKnown = king.hourBranch !== null && minister.hourBranch !== null;
  const facts: Facts = {
    group: relationGroup(king.dayStem, minister.dayStem),
    sameYinYang: isYang(king.dayStem) === isYang(minister.dayStem),
    stemCombine: isStemCombine(king.dayStem, minister.dayStem),
    daySix: isSixCombine(king.dayBranch, minister.dayBranch),
    dayThree: isThreeCombine(king.dayBranch, minister.dayBranch),
    dayClash: isClash(king.dayBranch, minister.dayBranch),
    dayWonjin: isWonjin(king.dayBranch, minister.dayBranch),
    yearSix: isSixCombine(king.yearBranch, minister.yearBranch),
    yearThree: isThreeCombine(king.yearBranch, minister.yearBranch),
    yearClash: isClash(king.yearBranch, minister.yearBranch),
    hourSix: hoursKnown && isSixCombine(king.hourBranch!, minister.hourBranch!),
    hourClash: hoursKnown && isClash(king.hourBranch!, minister.hourBranch!),
    yong: null,
  };
  const chart = readChart(king);
  if (chart) facts.yong = { el: chart.yong, count: elementCount(minister, chart.yong), giCount: elementCount(minister, chart.gi) };

  const base: Record<RelationGroup, number> = { 인성: 76, 비겁: 70, 재성: 66, 식상: 64, 관성: 56 };
  let score = base[facts.group] + jitter(king, minister);
  if (facts.stemCombine) score += 16;
  if (facts.daySix) score += 12;
  if (facts.dayThree) score += 6;
  if (facts.dayClash) score -= 18;
  if (facts.dayWonjin) score -= 10;
  if (facts.yearSix) score += 5;
  if (facts.yearThree) score += 4;
  if (facts.yearClash) score -= 6;
  if (facts.hourSix) score += 4;
  if (facts.hourClash) score -= 4;
  // Someone who brings the element the king lacks is worth keeping close; one heavy in its enemy is not.
  // Centred so the average score (and so the spread of posts) stays where it was for 4-character charts.
  if (facts.yong) score += Math.min(3, facts.yong.count) * 4 - Math.max(0, facts.yong.giCount - 1) * 2 - 4;
  score = Math.max(12, Math.min(99, score));

  return { score, role: assignRole(score, facts), facts };
}

function assignRole(score: number, f: Facts): RoleKey {
  const harmony = f.stemCombine || f.daySix;
  if (f.group === "관성" && !harmony) return "gansin";
  if (f.group === "비겁" && !f.sameYinYang && f.dayClash) return "gansin";
  if ((f.dayClash || f.dayWonjin) && score < 55) return "yubae";
  if (score >= 80) return "jwa";
  const byGroup: Record<RelationGroup, RoleKey> = {
    인성: "daejehak",
    비겁: "byeongjo",
    재성: "hojo",
    식상: "yejo",
    관성: "daesaheon",
  };
  return byGroup[f.group];
}

export function relationSentence(king: Pillars, minister: Pillars, f: Facts, ministerName: string) {
  const m = `${ministerName}의 일간 ${dayMasterLabel(minister)}`;
  const k = `전하의 일간 ${dayMasterLabel(king)}`;
  switch (f.group) {
    case "인성":
      return `${josa(m, "이/가")} ${josa(k, "을/를")} 생(生)하옵니다. 전하를 키워주는 인성(印星)의 관계이옵니다.`;
    case "비겁":
      return `${josa(m, "과/와")} ${josa(k, "이/가")} 같은 기운이옵니다. 어깨를 나란히 하는 ${f.sameYinYang ? "비견(比肩)" : "겁재(劫財)"}의 관계이옵니다.`;
    case "재성":
      return `${josa(k, "이/가")} ${josa(m, "을/를")} 다스리옵니다. 함께 재물을 일구는 재성(財星)의 관계이옵니다.`;
    case "식상":
      return `${josa(k, "이/가")} ${josa(m, "을/를")} 생(生)하옵니다. 전하의 재주가 흘러가는 식상(食傷)의 관계이옵니다.`;
    case "관성":
      return `${josa(m, "이/가")} ${josa(k, "을/를")} 누르옵니다. 전하를 긴장시키는 관성(官星)의 관계이옵니다.`;
  }
}

export function factLines(king: Pillars, minister: Pillars, f: Facts): string[] {
  const lines: string[] = [];
  if (f.stemCombine)
    lines.push(`천간합(${STEMS[king.dayStem]}${STEMS[minister.dayStem]}合): 하늘이 맺어준 인연이라 끌림이 강하옵니다.`);
  if (f.daySix) lines.push("일지 육합: 생활 리듬과 속마음이 잘 맞사옵니다.");
  if (f.dayThree) lines.push("일지 반합: 같은 곳을 바라보는 사이이옵니다.");
  if (f.dayClash) lines.push("일지 충(沖): 생활 방식이 정반대라 부딪치기 쉽사옵니다.");
  if (f.dayWonjin) lines.push("원진(怨嗔): 이유 없이 서운한 마음이 쌓이기 쉽사옵니다.");
  const animals = `${ANIMALS[king.yearBranch]}띠와 ${ANIMALS[minister.yearBranch]}띠`;
  if (f.yearSix || f.yearThree) lines.push(`${animals}: 띠끼리는 합이라 겉으로는 사이가 좋아 보이옵니다.`);
  if (f.yearClash) lines.push(`${animals}: 띠끼리 충이라 첫인상이 엇갈렸을 수 있사옵니다.`);
  if (f.hourSix) lines.push("시지 육합: 늦은 밤 대화가 유난히 잘 통하옵니다.");
  if (f.hourClash) lines.push("시지 충: 하루 중 컨디션 좋은 시간이 엇갈리옵니다.");
  if (f.yong && f.yong.count >= 2)
    lines.push(`용신(用神): 전하께 모자란 ${ELEMENT_KO[f.yong.el]}(${ELEMENT_HANJA[f.yong.el]}) 기운을 ${f.yong.count}개나 지녀, 곁에 두면 전하의 사주가 채워지옵니다.`);
  else if (f.yong && f.yong.giCount >= 3)
    lines.push(`기신(忌神): 전하의 용신을 누르는 ${ELEMENT_KO[(f.yong.el + 3) % 5]} 기운이 많아, 가까이하면 전하의 기운이 꺾이옵니다.`);
  return lines;
}
