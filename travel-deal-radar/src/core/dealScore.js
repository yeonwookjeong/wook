// 핵심 로직: "평소 가격(베이스라인)"을 구하고, 지금 가격이 얼마나 튀는지 + 왜 쌀 수 있는지 추정한다.
import { dayType, daysBetween, isMajorHoliday, parseDate, KR_HOLIDAYS } from './calendar.js';

// 등급 기준. 15% / 25%는 Google Hotels의 "Deal / Great deal" 배지 기준과 맞춤.
export const GRADES = [
  { id: 'steal', min: 0.4, label: '역대급', emoji: '🔥' },
  { id: 'great', min: 0.25, label: '아주 좋은 딜', emoji: '💎' },
  { id: 'good', min: 0.15, label: '좋은 딜', emoji: '👍' },
  { id: 'typical', min: -0.1, label: '평소 수준', emoji: '😐' },
  { id: 'high', min: -Infinity, label: '평소보다 비쌈', emoji: '⚠️' },
];

const SEASON_WINDOW_DAYS = 45;
const MIN_SAMPLES = 5;

export function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// 연도를 무시한 '달력상 거리' (예: 9/24 와 작년 10/10 → 16일)
function seasonalDistance(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  const doy = (d) => (d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000;
  const diff = Math.abs(doy(da) - doy(db));
  return Math.min(diff, 365 - diff);
}

/**
 * 비교 대상 표본 고르기: 같은 날짜 유형(평일/주말/연휴) + 비슷한 시즌(±45일).
 * 표본이 부족하면 시즌 조건 → 날짜 유형 조건 순으로 완화하고 신뢰도를 낮춘다.
 */
export function comparableSamples(history, targetDate, holidays = KR_HOLIDAYS) {
  const type = dayType(targetDate, holidays);
  const others = history.filter((h) => h.date !== targetDate && Number.isFinite(h.price) && h.price > 0);
  const sameType = others.filter((h) => dayType(h.date, holidays) === type);
  const seasonal = sameType.filter((h) => seasonalDistance(h.date, targetDate) <= SEASON_WINDOW_DAYS);

  if (seasonal.length >= MIN_SAMPLES) return { samples: seasonal, basis: `같은 ${labelOf(type)}·비슷한 시즌`, confidence: 'high' };
  if (sameType.length >= MIN_SAMPLES) return { samples: sameType, basis: `최근 1년 ${labelOf(type)}`, confidence: 'medium' };
  return { samples: others, basis: '최근 1년 전체', confidence: 'low' };
}

const labelOf = (t) => ({ weekday: '평일', weekend: '주말', peak: '연휴' })[t];

export function gradeOf(discount) {
  return GRADES.find((g) => discount >= g.min);
}

/**
 * @param {object} p
 * @param {'hotel'|'flight'} p.kind
 * @param {{date:string, price:number}[]} p.history  과거 관측 가격(같은 호텔/노선)
 * @param {{date:string, price:number, refundable?:boolean}} p.offer  지금 보고 있는 가격
 * @param {string} p.today  검색한 날 (YYYY-MM-DD)
 * @param {{date:string, price:number}[]} [p.recentQuotes]  같은 날짜 상품을 최근 며칠간 관측한 가격(하락 감지용)
 */
export function analyzeDeal({ kind, history, offer, today, recentQuotes = [], holidays = KR_HOLIDAYS }) {
  if (!offer || !(offer.price > 0)) throw new Error('offer.price가 필요합니다');
  if (!Array.isArray(history) || history.length === 0) throw new Error('비교할 과거 가격(history)이 없습니다');

  const { samples, basis, confidence } = comparableSamples(history, offer.date, holidays);
  const sorted = samples.map((s) => s.price).sort((a, b) => a - b);
  const baseline = quantile(sorted, 0.5);
  const discount = 1 - offer.price / baseline;
  // 같은 조건 과거 가격 중 지금보다 비쌌던 비율 → "상위 몇 % 저렴"
  const cheaperThanShare = sorted.filter((p) => p > offer.price).length / sorted.length;

  const ctx = {
    kind,
    type: dayType(offer.date, holidays),
    leadDays: daysBetween(today, offer.date),
    discount,
    refundable: offer.refundable,
    majorHoliday: isMajorHoliday(offer.date, holidays),
    recentDrop: recentDropRatio(recentQuotes, offer.price),
  };

  return {
    baseline: Math.round(baseline),
    p25: Math.round(quantile(sorted, 0.25)),
    p75: Math.round(quantile(sorted, 0.75)),
    min: sorted[0],
    sampleCount: sorted.length,
    basis,
    confidence,
    dayType: ctx.type,
    leadDays: ctx.leadDays,
    discount,
    cheaperThanShare,
    grade: gradeOf(discount),
    reasons: explainReasons(ctx),
    checklist: discount >= 0.25 ? riskChecklist(kind, discount) : [],
  };
}

/** 과거 데이터가 없을 때: 사용자가 아는 '평소/연휴 가격'만으로 빠르게 판정 */
export function analyzeQuick({ kind = 'hotel', price, usualPrice, peakPrice, isPeak = false, leadDays = 0, refundable }) {
  const baseline = isPeak && peakPrice > 0 ? peakPrice : usualPrice;
  if (!(price > 0) || !(baseline > 0)) throw new Error('현재 가격과 평소 가격을 입력하세요');
  const discount = 1 - price / baseline;
  const ctx = { kind, type: isPeak ? 'peak' : 'weekend', leadDays, discount, refundable, majorHoliday: false, recentDrop: 0 };
  return {
    baseline,
    discount,
    grade: gradeOf(discount),
    reasons: explainReasons(ctx),
    checklist: discount >= 0.25 ? riskChecklist(kind, discount) : [],
  };
}

function recentDropRatio(quotes, price) {
  if (!quotes.length) return 0;
  const maxRecent = Math.max(...quotes.map((q) => q.price));
  return maxRecent > 0 ? 1 - price / maxRecent : 0;
}

/**
 * "왜 쌀까?" 추정. 데이터로 확정할 수 없는 건 confidence를 '가설'로 둔다.
 * 순서 = 설명력이 큰 순.
 */
export function explainReasons({ kind, type, leadDays, discount, refundable, majorHoliday, recentDrop }) {
  const out = [];
  const add = (code, title, detail, confidence) => out.push({ code, title, detail, confidence });
  const cheap = discount >= 0.15;

  if (kind === 'hotel') {
    if (cheap && leadDays <= 1) {
      add('last-minute', '막판 재고 떨이',
        '호텔 객실은 오늘 못 팔면 가치가 0이 되는 "소멸성 상품"이라, 체크인 직전 빈 방은 원가 이하로라도 판다. 수익관리(RM) 시스템이 자동으로 가격을 내리는 구간.',
        discount >= 0.25 ? '높음' : '중간');
    }
    if (cheap && majorHoliday && (type === 'peak' || type === 'weekend')) {
      add('holiday-dip', '명절 당일 역수요',
        '설·추석 당일 전후엔 귀성·차례로 관광 숙박 수요가 빠지는 날이 생긴다. "연휴=비쌈"은 연휴 후반/귀경 이후에 몰리는 경우가 많다.',
        '가설');
    }
    if (cheap && recentDrop >= 0.2) {
      add('cancel-release', '취소 객실이 풀림',
        `최근 며칠 새 같은 날짜 가격이 ${Math.round(recentDrop * 100)}% 떨어졌다. 단체/무료취소 예약이 대량으로 풀리면 재고가 늘어 가격이 재조정된다.`,
        '중간');
    }
    if (cheap && leadDays >= 60) {
      add('early-bird', '얼리버드 구간', '두 달 이상 남은 시점엔 수요가 확정되지 않아 선판매용 할인 요금이 걸린다.', '중간');
    }
    if (cheap && type === 'weekday') {
      add('weekday', '평일 비수기', '관광지 호텔은 평일 점유율이 낮아 주말 대비 크게 싸진다.', '중간');
    }
  } else {
    if (cheap && leadDays <= 7) {
      add('last-minute', '막판 빈 좌석 처분',
        '항공은 보통 출발 직전이 더 비싸다. 그럼에도 싸다면 판매가 저조해 남은 좌석을 최하위 운임 클래스로 다시 연 것일 가능성이 크다.',
        '중간');
    }
    if (cheap && leadDays >= 21 && leadDays <= 90) {
      add('sweet-spot', '통상 최저가 구간', '출발 3주~3개월 전은 항공사가 저가 운임 클래스를 가장 많이 열어두는 구간이다.', '중간');
    }
    if (cheap && recentDrop >= 0.2) {
      add('sale', '프로모션/운임 재조정', `최근 며칠 새 ${Math.round(recentDrop * 100)}% 하락. 항공사 특가나 경쟁사 가격 대응일 가능성.`, '중간');
    }
    if (cheap && type === 'weekday') {
      add('weekday', '비인기 요일 출발', '화·수 출발 편은 수요가 적어 저가 운임이 오래 남는다.', '중간');
    }
  }

  if (cheap && refundable === false) {
    add('non-refundable', '환불불가 요금', '취소·변경 권리를 포기하는 대가로 보통 10~20% 싸다. 일정이 확정됐을 때만 유리.', '높음');
  }
  if (discount >= 0.6) {
    add('anomaly', kind === 'flight' ? '에러페어 가능성' : '가격 오류/쿠폰 중첩 가능성',
      '평소 대비 60% 이상 싼 건 흔치 않다. 요금 입력 실수나 카드·회원 쿠폰이 겹친 경우일 수 있어, 판매처가 예약을 취소할 수도 있다.',
      '가설');
  }
  if (cheap && out.length === 0) {
    add('unknown', '뚜렷한 패턴 없음', '데이터상 설명되는 요인이 없다. 리뷰/시설 이슈가 없는지 체크리스트로 확인하자.', '가설');
  }
  return out;
}

function riskChecklist(kind, discount) {
  const base = kind === 'hotel'
    ? [
        '예약 확정 메일/문자를 받았는지 (대기·요청 상태가 아닌지)',
        '호텔에 직접 전화해 예약번호 조회되는지',
        '최근 1~2주 리뷰에 공사·소음·시설 고장 언급이 없는지',
        '세금·봉사료·리조트피 포함 총액인지',
        '객실 타입(창문 없음/지하/트윈 여부) 확인',
      ]
    : [
        '항공권 번호(e-ticket) 발급까지 완료됐는지',
        '수하물 포함 여부와 추가 요금 합산',
        '경유/야간 도착 등 불편 조건 확인',
        '공동운항(코드쉐어) 실제 운항사 확인',
      ];
  if (discount >= 0.6) base.unshift('판매처가 오류 요금으로 취소할 수 있으니, 다른 일정은 확정 후에 잡기');
  return base;
}
