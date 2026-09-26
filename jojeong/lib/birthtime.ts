// Turning a clock time on a Korean birth certificate into the sun's time at the place of birth.
// - The clock: Korea's standard time and daylight saving changed over the years (UTC+9, UTC+8:30 from
//   1954-03-21 to 1961-08-10, summer time in 1948–51, 1955–60 and 1987–88). The tz database (Asia/Seoul,
//   shipped with every browser and Node) knows all of it.
// - The place: local mean time runs 4 minutes behind for every degree west of 135°E (Seoul −32 min,
//   Busan −24 min). The 12 hours (시) are read from this local time.
// No dependencies, so the form can show the correction live in the browser.

export { CITIES, cityById, searchCities, type City } from "./cities";

export const HOUR_NAMES = ["자시", "축시", "인시", "묘시", "진시", "사시", "오시", "미시", "신시", "유시", "술시", "해시"] as const;

const formats = new Map<string, Intl.DateTimeFormat>();
function formatFor(tz: string) {
  let f = formats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    formats.set(tz, f);
  }
  return f;
}

// Minutes a place's clock stood ahead of UTC at a given instant.
function offsetAt(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(formatFor(tz).formatToParts(new Date(utcMs)).map((p) => [p.type, Number(p.value)]));
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((wall - Math.floor(utcMs / 60000) * 60000) / 60000);
}

// The standard (non-summer) offset in force that year: the smaller of mid-winter and mid-summer.
function standardOffset(utcMs: number, tz: string): number {
  const y = new Date(utcMs).getUTCFullYear();
  return Math.min(offsetAt(Date.UTC(y, 0, 15), tz), offsetAt(Date.UTC(y, 6, 15), tz));
}

export type Corrected = {
  utcMs: number; // the actual instant of birth
  clockOffset: number; // minutes the clock ran ahead of UTC then (540, 510, 600 or 570)
  standard: number; // the standard offset that year
  summer: boolean; // daylight saving was in force
  korea: boolean;
  local: { year: number; month: number; day: number; hour: number; minute: number }; // local mean time
  shift: number; // local mean time minus the clock, in minutes
  hourBranch: number; // 0 = 자 … 11 = 해
  dayShift: -1 | 0 | 1; // the day pillar's date relative to the certificate date
};

// Clock time at a birthplace (a solar date) → the instant and the local mean time there.
export function correctBirth(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  place: { lon: number; tz: string },
): Corrected {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // Find the offset in force at that wall time (two passes settle it, including around the changeovers).
  let off = 540;
  for (let i = 0; i < 2; i++) off = offsetAt(wall - off * 60000, place.tz);
  const utcMs = wall - off * 60000;
  const lmt = new Date(utcMs + Math.round(place.lon * 4) * 60000);
  const local = {
    year: lmt.getUTCFullYear(),
    month: lmt.getUTCMonth() + 1,
    day: lmt.getUTCDate(),
    hour: lmt.getUTCHours(),
    minute: lmt.getUTCMinutes(),
  };
  const mins = local.hour * 60 + local.minute;
  // 자시 runs 23:00–00:59 and opens the new day (정자시): a birth from 23:00 counts on the next day.
  const hourBranch = Math.floor(((mins + 60) % 1440) / 120);
  const localDate = Date.UTC(local.year, local.month - 1, local.day) + (mins >= 23 * 60 ? 86400000 : 0);
  const dayShift = Math.round((localDate - Date.UTC(year, month - 1, day)) / 86400000) as -1 | 0 | 1;
  const standard = standardOffset(utcMs, place.tz);
  return {
    utcMs,
    clockOffset: off,
    standard,
    summer: off > standard,
    local,
    shift: Math.round((lmt.getTime() - wall) / 60000),
    hourBranch,
    dayShift,
    korea: place.tz === "Asia/Seoul",
  };
}

// A one-line explanation for the form ("서머타임 −60분 · 서울 경도 −32분 → 실제 08:38, 진시").
export function describeCorrection(c: Corrected, cityName: string): string {
  const parts: string[] = [];
  if (c.summer) parts.push(`서머타임 −${c.clockOffset - c.standard}분`);
  // In Korea the longitude is measured from today's 135°E, so the 1954–61 standard time shows on its own.
  const base = c.korea ? 540 : c.standard;
  if (c.korea && c.standard !== 540) parts.push(`당시 표준시 ${c.standard < 540 ? "+" : "−"}${Math.abs(540 - c.standard)}분`);
  const lonShift = c.shift + (c.clockOffset - base);
  parts.push(`${cityName} 경도 ${lonShift >= 0 ? "+" : "−"}${Math.abs(lonShift)}분`);
  const hh = String(c.local.hour).padStart(2, "0");
  const mm = String(c.local.minute).padStart(2, "0");
  return `${parts.join(" · ")} → 실제 ${hh}:${mm}, ${HOUR_NAMES[c.hourBranch]}`;
}

// Reads a birth time however it is typed: "0930", "930", "21:30", "9시 30분", "오후 9시반", "밤 11시",
// "pm 9:30". Returns the 24-hour clock time, or null when it cannot be read.
export function parseClock(text: string): { hour: number; minute: number } | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  const pm = /(오후|저녁|밤|pm|p\.m\.)/.test(t);
  const am = /(오전|새벽|아침|am|a\.m\.)/.test(t);
  const half = /반/.test(t);
  let hour: number;
  let minute = 0;
  const hm = /(\d{1,2})\s*(?::|시|h)\s*(\d{1,2})?/.exec(t);
  const digits = t.replace(/\D/g, "");
  if (hm) {
    hour = Number(hm[1]);
    minute = hm[2] ? Number(hm[2]) : half ? 30 : 0;
  } else if (/^\d{3,4}$/.test(digits) && !/[^\d\s]/.test(t.replace(/(오전|오후|저녁|밤|새벽|아침|am|pm)/g, ""))) {
    hour = Number(digits.slice(0, -2));
    minute = Number(digits.slice(-2));
  } else if (/^\d{1,2}$/.test(digits)) {
    hour = Number(digits);
    minute = half ? 30 : 0;
  } else return null;
  if (hour > 24 || minute > 59) return null;
  if (hour === 24) hour = 0;
  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;
  if (/밤/.test(t) && hour === 12) hour = 0; // 밤 12시 = 자정
  return { hour, minute };
}

export const clockLabel = ({ hour, minute }: { hour: number; minute: number }) =>
  `${hour < 12 ? "오전" : "오후"} ${hour % 12 === 0 ? 12 : hour % 12}시${minute ? ` ${minute}분` : ""}`;
