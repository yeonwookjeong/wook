import { Solar } from "lunar-javascript";
import { meetings } from "./deep";
import { BRANCH_EL, ELEMENT_KO, readChart, stemEl } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";
import { KINDS, kindOf, SPANS, type Kind } from "./taekilKinds";

export { KINDS, kindOf, SPANS, type Kind };

// 택일: good days for one undertaking in a span of months. The almanac (通書, from lunar-javascript) says what
// each day suits and avoids, its 황도·흑도 spirit, its 건제십이신 and its 28수; the chart(s) then rule out days
// that clash with the person and favour days that bring the element they need. Rule-based, no writer.

const SPIRIT_KO: Record<string, string> = {
  青龙: "청룡",
  明堂: "명당",
  金匮: "금궤",
  天德: "천덕",
  玉堂: "옥당",
  司命: "사명",
  天刑: "천형",
  朱雀: "주작",
  白虎: "백호",
  天牢: "천뢰",
  玄武: "현무",
  勾陈: "구진",
};
const OFFICER_KO: Record<string, string> = { 建: "건", 除: "제", 满: "만", 平: "평", 定: "정", 执: "집", 破: "파", 危: "위", 成: "성", 收: "수", 开: "개", 闭: "폐" };
// 건제십이신 for undertakings: 成·开 the best, 定·除·满 good, 破·闭 to avoid.
const OFFICER_SCORE: Record<string, number> = { 成: 2, 开: 2, 定: 1, 除: 1, 满: 1, 破: -3, 闭: -2 };
const XIU_KO: Record<string, string> = {
  角: "각", 亢: "항", 氐: "저", 房: "방", 心: "심", 尾: "미", 箕: "기", 斗: "두", 牛: "우", 女: "여", 虚: "허", 危: "위", 室: "실", 壁: "벽",
  奎: "규", 娄: "루", 胃: "위", 昴: "묘", 毕: "필", 觜: "자", 参: "삼", 井: "정", 鬼: "귀", 柳: "류", 星: "성", 张: "장", 翼: "익", 轸: "진",
};

export type DayPick = {
  date: string; // YYYY-MM-DD
  label: string; // 10월 3일 (토)
  lunar: string; // 음력 8월 22일
  gz: string; // 甲子일
  fit: boolean; // the almanac allows this undertaking on this day
  score: number;
  grade: 2 | 1 | 0 | -1; // ◎ 길일 · ○ 무난 · △ 애매 · ✕ 피할 날 (or not suited)
  reasons: string[];
  warns: string[];
  hours: string[];
  weekend: boolean;
};

const two = (n: number) => String(n).padStart(2, "0");

// Days from the first of `from` for `months` months, never before tomorrow (KST).
export function pickDays(kind: Kind, people: Person[], from: { y: number; m: number }, months: number, now = new Date()): DayPick[] {
  const k = KINDS[kind];
  const kst = new Date(now.getTime() + 9 * 3600000);
  const tomorrow = Solar.fromYmd(kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate()).next(1);
  const reads = people.map((p) => ({ p, r: readChart(p.pillars) }));
  const out: DayPick[] = [];
  let day = Solar.fromYmd(from.y, from.m, 1);
  const end = Solar.fromYmd(from.y + Math.floor((from.m - 1 + months) / 12), ((from.m - 1 + months) % 12) + 1, 1);
  while (day.isBefore(end)) {
    if (day.isBefore(tomorrow)) {
      day = day.next(1);
      continue;
    }
    const l = day.getLunar();
    const yi = l.getDayYi();
    const ji = l.getDayJi();
    const stem = STEMS.indexOf(l.getDayGan() as (typeof STEMS)[number]);
    const branch = BRANCHES.indexOf(l.getDayZhi() as (typeof BRANCHES)[number]);
    const fit = k.yi.some((x) => yi.includes(x)) && !k.yi.some((x) => ji.includes(x));
    const reasons: string[] = [];
    const warns: string[] = [];
    let score = 0;

    const spirit = SPIRIT_KO[l.getDayTianShen()] ?? l.getDayTianShen();
    if (l.getDayTianShenType() === "黄道") {
      score += 2;
      reasons.push(`황도일(${spirit})`);
    } else {
      score -= 2;
      warns.push(`흑도일(${spirit})`);
    }
    const officer = l.getZhiXing();
    const os = OFFICER_SCORE[officer] ?? 0;
    score += os;
    if (os > 0) reasons.push(`${OFFICER_KO[officer]}일(${officer}日)`);
    if (os < 0) warns.push(`${OFFICER_KO[officer]}일(${officer}日)`);
    const xiu = l.getXiu();
    if (l.getXiuLuck() === "吉") {
      score += 1;
      reasons.push(`${XIU_KO[xiu] ?? xiu}수(${xiu}宿)`);
    } else score -= 1;
    if (kind === "move" && [9, 0].includes(l.getDay() % 10)) {
      score += 2;
      reasons.push("손 없는 날");
    }

    for (const { p, r } of reads) {
      const who = people.length > 1 ? `${p.name}님 ` : "";
      const toSeat = meetings(branch, p.pillars.dayBranch);
      if (toSeat.includes("충")) {
        score -= 3;
        warns.push(`${who}배우자 자리(일지)와 충`);
      } else if (toSeat.includes("육합")) {
        score += 1;
        reasons.push(`${who}일지와 육합`);
      }
      if (meetings(branch, p.pillars.yearBranch).includes("충")) {
        score -= 2;
        warns.push(`${who}띠와 충`);
      }
      if (r && (stemEl(stem) === r.yong || BRANCH_EL[branch] === r.yong)) {
        score += 1;
        reasons.push(`${who}필요한 ${ELEMENT_KO[r.yong]} 기운`);
      }
    }

    // 황도 hours in the daytime that do not clash with anyone's 일지.
    const hours = l
      .getTimes()
      .filter((t) => {
        const h = Number(t.getMinHm().slice(0, 2));
        const b = BRANCHES.indexOf(t.getZhi() as (typeof BRANCHES)[number]);
        return t.getTianShenType() === "黄道" && h >= 7 && h <= 19 && !people.some((p) => meetings(b, p.pillars.dayBranch).includes("충"));
      })
      .map((t) => `${t.getMinHm()}~${Number(t.getMaxHm().slice(0, 2)) + 1}:00`.replace(/^0/, ""));

    const clashes = warns.some((w) => w.includes("충"));
    const grade: DayPick["grade"] = !fit || (kind === "wedding" && clashes) ? -1 : score >= 4 ? 2 : score >= 1 ? 1 : score >= -1 ? 0 : -1;
    const week = day.getWeek();
    out.push({
      date: `${day.getYear()}-${two(day.getMonth())}-${two(day.getDay())}`,
      label: `${day.getMonth()}월 ${day.getDay()}일 (${"일월화수목금토"[week]})`,
      lunar: `음력 ${l.getMonth() < 0 ? "윤" : ""}${Math.abs(l.getMonth())}월 ${l.getDay()}일`,
      gz: `${STEMS[stem]}${BRANCHES[branch]}일`,
      fit,
      score,
      grade,
      reasons,
      warns,
      hours,
      weekend: week === 0 || week === 6,
    });
    day = day.next(1);
  }
  return out;
}

// The best few days: good ones first by score; a wedding prefers weekends when scores tie.
export function bestDays(days: DayPick[], kind: Kind, n = 3): DayPick[] {
  return days
    .filter((d) => d.grade >= 1)
    .sort((a, b) => b.score - a.score || (kind === "wedding" ? Number(b.weekend) - Number(a.weekend) : 0) || a.date.localeCompare(b.date))
    .slice(0, n);
}

// The months a search may start from: this month and the next eleven.
export function startMonths(now = new Date()): { value: string; label: string }[] {
  const kst = new Date(now.getTime() + 9 * 3600000);
  return Array.from({ length: 12 }, (_, i) => {
    const t = kst.getUTCFullYear() * 12 + kst.getUTCMonth() + i;
    const y = Math.floor(t / 12);
    const m = (t % 12) + 1;
    return { value: `${y}-${two(m)}`, label: `${y}년 ${m}월` };
  });
}

// Validates the search carried in the link (?kind&from&n). A new search must start within the next twelve
// months; a bought one (`strict` off) opens whatever month it was bought for.
export function parseSearch(kind: unknown, from: unknown, n: unknown, strict = true, now = new Date()): { kind: Kind; from: { y: number; m: number }; n: number; label: string } | null {
  const k = kindOf(kind);
  const months = Number(n);
  const match = typeof from === "string" ? /^(\d{4})-(\d{2})$/.exec(from) : null;
  if (!k || !match || !(SPANS as readonly number[]).includes(months)) return null;
  if (strict && !startMonths(now).some((x) => x.value === from)) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  const start = `${y}년 ${m}월`;
  return { kind: k, from: { y, m }, n: months, label: months === 1 ? start : `${start}부터 ${months}개월` };
}
