import { Solar } from "lunar-javascript";
import { meetings, salsAt } from "./deep";
import { BRANCH_EL, ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, readChart, stemEl, tenGod } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "./saju";
import { KINDS, kindOf, OFFERED, SPANS, type Kind } from "./taekilKinds";

export { KINDS, kindOf, OFFERED, SPANS, type Kind };

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
// The almanac library writes the officers in simplified characters; the page shows the traditional ones.
const OFFICER_HANJA: Record<string, string> = { 满: "滿", 执: "執", 开: "開", 闭: "閉" };
// 건제십이신 for undertakings: 成·开 the best, 定·除·满 good, 破·闭 to avoid.
const OFFICER_SCORE: Record<string, number> = { 成: 2, 开: 2, 定: 1, 除: 1, 满: 1, 破: -3, 闭: -2 };

// What each sign means, in plain words, for the reader who has never opened a 책력.
const SPIRIT_WHY: Record<string, string> = {
  청룡: "청룡(靑龍)이 지키는 황도일이에요. 무슨 일이든 막힘없이 시작된다고 봐서, 황도일 가운데서도 첫손에 꼽는 날이에요.",
  명당: "명당(明堂)이 드는 황도일이에요. 귀한 사람이 돕고 일이 밝게 드러난다고 보는 날이에요.",
  금궤: "금궤(金匱), 곧 재물 창고를 지키는 신이 드는 황도일이에요. 살림을 차리고 재물을 들이는 일에 특히 좋다고 봐요.",
  천덕: "천덕(天德)이 드는 황도일이에요. 하늘의 덕이 궂은 기운을 막아 준다고 보는 날이에요.",
  옥당: "옥당(玉堂)이 드는 황도일이에요. 집과 문서, 이름을 얻는 일에 좋은 날로 쳐요.",
  사명: "사명(司命)이 드는 황도일이에요. 일이 뜻대로 풀린다고 보고, 특히 낮 시간이 좋아요.",
  천형: "형벌의 신 천형(天刑)이 드는 흑도일이에요. 다툼이나 법적인 일이 생기기 쉽다고 봐요.",
  주작: "주작(朱雀)이 드는 흑도일이에요. 말실수와 구설을 조심하라는 날이에요.",
  백호: "백호(白虎)가 드는 흑도일이에요. 다치거나 부딪히는 일을 조심하라는 날이에요.",
  천뢰: "천뢰(天牢)가 드는 흑도일이에요. 일이 묶이고 더뎌지기 쉽다고 봐요.",
  현무: "현무(玄武)가 드는 흑도일이에요. 잃어버리거나 속는 일을 조심하라는 날이에요.",
  구진: "구진(勾陳)이 드는 흑도일이에요. 일이 얽히고 늦어지기 쉽다고 봐요.",
};
const OFFICER_WHY: Record<string, string> = {
  成: "성일(成日)은 건제십이신에서 '일이 이루어지는 날'이에요. 결혼·개업·계약처럼 무언가를 맺는 일에 가장 좋은 날로 쳐요.",
  开: "개일(開日)은 '문이 열리는 날'이에요. 새 출발, 가게 문 열기, 새 집 들어가기에 좋은 날로 쳐요.",
  定: "정일(定日)은 '자리가 정해지는 날'이에요. 오래 갈 약속, 계약, 입주처럼 자리를 잡는 일에 좋아요.",
  除: "제일(除日)은 '묵은 것을 덜어 내는 날'이에요. 옛것을 정리하고 새로 시작하는 일과 잘 맞아요.",
  满: "만일(滿日)은 '가득 차는 날'이에요. 재물과 복이 들어차기를 바라는 일에 좋다고 봐요.",
  破: "파일(破日)은 '깨지는 날'이에요. 무언가를 새로 맺는 일은 피하라고 해요.",
  闭: "폐일(閉日)은 '닫히는 날'이에요. 새로 여는 일에는 맞지 않다고 봐요.",
};
// 손(損): by the last digit of the lunar day, where it goes. 9 and 0 are the days it is nowhere.
const SON = [null, "동쪽", "동쪽", "남쪽", "남쪽", "서쪽", "서쪽", "북쪽", "북쪽", null];

// Directions a move should avoid for the whole year (by the year's branch from 입춘): 대장군방 and 삼살방.
const DAEJANGGUN: Record<string, string> = { 亥: "서쪽", 子: "서쪽", 丑: "서쪽", 寅: "북쪽", 卯: "북쪽", 辰: "북쪽", 巳: "동쪽", 午: "동쪽", 未: "동쪽", 申: "남쪽", 酉: "남쪽", 戌: "남쪽" };
const SAMSAL: Record<string, string> = { 申: "남쪽", 子: "남쪽", 辰: "남쪽", 寅: "북쪽", 午: "북쪽", 戌: "북쪽", 巳: "동쪽", 酉: "동쪽", 丑: "동쪽", 亥: "서쪽", 卯: "서쪽", 未: "서쪽" };
export function yearDirections(date: string): { year: string; daejanggun: string; samsal: string } {
  const [y, m, d] = date.split("-").map(Number);
  const l = Solar.fromYmd(y, m, d).getLunar();
  const zhi = l.getYearZhiByLiChun();
  const gan = l.getYearGanByLiChun();
  const year = `${STEMS_KO[STEMS.indexOf(gan as (typeof STEMS)[number])]}${BRANCHES_KO[BRANCHES.indexOf(zhi as (typeof BRANCHES)[number])]}년`;
  return { year, daejanggun: DAEJANGGUN[zhi], samsal: SAMSAL[zhi] };
}

const XIU_KO: Record<string, string> = {
  角: "각", 亢: "항", 氐: "저", 房: "방", 心: "심", 尾: "미", 箕: "기", 斗: "두", 牛: "우", 女: "여", 虚: "허", 危: "위", 室: "실", 壁: "벽",
  奎: "규", 娄: "루", 胃: "위", 昴: "묘", 毕: "필", 觜: "자", 参: "삼", 井: "정", 鬼: "귀", 柳: "류", 星: "성", 张: "장", 翼: "익", 轸: "진",
};

// One sign on a day: the short tag and what it means.
export type Note = { tag: string; why: string };

export type DayPick = {
  date: string; // YYYY-MM-DD
  label: string; // 10월 3일 (토)
  lunar: string; // 음력 8월 22일
  gz: string; // 甲子일
  fit: boolean; // the almanac allows this undertaking on this day
  score: number;
  grade: 2 | 1 | 0 | -1; // ◎ 길일 · ○ 무난 · △ 애매 · ✕ 피할 날 (or not suited)
  reasons: Note[];
  warns: Note[];
  hours: string[]; // "7:00~11:00 청룡·명당시"
  ceremony: string | null; // wedding or betrothal: the 황도 hour nearest midday, for the ceremony or the lunch
  son: string | null; // move: where 손 is that day (null on a 손 없는 날)
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
    // A kind with no 宜 words (면접·시험: the almanac has none for it) takes every day but the almanac's
    // "nothing goes" days, and the chart does the choosing below.
    const fit = k.yi.length ? k.yi.some((x) => yi.includes(x)) && !k.yi.some((x) => ji.includes(x)) : !yi.includes("诸事不宜");
    const reasons: Note[] = [];
    const warns: Note[] = [];
    let score = 0;

    const spirit = SPIRIT_KO[l.getDayTianShen()] ?? l.getDayTianShen();
    const spiritNote = { tag: "", why: SPIRIT_WHY[spirit] ?? "" };
    if (l.getDayTianShenType() === "黄道") {
      score += 2;
      reasons.push({ ...spiritNote, tag: `황도일(${spirit})` });
    } else {
      score -= 2;
      warns.push({ ...spiritNote, tag: `흑도일(${spirit})` });
    }
    const officer = l.getZhiXing();
    const os = OFFICER_SCORE[officer] ?? 0;
    score += os;
    const officerNote = { tag: `${OFFICER_KO[officer]}일(${OFFICER_HANJA[officer] ?? officer}日)`, why: OFFICER_WHY[officer] ?? "" };
    if (os > 0) reasons.push(officerNote);
    if (os < 0) warns.push(officerNote);
    const xiu = l.getXiu();
    if (l.getXiuLuck() === "吉") {
      score += 1;
      const name = XIU_KO[xiu] ?? xiu;
      reasons.push({ tag: `${name}수(${xiu}宿)`, why: `그날 하늘을 지키는 28수 별자리가 길한 별인 ${name}수(${xiu}宿)예요. 옛 책력은 별자리까지 좋은 날에 한 번 더 점수를 줬어요.` });
    } else score -= 1;
    if (kind === "exam" && yi.includes("入学")) {
      score += 1;
      reasons.push({ tag: "입학(入學)의 날", why: "책력이 배움을 시작하기 좋다고 적은 날이에요. 시험과 공부에 관련된 일에 한 번 더 점수를 줬어요." });
    }
    if (kind === "move" && [9, 0].includes(l.getDay() % 10)) {
      score += 2;
      reasons.push({ tag: "손 없는 날", why: "음력 날짜의 끝자리가 9나 0인 '손 없는 날'이에요. 사람을 따라다니며 해코지한다는 손(귀신)이 어느 방향에도 없다고 해서, 예부터 이사 날로 가장 많이 골라요." });
    }

    // The 일지 is the spouse seat for a wedding or a betrothal, and one's own ground for anything else.
    const couple = kind === "wedding" || kind === "meet";
    const seat = couple ? "배우자 자리(일지)" : "내 자리(일지)";
    for (const { p, r } of reads) {
      const who = people.length > 1 ? `${p.name}님 ` : "";
      const toSeat = meetings(branch, p.pillars.dayBranch);
      if (toSeat.includes("충")) {
        score -= 3;
        warns.push({
          tag: `${who}${seat}와 충`,
          why:
            couple
              ? `${p.name}님의 배우자 자리와 정면으로 부딪히는(충) 날이에요. 관계를 맺는 ${kind === "wedding" ? "결혼" : "상견례·약혼"} 날로는 빼 두는 게 좋아요.`
              : `${p.name}님 사주의 중심 자리와 정면으로 부딪히는(충) 날이에요. 몸과 마음이 어수선해지기 쉬워 큰일은 피하는 편이 좋아요.`,
        });
      } else if (toSeat.includes("육합")) {
        score += 1;
        reasons.push({
          tag: `${who}일지와 육합`,
          why:
            couple
              ? `그날의 기운이 ${p.name}님의 배우자 자리와 짝을 이뤄요(육합). 곁에 있는 사람과의 인연을 단단히 묶어 주는 날로 봐요.`
              : `그날의 기운이 ${p.name}님 사주의 중심 자리와 짝을 이뤄요(육합). 나와 손발이 맞는 날이라 일이 순하게 풀리기 쉬워요.`,
        });
      }
      if (meetings(branch, p.pillars.yearBranch).includes("충")) {
        score -= 2;
        warns.push({ tag: `${who}띠와 충`, why: `${p.name}님의 띠와 부딪히는 날(띠충)이에요. 옛날부터 큰일은 피하라고 한 날이에요.` });
      }
      if (r && (stemEl(stem) === r.yong || BRANCH_EL[branch] === r.yong)) {
        score += 1;
        const el = `${ELEMENT_KO[r.yong]}(${ELEMENT_HANJA[r.yong]})`;
        reasons.push({
          tag: `${who}필요한 ${ELEMENT_KO[r.yong]} 기운`,
          why: `${p.name}님 사주에 가장 필요한 ${el} 기운이 그날 들어와요. 모자란 기운이 채워지는 날에 시작한 일은 힘을 덜 들이고 풀린다고 봐요.`,
        });
      }
      // 면접·시험: the day that brings recognition (관성) or the paper and the pass (인성), and the two stars
      // of help and study at the day's branch.
      if (kind === "exam") {
        const g = GROUP_OF[tenGod(p.pillars.dayStem, stem)];
        if (g === "관성") {
          score += 1;
          reasons.push({ tag: `${who}인정받는 기운(관성)`, why: `그날의 천간이 ${p.name}님에게 관성이에요. 관성은 나를 평가하고 뽑아 주는 자리의 기운이라, 면접관과 시험관의 눈에 드는 날로 봐요.` });
        } else if (g === "인성") {
          score += 1;
          reasons.push({ tag: `${who}합격·문서의 기운(인성)`, why: `그날의 천간이 ${p.name}님에게 인성이에요. 인성은 공부와 문서, 자격의 기운이라 배운 것이 제대로 나오고 합격 문서를 받는 날로 봐요.` });
        } else if (g === "재성" && r && (r.strength === "신약" || r.strength === "극신약")) {
          score -= 1;
          warns.push({ tag: `${who}흩어지는 기운(재성)`, why: `그날의 천간이 ${p.name}님에게 재성이에요. 힘이 약한 사주에는 집중이 흩어지기 쉬운 날이라, 시험보다는 다른 일에 어울려요.` });
        }
        const sals = salsAt(p.pillars, branch);
        if (sals.includes("문창귀인")) {
          score += 2;
          reasons.push({ tag: `${who}문창귀인 날`, why: `그날의 지지가 ${p.name}님의 문창귀인이에요. 글과 시험의 별이라, 머리가 맑고 답이 잘 떠오르는 날로 쳐요.` });
        }
        if (sals.includes("천을귀인")) {
          score += 1;
          reasons.push({ tag: `${who}천을귀인 날`, why: `그날의 지지가 ${p.name}님의 천을귀인이에요. 뜻밖에 나를 알아봐 주는 사람을 만나는 날이라, 면접에 특히 좋아요.` });
        }
      }
    }

    // 황도 hours in the daytime that do not clash with anyone's 일지, back-to-back ones read as one span.
    const slots = l
      .getTimes()
      .map((t) => ({ from: Number(t.getMinHm().slice(0, 2)), to: Number(t.getMaxHm().slice(0, 2)) + 1, spirit: SPIRIT_KO[t.getTianShen()] ?? t.getTianShen(), t }))
      .filter(({ from, t }) => {
        const b = BRANCHES.indexOf(t.getZhi() as (typeof BRANCHES)[number]);
        return t.getTianShenType() === "黄道" && from >= 7 && from <= 19 && !people.some((p) => meetings(b, p.pillars.dayBranch).includes("충"));
      });
    const hours = slots
      .reduce<{ from: number; to: number; spirits: string[] }[]>((acc, x) => {
        const last = acc.at(-1);
        if (last && last.to === x.from) {
          last.to = x.to;
          last.spirits.push(x.spirit);
        } else acc.push({ from: x.from, to: x.to, spirits: [x.spirit] });
        return acc;
      }, [])
      .map((x) => `${x.from}:00~${x.to}:00 ${x.spirits.join("·")}시`);
    const noon = [...slots].sort((x, y) => Math.abs(x.from + 1 - 12.5) - Math.abs(y.from + 1 - 12.5))[0];
    const ceremony = couple && noon ? `${noon.from}:00~${noon.to}:00 (${noon.spirit}시)` : null;
    const son = kind === "move" ? SON[l.getDay() % 10] : null;

    const clashes = warns.some((w) => w.tag.includes("충"));
    // 면접·시험 takes every day as a candidate, so its marks ask for one more point: ◎ stays a few days a month.
    const bar = kind === "exam" ? 1 : 0;
    const grade: DayPick["grade"] = !fit || (couple && clashes) ? -1 : score >= 4 + bar ? 2 : score >= 1 + bar ? 1 : score >= -1 ? 0 : -1;
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
      ceremony,
      son,
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
    .sort((a, b) => b.score - a.score || (kind === "wedding" || kind === "meet" ? Number(b.weekend) - Number(a.weekend) : 0) || a.date.localeCompare(b.date))
    .slice(0, n);
}

// One line on why the day stands where it does.
export function verdictOf(d: DayPick, kind: Kind): string {
  const mine = d.reasons.filter((r) => /일지|기운/.test(r.tag)).length;
  const head = !KINDS[kind].yi.length
    ? d.fit
      ? `좋은 표시 ${d.reasons.length}가지가 겹치는 날이에요.`
      : "책력이 무슨 일이든 쉬라고 한 날이에요."
    : d.fit
      ? `책력이 ${KINDS[kind].label}에 맞다고 한 날이고, 좋은 표시 ${d.reasons.length}가지가 겹쳐요.`
      : `책력이 ${KINDS[kind].label}에는 권하지 않는 날이에요.`;
  const personal = mine ? " 사주에도 보탬이 되는 날이에요." : "";
  const tail = d.warns.length ? ` 다만 걸리는 표시도 ${d.warns.length}가지 있어요(${d.warns.map((w) => w.tag).join(", ")}).` : " 걸리는 표시가 하나도 없어요.";
  return head + personal + tail;
}

// Days the almanac allows but the chart(s) rule out, with the reason: what a plain calendar would have offered.
export const ruledOut = (days: DayPick[]) => days.filter((d) => d.fit && d.grade === -1 && d.warns.some((w) => w.tag.includes("충")));

// Good days on a weekend, best first (a wedding or a move usually needs one).
export const weekendBest = (days: DayPick[], n = 5) =>
  days
    .filter((d) => d.weekend && d.grade >= 1)
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, n);

// The search date (KST) carried in a 택일 request, so a bought one keeps the days it was bought with.
export const searchDay = (d: unknown, now = new Date()) =>
  typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
export const dayStart = (d: string) => new Date(`${d}T00:00:00+09:00`);

// Ways to choose when the best day does not suit: the best, the earliest, a weekend one, a weekday one.
export function picksOf(days: DayPick[], kind: Kind): { label: string; day: DayPick }[] {
  const good = days.filter((d) => d.grade >= 1);
  const best = bestDays(days, kind, 1)[0];
  const earliest = [...good].sort((a, b) => a.date.localeCompare(b.date))[0];
  const weekend = weekendBest(days, 1)[0];
  const weekday = good.filter((d) => !d.weekend).sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))[0];
  const out: { label: string; day: DayPick }[] = [];
  const add = (label: string, day?: DayPick) => day && !out.some((x) => x.day.date === day.date) && out.push({ label, day });
  add("가장 좋은 날", best);
  add("가장 빠른 길일", earliest);
  if (KINDS[kind].weekend) add("주말 중 최선", weekend);
  add("평일 중 최선", weekday);
  return out;
}

// The computed search, for the writer of the 택일 소견서.
export function taekilBrief(kind: Kind, days: DayPick[], label: string): string {
  const good = days.filter((d) => d.grade >= 1);
  const tags = (xs: Note[]) => xs.map((x) => x.tag).join(", ");
  const line = (d: DayPick) =>
    `${d.date.slice(0, 4)}년 ${d.label} ${d.gz} ${d.lunar} ${["✕", "△", "○", "◎"][d.grade + 1]}: 좋은 표시 [${tags(d.reasons)}]${d.warns.length ? `; 걸리는 표시 [${tags(d.warns)}]` : ""}; 좋은 시간 ${d.hours.join(", ") || "없음"}${d.ceremony ? `; 예식 시간 ${d.ceremony}` : ""}${kind === "move" ? `; 손 ${d.son ?? "없음(손 없는 날)"}` : ""}`;
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].map((ym) => {
    const m = days.filter((d) => d.date.startsWith(ym));
    return `${Number(ym.slice(5))}월 ◎${m.filter((d) => d.grade === 2).length} ○${m.filter((d) => d.grade === 1).length}`;
  });
  const out = ruledOut(days);
  // Each month's first and last day: the year turns at 입춘 (early February), inside a month.
  const firsts = [...new Set(days.map((d) => d.date.slice(0, 7)))].flatMap((ym) => {
    const m = days.filter((d) => d.date.startsWith(ym));
    return [m[0].date, m.at(-1)!.date];
  });
  const dirs = kind === "move" ? [...new Map(firsts.map((d) => yearDirections(d)).map((x) => [x.year, x])).values()] : [];
  return [
    "■ ★ 택일 계산 결과 (이 보고서의 뼈대. 날짜와 판정은 이미 계산됐다. 새로 고르거나 순위를 바꾸지 말 것)",
    ...(kind === "exam" ? ["- 면접·시험은 책력에 따로 정한 글자가 없어, 황도일·건제십이신 위에 사주(그날이 관성·인성인지, 문창귀인·천을귀인이 드는지)로 골랐다. 시험 날짜가 정해져 있다면 그 날의 시간과 마음가짐을, 면접처럼 고를 수 있다면 날짜를 권한다"] : []),
    `- 무엇: ${KINDS[kind].title} / 기간: ${label} / 책력상 맞는 날 ${days.filter((d) => d.fit).length}일, ◎ ${days.filter((d) => d.grade === 2).length}일, ○ ${days.filter((d) => d.grade === 1).length}일, 사주와 부딪혀 뺀 날 ${out.length}일`,
    `- 가장 좋은 날(순위대로): ${bestDays(days, kind, 5).map((d, i) => `\n  ${i + 1}. ${line(d)}`).join("") || "없음"}`,
    `- 사정별로 고르기: ${picksOf(days, kind).map((x) => `${x.label} ${x.day.date.slice(0, 4)}년 ${x.day.label}`).join(" / ") || "없음"}`,
    `- 달마다: ${months.join(", ")}`,
    `- 사주 때문에 뺀 날(책력은 맞다고 한 날): ${out.slice(0, 4).map((d) => `${d.label} (${d.warns.filter((w) => w.tag.includes("충")).map((w) => w.tag).join(", ")})`).join(", ") || "없음"}`,
    ...dirs.map((x) => `- ${x.year}(입춘부터) 이사 때 피하는 방향: 대장군방 ${x.daejanggun}, 삼살방 ${x.samsal}`),
    `- 써도 좋은 날 모두: ${good.map((d) => d.label).join(", ") || "없음"}`,
  ].join("\n");
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
  if (strict && k && !OFFERED.includes(k)) return null;
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
