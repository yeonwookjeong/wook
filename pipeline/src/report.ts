import { loadChannels } from './config.js';
import { listContent, loadIdeas, loadInsights } from './store.js';
import type { ChannelId, InsightRow } from './types.js';

/** 주간 리포트 마크다운. GitHub 이슈 본문으로 그대로 쓴다. */
export function weeklyReport(opts: { days?: number } = {}): string {
  const days = opts.days ?? 7;
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const insights = loadInsights();
  const ideas = loadIdeas();
  const lines: string[] = [`# 주간 리포트 (${since} ~ ${new Date().toISOString().slice(0, 10)})`, ''];

  for (const cfg of loadChannels().values()) {
    const content = listContent({ channel: cfg.id });
    const published = content.filter((c) => c.meta.status === 'published');
    const drafts = content.filter((c) => c.meta.status === 'draft');
    const approved = content.filter((c) => c.meta.status === 'approved');
    const bank = ideas.filter((i) => i.channel === cfg.id && !i.usedBy);

    lines.push(`## ${cfg.name} \`${cfg.track}\``);
    lines.push(
      `- 대기: 소재 ${bank.length} / 초안 ${drafts.length} / 발행대기 ${approved.length} / 누적발행 ${published.length}`,
    );

    if (bank.length <= 2) lines.push(`- ⚠️ 소재 뱅크 고갈 임박 — \`pipe ideas --channel ${cfg.id}\` 필요`);

    const recent = latestPerMedia(insights.filter((r) => r.channel === cfg.id && r.date >= since));
    if (recent.length) {
      const byFormat = new Map<string, { n: number; views: number }>();
      for (const r of recent) {
        const k = r.format ?? 'unknown';
        const agg = byFormat.get(k) ?? { n: 0, views: 0 };
        agg.n += 1;
        agg.views += r.views ?? 0;
        byFormat.set(k, agg);
      }
      lines.push('', '| 포맷 | 편수 | 평균 조회 |', '|---|---:|---:|');
      for (const [fmt, a] of [...byFormat].sort((x, y) => y[1].views / y[1].n - x[1].views / x[1].n)) {
        lines.push(`| ${fmt} | ${a.n} | ${Math.round(a.views / a.n).toLocaleString()} |`);
      }

      const top = recent.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 3);
      lines.push('', '최고 성과:');
      for (const r of top) {
        lines.push(`- \`${r.contentId ?? r.mediaId}\` — ${(r.views ?? 0).toLocaleString()}회 (${r.platform})`);
      }
    } else {
      lines.push('- 이번 주 성과 데이터 없음');
    }
    lines.push('');
  }

  const jp = ideas.filter((i) => i.japan_related && !i.usedBy);
  if (jp.length) {
    lines.push('## 일본어 스레드 교차 공유 후보', ...jp.map((i) => `- ${i.title} (${i.channel})`), '');
  }

  return lines.join('\n');
}

function latestPerMedia(rows: InsightRow[]): InsightRow[] {
  const map = new Map<string, InsightRow>();
  for (const r of rows) {
    const prev = map.get(r.mediaId);
    if (!prev || r.date > prev.date) map.set(r.mediaId, r);
  }
  return [...map.values()];
}

export function channelStatus(): string {
  const lines = ['| 채널 | 트랙 | 소재 | 초안 | 발행대기 | 발행 |', '|---|---|---:|---:|---:|---:|'];
  const ideas = loadIdeas();
  for (const cfg of loadChannels().values()) {
    const c = listContent({ channel: cfg.id as ChannelId });
    const count = (s: string) => c.filter((x) => x.meta.status === s).length;
    lines.push(
      `| ${cfg.name} | ${cfg.track} | ${ideas.filter((i) => i.channel === cfg.id && !i.usedBy).length} | ${count('draft')} | ${count('approved')} | ${count('published')} |`,
    );
  }
  return lines.join('\n');
}
