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

export function factLines(king: Pillars, minister: Pillars, f: Facts, role?: RoleKey): string[] {
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
  const suspect = role === "gansin" || role === "yubae";
  if (f.yong && f.yong.count >= 2)
    lines.push(
      suspect
        ? `용신(用神): 그래도 전하께 모자란 ${ELEMENT_KO[f.yong.el]}(${ELEMENT_HANJA[f.yong.el]}) 기운을 ${f.yong.count}개 지녀 쓸모는 있사오니, 내치기보다 곁에 두고 지켜보시옵소서.`
        : `용신(用神): 전하께 모자란 ${ELEMENT_KO[f.yong.el]}(${ELEMENT_HANJA[f.yong.el]}) 기운을 ${f.yong.count}개나 지녀, 곁에 두면 전하의 사주가 채워지옵니다.`,
    );
  else if (f.yong && f.yong.giCount >= 3)
    lines.push(`기신(忌神): 전하의 용신을 누르는 ${ELEMENT_KO[(f.yong.el + 3) % 5]} 기운이 많아, 가까이하면 전하의 기운이 꺾이옵니다.`);
  return lines;
}

// Why the court seated someone where it did, spelled out for the minister page. 간신 and 유배 get the full
// reasoning because those are the verdicts people argue about.
export function roleReasons(king: Pillars, minister: Pillars, match: Match, role: RoleKey, name: string): string[] {
  const f = match.facts;
  const m = `${name}의 일간 ${dayMasterLabel(minister)}`;
  const k = `전하의 일간 ${dayMasterLabel(king)}`;
  const harmony = f.stemCombine || f.daySix;
  const lines: string[] = [];

  if (role === "gansin") {
    if (f.group === "관성") {
      lines.push(
        `${josa(m, "이/가")} ${josa(k, "을/를")} 극(剋)하옵니다. 관성(官星)은 본디 전하를 다스리려 드는 기운이라, 겉으로는 받드는 척해도 속으로는 전하 위에 서려 하옵니다.`,
        "둘 사이를 이어 줄 천간합도 일지 육합도 없사옵니다. 누르는 기운을 달래 줄 인연의 끈이 없으니, 틈만 나면 제 뜻대로 움직이옵니다.",
      );
    } else {
      lines.push(
        `두 분의 일간이 같은 ${ELEMENT_KO[elementOf(king.dayStem)]} 기운이나 음양이 달라 겁재(劫財)이옵니다. 겁재는 전하의 몫을 나누자 하다가 결국 빼앗으려 드는 기운이옵니다.`,
        "게다가 일지가 충(沖)하니 속마음이 정면으로 부딪치옵니다. 앞에서는 웃고 뒤에서는 딴생각을 품기 쉽사옵니다.",
      );
    }
  } else if (role === "yubae") {
    lines.push(
      f.dayClash
        ? "두 분의 일지가 충(沖)하옵니다. 일지는 속마음과 생활의 자리라, 가까이 두면 사사건건 부딪치옵니다."
        : "두 분의 일지가 원진(怨嗔)이옵니다. 딱히 잘못한 것도 없는데 서로 서운함이 쌓이는 사이이옵니다.",
      `궁합이 ${match.score}점으로 55점에 못 미쳐, 조정에 두기보다 멀리 보내는 편이 서로에게 이롭사옵니다.`,
    );
  } else if (role === "yeong") {
    lines.push(`조정의 신하 가운데 궁합이 가장 높고(${match.score}점), 영의정의 기준인 75점을 넘었사옵니다.`);
  } else if (role === "jwa") {
    lines.push(`궁합이 ${match.score}점으로 80점을 넘었사옵니다. 조정 1등에게 돌아가는 영의정 바로 아래 자리이니, 곁에 두어 의지할 만하옵니다.`);
  } else {
    const why: Record<RelationGroup, string> = {
      인성: "전하를 생(生)하는 인성(印星)이라, 가르치고 키우는 대제학에 천거하였사옵니다.",
      비겁: "전하와 같은 기운인 비겁(比劫)이라, 등을 맡길 병조판서에 천거하였사옵니다.",
      재성: "전하가 다스리는 기운인 재성(財星)이라, 곳간을 맡길 호조판서에 천거하였사옵니다.",
      식상: "전하의 재주가 흘러가는 식상(食傷)이라, 잔치와 예를 맡길 예조판서에 천거하였사옵니다.",
      관성: "전하를 누르는 관성(官星)이나 합(合)이 있어 선을 지키니, 바른말 하는 대사헌에 천거하였사옵니다.",
    };
    lines.push(`${josa(m, "은/는")} ${why[f.group]}`);
  }

  if (f.yong && f.yong.giCount >= 3 && (role === "gansin" || role === "yubae"))
    lines.push(`게다가 전하의 용신을 누르는 ${ELEMENT_KO[(f.yong.el + 3) % 5]} 기운을 ${f.yong.giCount}개나 지녔사옵니다.`);
  if (role === "gansin" && match.score >= 65)
    lines.push(`궁합이 ${match.score}점으로 높은 것이 오히려 수상하옵니다. 그만큼 전하의 마음을 잘 파고든다는 뜻이옵니다.`);
  if (!harmony && role === "gansin" && f.yearSix) lines.push("다만 띠끼리는 합이라 겉으로는 사이가 좋아 보이니, 더욱 알아보기 어렵사옵니다.");
  return lines;
}

// How a 간신 of this court is likely to behave, for the fun of spotting one.
export const GANSIN_SIGNS = [
  "회의 자리에서는 누구보다 크게 맞장구치고, 끝나고 나서 딴소리를 하옵니다.",
  "전하의 결정마다 “그런데…”를 붙이며 슬쩍 제 뜻을 얹사옵니다.",
  "공은 제 것으로, 탓은 남의 것으로 돌리는 솜씨가 뛰어나옵니다.",
];
