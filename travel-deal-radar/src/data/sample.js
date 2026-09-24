// ⚠️ 샘플 데이터: 실제 호텔/항공사 가격이 아니다. 로직 검증과 화면 데모용으로 결정적(seed) 난수로 생성.
// 실서비스에서는 이 모듈을 src/data/sources/*.js 어댑터(수집 → 저장된 가격 이력)로 교체한다.
import { addDays, dayType, parseDate } from '../core/calendar.js';

// 시드 고정 난수 (mulberry32) → 새로고침해도 같은 데이터
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOTEL_SEASON = { 1: 0.85, 2: 0.85, 4: 1.2, 5: 1.2, 7: 1.15, 8: 1.15, 10: 1.2, 11: 1.2, 12: 0.85 };
const FLIGHT_SEASON = { 1: 1.2, 7: 1.3, 8: 1.3, 12: 1.2 };

function buildHistory({ seed, base, factors, season, today, days = 365 }) {
  const rand = rng(seed);
  const out = [];
  for (let i = days; i >= 1; i--) {
    const date = addDays(today, -i);
    const month = parseDate(date).getUTCMonth() + 1;
    const noise = 0.9 + rand() * 0.2;
    const price = base * factors[dayType(date)] * (season[month] ?? 1) * noise;
    out.push({ date, price: Math.round(price / 1000) * 1000 });
  }
  return out;
}

export const SAMPLE_TODAY = '2026-09-24';

const HOTEL_FACTORS = { weekday: 1, weekend: 1.6, peak: 3.1 };
const FLIGHT_FACTORS = { weekday: 1, weekend: 1.35, peak: 2.2 };

const hotels = [
  {
    id: 'h-bomun',
    name: '보문호수 A리조트 (디럭스 더블)',
    area: '경주 보문관광단지',
    base: 95000,
    offer: { date: '2026-09-24', price: 58000, refundable: false, source: '예약사이트 X' },
    recentQuotes: [
      { date: '2026-09-20', price: 182000 },
      { date: '2026-09-22', price: 141000 },
      { date: '2026-09-23', price: 99000 },
    ],
  },
  {
    id: 'h-hanok',
    name: '황리단길 B한옥스테이',
    area: '경주 황남동',
    base: 120000,
    offer: { date: '2026-10-10', price: 205000, refundable: true, source: '예약사이트 Y' },
  },
  {
    id: 'h-station',
    name: '신경주역 C비즈니스호텔',
    area: '경주 건천읍',
    base: 60000,
    offer: { date: '2026-10-14', price: 49000, refundable: true, source: '예약사이트 Z' },
  },
];

const flights = [
  {
    id: 'f-gmp-cju',
    name: '김포 → 제주 (편도)',
    area: 'GMP-CJU',
    base: 55000,
    offer: { date: '2026-10-01', price: 29000, refundable: false, source: '항공권 메타검색 X' },
    recentQuotes: [{ date: '2026-09-21', price: 61000 }],
  },
  {
    id: 'f-icn-kix',
    name: '인천 → 오사카 간사이 (왕복)',
    area: 'ICN-KIX',
    base: 230000,
    offer: { date: '2026-11-18', price: 149000, refundable: false, source: '항공권 메타검색 Y' },
  },
  {
    id: 'f-icn-nrt',
    name: '인천 → 도쿄 나리타 (왕복)',
    area: 'ICN-NRT',
    base: 250000,
    offer: { date: '2026-10-02', price: 540000, refundable: true, source: '항공권 메타검색 Z' },
  },
];

export function loadSampleWatchlist(today = SAMPLE_TODAY) {
  const mk = (kind, factors, season) => (item, idx) => ({
    ...item,
    kind,
    history: buildHistory({ seed: 1000 + idx * 17 + (kind === 'flight' ? 500 : 0), base: item.base, factors, season, today }),
  });
  return [
    ...hotels.map(mk('hotel', HOTEL_FACTORS, HOTEL_SEASON)),
    ...flights.map(mk('flight', FLIGHT_FACTORS, FLIGHT_SEASON)),
  ];
}
