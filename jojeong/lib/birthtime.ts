// Turning a clock time on a Korean birth certificate into the sun's time at the place of birth.
// - The clock: Korea's standard time and daylight saving changed over the years (UTC+9, UTC+8:30 from
//   1954-03-21 to 1961-08-10, summer time in 1948–51, 1955–60 and 1987–88). The tz database (Asia/Seoul,
//   shipped with every browser and Node) knows all of it.
// - The place: local mean time runs 4 minutes behind for every degree west of 135°E (Seoul −32 min,
//   Busan −24 min). The 12 hours (시) are read from this local time.
// No dependencies, so the form can show the correction live in the browser.

export const CITIES = [
  { id: "seoul", name: "서울", lon: 126.98 },
  { id: "incheon", name: "인천", lon: 126.7 },
  { id: "suwon", name: "경기 (수원)", lon: 127.03 },
  { id: "chuncheon", name: "강원 (춘천)", lon: 127.73 },
  { id: "gangneung", name: "강원 (강릉)", lon: 128.9 },
  { id: "cheongju", name: "충북 (청주)", lon: 127.49 },
  { id: "daejeon", name: "대전", lon: 127.38 },
  { id: "cheonan", name: "충남 (천안)", lon: 127.15 },
  { id: "jeonju", name: "전북 (전주)", lon: 127.15 },
  { id: "gwangju", name: "광주", lon: 126.85 },
  { id: "mokpo", name: "전남 (목포)", lon: 126.39 },
  { id: "yeosu", name: "전남 (여수)", lon: 127.66 },
  { id: "daegu", name: "대구", lon: 128.6 },
  { id: "andong", name: "경북 (안동)", lon: 128.73 },
  { id: "pohang", name: "경북 (포항)", lon: 129.36 },
  { id: "busan", name: "부산", lon: 129.08 },
  { id: "ulsan", name: "울산", lon: 129.31 },
  { id: "changwon", name: "경남 (창원)", lon: 128.68 },
  { id: "jeju", name: "제주", lon: 126.53 },
] as const;
export type CityId = (typeof CITIES)[number]["id"];
export const cityById = (id: string) => CITIES.find((c) => c.id === id) ?? CITIES[0];

export const HOUR_NAMES = ["자시", "축시", "인시", "묘시", "진시", "사시", "오시", "미시", "신시", "유시", "술시", "해시"] as const;

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

// Minutes Korea's clock stood ahead of UTC at a given instant.
function offsetAt(utcMs: number): number {
  const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, Number(p.value)]));
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((wall - Math.floor(utcMs / 60000) * 60000) / 60000);
}

export type Corrected = {
  utcMs: number; // the actual instant of birth
  clockOffset: number; // minutes the clock ran ahead of UTC then (540, 510, 600 or 570)
  summer: boolean; // daylight saving was in force
  local: { year: number; month: number; day: number; hour: number; minute: number }; // local mean time
  shift: number; // local mean time minus the clock, in minutes
  hourBranch: number; // 0 = 자 … 11 = 해
  dayShift: -1 | 0 | 1; // the day pillar's date relative to the certificate date
};

const STANDARD = (utcMs: number) => (utcMs >= Date.UTC(1954, 2, 20, 15, 0) && utcMs < Date.UTC(1961, 7, 9, 15, 30) ? 510 : 540);

// Clock time in Korea on a solar date → the instant and the local mean time at `lon`.
export function correctBirth(year: number, month: number, day: number, hour: number, minute: number, lon: number): Corrected {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // Find the offset in force at that wall time (two passes settle it, including around the changeovers).
  let off = 540;
  for (let i = 0; i < 2; i++) off = offsetAt(wall - off * 60000);
  const utcMs = wall - off * 60000;
  const lmt = new Date(utcMs + Math.round(lon * 4) * 60000);
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
  return {
    utcMs,
    clockOffset: off,
    summer: off > STANDARD(utcMs),
    local,
    shift: Math.round((lmt.getTime() - wall) / 60000),
    hourBranch,
    dayShift,
  };
}

// A one-line explanation for the form and the reading ("서머타임 −60분 · 서울 경도 −32분 → 09:58 사시").
export function describeCorrection(c: Corrected, cityName: string): string {
  const std = STANDARD(c.utcMs);
  const parts: string[] = [];
  if (c.summer) parts.push(`서머타임 −${c.clockOffset - std}분`);
  if (std === 510) parts.push("당시 표준시 +30분");
  const lonShift = c.shift + (c.clockOffset - 540);
  parts.push(`${cityName} 경도 ${lonShift >= 0 ? "+" : "−"}${Math.abs(lonShift)}분`);
  const hh = String(c.local.hour).padStart(2, "0");
  const mm = String(c.local.minute).padStart(2, "0");
  return `${parts.join(" · ")} → 실제 ${hh}:${mm}, ${HOUR_NAMES[c.hourBranch]}`;
}
