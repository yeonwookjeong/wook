import { loadInsights } from './store.js';
import type { ChannelId } from './types.js';

/**
 * 프롬프트에 주입할 성과 요약. 데이터가 없으면 채널 설정의 baseline 만 쓰도록 빈 문자열을 돌려준다.
 * "무엇이 실제로 먹혔는가" 를 시스템이 기억하게 하는 지점.
 */
export function performanceBrief(channel: ChannelId, opts: { days?: number } = {}): string {
  const days = opts.days ?? 90;
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const rows = loadInsights().filter((r) => r.channel === channel && r.date >= since);
  if (rows.length === 0) return '';

  // 콘텐츠별 최신 스냅샷만 남긴다 (조회수는 누적이므로 마지막 값이 최종값).
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const prev = latest.get(r.mediaId);
    if (!prev || r.date > prev.date) latest.set(r.mediaId, r);
  }

  const byFormat = new Map<string, { n: number; views: number; saved: number }>();
  for (const r of latest.values()) {
    const k = r.format ?? 'unknown';
    const agg = byFormat.get(k) ?? { n: 0, views: 0, saved: 0 };
    agg.n += 1;
    agg.views += r.views ?? 0;
    agg.saved += r.saved ?? 0;
    byFormat.set(k, agg);
  }

  const lines = [...byFormat.entries()]
    .map(([fmt, a]) => ({ fmt, avg: Math.round(a.views / a.n), saves: Math.round(a.saved / a.n), n: a.n }))
    .sort((a, b) => b.avg - a.avg)
    .map((x) => `- ${x.fmt}: 평균 조회 ${x.avg.toLocaleString()} / 평균 저장 ${x.saves} (${x.n}편)`);

  const top = [...latest.values()]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 3)
    .map((r) => `- ${r.contentId ?? r.mediaId}: ${(r.views ?? 0).toLocaleString()}회`);

  return [
    `## 최근 ${days}일 성과 (이 채널)`,
    '### 포맷별',
    ...lines,
    '### 상위 콘텐츠',
    ...top,
    '',
    '위 데이터에서 잘 통한 패턴을 우선하고, 하위 포맷은 반복하지 마세요.',
  ].join('\n');
}
