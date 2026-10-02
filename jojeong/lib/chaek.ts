import { Solar } from "lunar-javascript";
import { BRANCHES, STEMS } from "./saju";

// A calendar month as the almanac gives it (lunar dates, 손 없는 날, the 24 절기 and when the saju month turns,
// Korean public holidays). Computed, nothing stored; used by the 손 없는 날 reel and the night post.

// The 24 절기 as lunar-javascript names them (both scripts), with their Korean name, hanja and meaning.
export const TERMS: Record<string, [ko: string, hanja: string, meaning: string]> = {
  立春: ["입춘", "立春", "봄이 들어선다는 날"],
  雨水: ["우수", "雨水", "눈이 비로 바뀌고 얼음이 녹기 시작한다는 때"],
  惊蛰: ["경칩", "驚蟄", "겨울잠 자던 벌레가 깨어난다는 때"],
  驚蟄: ["경칩", "驚蟄", "겨울잠 자던 벌레가 깨어난다는 때"],
  春分: ["춘분", "春分", "낮과 밤의 길이가 같아지는 날"],
  清明: ["청명", "淸明", "하늘이 맑고 밝아진다는 때"],
  淸明: ["청명", "淸明", "하늘이 맑고 밝아진다는 때"],
  谷雨: ["곡우", "穀雨", "곡식을 깨우는 비가 내린다는 때"],
  穀雨: ["곡우", "穀雨", "곡식을 깨우는 비가 내린다는 때"],
  立夏: ["입하", "立夏", "여름이 들어선다는 날"],
  小满: ["소만", "小滿", "만물이 조금씩 차오른다는 때"],
  小滿: ["소만", "小滿", "만물이 조금씩 차오른다는 때"],
  芒种: ["망종", "芒種", "보리는 거두고 벼는 심는 때"],
  芒種: ["망종", "芒種", "보리는 거두고 벼는 심는 때"],
  夏至: ["하지", "夏至", "낮이 한 해 가운데 가장 긴 날"],
  小暑: ["소서", "小暑", "작은 더위가 시작된다는 때"],
  大暑: ["대서", "大暑", "큰 더위가 온다는 때"],
  立秋: ["입추", "立秋", "가을이 들어선다는 날"],
  处暑: ["처서", "處暑", "더위가 그친다는 때"],
  處暑: ["처서", "處暑", "더위가 그친다는 때"],
  白露: ["백로", "白露", "풀잎에 흰 이슬이 맺힌다는 때"],
  秋分: ["추분", "秋分", "낮과 밤의 길이가 다시 같아지는 날"],
  寒露: ["한로", "寒露", "찬 이슬이 맺히기 시작한다는 때"],
  霜降: ["상강", "霜降", "첫서리가 내린다는 때"],
  立冬: ["입동", "立冬", "겨울이 들어선다는 날"],
  小雪: ["소설", "小雪", "첫눈이 내린다는 때"],
  大雪: ["대설", "大雪", "눈이 크게 온다는 때"],
  冬至: ["동지", "冬至", "밤이 한 해 가운데 가장 긴 날"],
  小寒: ["소한", "小寒", "작은 추위가 온다는 때"],
  大寒: ["대한", "大寒", "큰 추위가 온다는 때"],
};

export const WEEK = "일월화수목금토";

export type ChaekDay = {
  d: number;
  wd: number; // 0 = Sunday
  lunarM: number; // negative in a leap month
  lunarD: number;
  lunar: string; // "8.29", "윤6.3"
  son: boolean;
  holi: string | null;
  term: { ko: string; hanja: string; meaning: string; opens: boolean } | null; // opens: a 절, the saju month turns
  stem: number;
  branch: number;
};

const DAY = 86400000;
const ymdOf = (t: number) => {
  const x = new Date(t);
  return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()] as const;
};
const key = (m: number, d: number) => `${m}-${d}`;

// Public holidays of a year (관공서의 공휴일에 관한 규정): the fixed days, 설날·추석 (three days each) and 부처님오신날
// by the lunar calendar, then the substitute days: 설날·추석 when a Sunday or another holiday falls in them; the
// national days, 어린이날, 부처님오신날 and 성탄절 when they fall on a weekend or on another holiday. Election days
// and one-off holidays are not in it.
const holidayCache = new Map<number, Map<string, string>>();
export function holidaysOf(y: number): Map<string, string> {
  const hit = holidayCache.get(y);
  if (hit) return hit;
  const out = new Map<string, string>();
  const FIXED: [number, number, string][] = [
    [1, 1, "신정"], [3, 1, "삼일절"], [5, 5, "어린이날"], [6, 6, "현충일"], [8, 15, "광복절"], [10, 3, "개천절"], [10, 9, "한글날"], [12, 25, "성탄절"],
  ];
  for (const [m, d, name] of FIXED) out.set(key(m, d), name);

  // The lunar ones: walk the year once.
  const seollal: number[] = [];
  const chuseok: number[] = [];
  let buddha: number | null = null;
  for (let t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += DAY) {
    const [yy, mm, dd] = ymdOf(t);
    const l = Solar.fromYmd(yy, mm, dd).getLunar();
    const lm = l.getMonth();
    const ld = l.getDay();
    const next = Solar.fromYmd(...ymdOf(t + DAY)).getLunar();
    const prev = Solar.fromYmd(...ymdOf(t - DAY)).getLunar();
    if ((lm === 1 && ld === 1) || (next.getMonth() === 1 && next.getDay() === 1) || (prev.getMonth() === 1 && prev.getDay() === 1)) seollal.push(t);
    if (lm === 8 && ld >= 14 && ld <= 16) chuseok.push(t);
    if (lm === 4 && ld === 8) buddha = t;
  }
  // A day that is already a holiday keeps both names (2028: 개천절·추석 연휴).
  const add = (t: number, name: string) => {
    const k = key(ymdOf(t)[1], ymdOf(t)[2]);
    out.set(k, out.has(k) ? `${out.get(k)}·${name}` : name);
  };
  for (const t of seollal) {
    const l = Solar.fromYmd(...ymdOf(t)).getLunar();
    add(t, l.getMonth() === 1 && l.getDay() === 1 ? "설날" : "설 연휴");
  }
  for (const t of chuseok) add(t, Solar.fromYmd(...ymdOf(t)).getLunar().getDay() === 15 ? "추석" : "추석 연휴");
  // 2025: 부처님오신날 on 어린이날, so both names.
  if (buddha !== null) add(buddha, "부처님오신날");

  // Substitute days: the first weekday after, that is not a holiday already.
  const isHoliday = (t: number) => out.has(key(ymdOf(t)[1], ymdOf(t)[2]));
  const weekday = (t: number) => new Date(t).getUTCDay();
  const substitute = (after: number) => {
    let t = after + DAY;
    while (isHoliday(t) || weekday(t) === 0 || weekday(t) === 6) t += DAY;
    const [yy, mm, dd] = ymdOf(t);
    if (yy === y) out.set(key(mm, dd), "대체공휴일");
  };
  for (const group of [seollal, chuseok]) {
    if (!group.length) continue;
    const others = group.filter((t) => weekday(t) === 0 || [...FIXED].some(([m, d]) => key(m, d) === key(ymdOf(t)[1], ymdOf(t)[2])) || t === buddha).length;
    if (others) substitute(Math.max(...group));
  }
  // One substitute per day, however many holidays share it; a day inside 설·추석 is left to the rule above.
  const weekendRule = new Set([
    ...[[3, 1], [5, 5], [8, 15], [10, 3], [10, 9], [12, 25]].map(([m, d]) => Date.UTC(y, m - 1, d)),
    ...(buddha !== null ? [buddha] : []),
  ]);
  for (const t of [...weekendRule].sort((a, b) => a - b)) {
    if (seollal.includes(t) || chuseok.includes(t)) continue;
    const shared = (out.get(key(ymdOf(t)[1], ymdOf(t)[2])) ?? "").includes("·");
    if (weekday(t) === 0 || weekday(t) === 6 || shared) substitute(t);
  }
  holidayCache.set(y, out);
  return out;
}

const lunarLabel = (m: number, d: number) => `${m < 0 ? `윤${-m}` : m}.${d}`;

// Every day of a calendar month.
export function monthOf(y: number, m: number): ChaekDay[] {
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const holi = holidaysOf(y);
  return Array.from({ length: last }, (_, i) => {
    const d = i + 1;
    const l = Solar.fromYmd(y, m, d).getLunar();
    const jq = TERMS[l.getJieQi()];
    return {
      d,
      wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
      lunarM: l.getMonth(),
      lunarD: l.getDay(),
      lunar: lunarLabel(l.getMonth(), l.getDay()),
      son: l.getDay() % 10 === 9 || l.getDay() % 10 === 0,
      holi: holi.get(key(m, d)) ?? null,
      term: jq ? { ko: jq[0], hanja: jq[1], meaning: jq[2], opens: Boolean(l.getCurrentJie()) } : null,
      stem: STEMS.indexOf(l.getDayGan() as (typeof STEMS)[number]),
      branch: BRANCHES.indexOf(l.getDayZhi() as (typeof BRANCHES)[number]),
    };
  });
}
