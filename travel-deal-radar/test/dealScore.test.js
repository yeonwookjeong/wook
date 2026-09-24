import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayType, addDays } from '../src/core/calendar.js';
import { analyzeDeal, analyzeQuick, gradeOf, quantile } from '../src/core/dealScore.js';
import { loadSampleWatchlist, SAMPLE_TODAY } from '../src/data/sample.js';

test('dayType: 추석 전날 밤은 연휴, 금요일 밤은 주말, 수요일 밤은 평일', () => {
  assert.equal(dayType('2026-09-24'), 'peak');
  assert.equal(dayType('2026-10-16'), 'weekend'); // 금
  assert.equal(dayType('2026-10-14'), 'weekday'); // 수
});

test('quantile / gradeOf 경계값', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(gradeOf(0.15).id, 'good');
  assert.equal(gradeOf(0.25).id, 'great');
  assert.equal(gradeOf(0.4).id, 'steal');
  assert.equal(gradeOf(-0.2).id, 'high');
});

test('같은 날짜 유형끼리만 비교한다 (평일 가격이 주말 기준을 끌어내리지 않음)', () => {
  const history = [];
  for (let i = 1; i <= 120; i++) {
    const date = addDays('2026-09-01', -i);
    history.push({ date, price: dayType(date) === 'weekday' ? 100000 : 200000 });
  }
  const r = analyzeDeal({ kind: 'hotel', history, offer: { date: '2026-09-04', price: 150000 }, today: '2026-09-01' }); // 금요일
  assert.equal(r.dayType, 'weekend');
  assert.equal(r.baseline, 200000);
  assert.equal(r.grade.id, 'great');
});

test('사용자 사례: 추석 연휴 당일 5.8만원 → 역대급 + 막판재고/명절역수요/환불불가', () => {
  const bomun = loadSampleWatchlist().find((x) => x.id === 'h-bomun');
  const r = analyzeDeal({ kind: 'hotel', history: bomun.history, offer: bomun.offer, today: SAMPLE_TODAY, recentQuotes: bomun.recentQuotes });
  assert.equal(r.grade.id, 'steal');
  const codes = r.reasons.map((x) => x.code);
  for (const c of ['last-minute', 'holiday-dip', 'non-refundable', 'anomaly']) assert.ok(codes.includes(c), c);
  assert.ok(r.checklist.length > 0);
});

test('평소 수준 가격엔 이유/체크리스트를 붙이지 않는다', () => {
  const r = analyzeQuick({ price: 145000, usualPrice: 150000 });
  assert.equal(r.grade.id, 'typical');
  assert.deepEqual(r.reasons, []);
  assert.deepEqual(r.checklist, []);
});

test('잘못된 입력은 명확한 에러', () => {
  assert.throws(() => analyzeQuick({ price: 0, usualPrice: 100 }), /가격/);
  assert.throws(() => analyzeDeal({ kind: 'hotel', history: [], offer: { date: '2026-01-01', price: 1 }, today: '2026-01-01' }), /history/);
});
