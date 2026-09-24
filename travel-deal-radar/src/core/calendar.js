// 날짜/공휴일 유틸. 모든 날짜는 'YYYY-MM-DD' 문자열(로컬 기준, 시간대 무관)로 다룬다.

// 한국 공휴일 (샘플 데이터·판정용). major = 설/추석 같은 대이동 명절.
// 대체공휴일은 공개 달력 기준으로 넣었으나, 실서비스에서는 공공데이터포털 특일정보 API로 갱신할 것.
export const KR_HOLIDAYS = {
  '2025-10-03': { name: '개천절' },
  '2025-10-05': { name: '추석 연휴', major: true },
  '2025-10-06': { name: '추석', major: true },
  '2025-10-07': { name: '추석 연휴', major: true },
  '2025-10-08': { name: '대체공휴일', major: true },
  '2025-10-09': { name: '한글날' },
  '2025-12-25': { name: '성탄절' },
  '2026-01-01': { name: '신정' },
  '2026-02-16': { name: '설 연휴', major: true },
  '2026-02-17': { name: '설날', major: true },
  '2026-02-18': { name: '설 연휴', major: true },
  '2026-03-01': { name: '삼일절' },
  '2026-03-02': { name: '대체공휴일' },
  '2026-05-05': { name: '어린이날' },
  '2026-05-24': { name: '부처님오신날' },
  '2026-05-25': { name: '대체공휴일' },
  '2026-06-03': { name: '지방선거' },
  '2026-06-06': { name: '현충일' },
  '2026-08-15': { name: '광복절' },
  '2026-08-17': { name: '대체공휴일' },
  '2026-09-24': { name: '추석 연휴', major: true },
  '2026-09-25': { name: '추석', major: true },
  '2026-09-26': { name: '추석 연휴', major: true },
  '2026-10-03': { name: '개천절' },
  '2026-10-05': { name: '대체공휴일' },
  '2026-10-09': { name: '한글날' },
  '2026-12-25': { name: '성탄절' },
};

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`잘못된 날짜 형식: ${s} (YYYY-MM-DD 필요)`);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return formatDate(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

const isOffDay = (s, holidays) => {
  const dow = parseDate(s).getUTCDay();
  return dow === 0 || dow === 6 || Boolean(holidays[s]);
};

/**
 * '숙박하는 밤' 기준 날짜 유형.
 * - peak    : 다음날이 공휴일이고 그 공휴일이 연휴(주말 포함 2일 이상 연속 휴일)의 일부
 * - weekend : 금/토 밤 또는 다음날이 쉬는 날
 * - weekday : 그 외
 * 항공은 출발일 자체를 넣으면 같은 규칙으로 '휴일 전날 출발 = 성수기'가 된다.
 */
export function dayType(s, holidays = KR_HOLIDAYS) {
  const next = addDays(s, 1);
  if (holidays[next] || holidays[s]) {
    const inLongBreak = isOffDay(next, holidays) && (isOffDay(addDays(next, 1), holidays) || isOffDay(s, holidays));
    if (inLongBreak) return 'peak';
  }
  const dow = parseDate(s).getUTCDay();
  if (dow === 5 || dow === 6 || isOffDay(next, holidays)) return 'weekend';
  return 'weekday';
}

export function isMajorHoliday(s, holidays = KR_HOLIDAYS) {
  return Boolean(holidays[s]?.major || holidays[addDays(s, 1)]?.major);
}

export const DAY_TYPE_LABEL = { weekday: '평일', weekend: '주말', peak: '연휴' };
