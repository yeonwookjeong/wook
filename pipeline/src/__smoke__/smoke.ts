import { getChannel } from '../config.js';
import { nextFreeSlot, isDue } from '../schedule.js';
import { writeContent } from '../store.js';
import { renderContent } from '../render.js';

const toryvel = getChannel('toryvel');
const first = nextFreeSlot(toryvel, [], new Date('2026-09-16T03:00:00Z'))!; // KST 12:00 수요일
const second = nextFreeSlot(toryvel, [first], new Date('2026-09-16T03:00:00Z'))!;
console.log('다음 슬롯 :', first, '(토리블 TUE/FRI 19:30 KST)');
console.log('그 다음   :', second);
console.log('isDue 과거:', isDue('2026-01-01T00:00:00+09:00'), '/ 미래:', isDue(first));

const meta = {
  id: 'toryvel-smoke',
  channel: 'toryvel' as const,
  track: 'auto' as const,
  status: 'draft' as const,
  format: 'carousel',
  title: '에펠탑은 원래 철거 예정이었다',
  publishAt: first,
  slides: [
    { role: 'hook', heading: '파리 시민들은 이걸 흉물이라 불렀다', body: '1887년, 예술가 300명이 건설 반대 청원에 서명했다.', keyword: '1887' },
    { role: 'context', heading: '20년 뒤 철거가 조건이었다', body: '만국박람회용 임시 구조물이었고, 계약상 1909년에 해체될 예정이었다.', keyword: '1909' },
    { role: 'insight', heading: '살아남은 이유는 낭만이 아니었다', body: '무선 전신 안테나로 쓸모가 생기면서 철거를 면했다.', keyword: '무선전신' },
  ],
  hashtags: ['#토리블', '#파리'],
  createdAt: new Date().toISOString(),
};

const p = writeContent({ meta, body: '테스트 캡션입니다.' });
console.log('콘텐츠 파일:', p);
const images = await renderContent(p);
console.log('렌더된 이미지:', images);

// 스모크 산출물은 남기지 않는다.
const { rmSync } = await import('node:fs');
rmSync(new URL('../../content/toryvel', import.meta.url), { recursive: true, force: true });
rmSync(new URL('../../rendered/toryvel-smoke', import.meta.url), { recursive: true, force: true });
console.log('정리 완료.');
