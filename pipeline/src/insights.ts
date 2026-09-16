import { loadChannels } from './config.js';
import { credential, graphGet } from './publish/graph.js';
import { listContent, mergeInsights } from './store.js';
import type { ChannelId, InsightRow } from './types.js';

interface MetricValue {
  name: string;
  values?: Array<{ value: number }>;
  total_value?: { value: number };
}

/**
 * 인스타/스레드 성과를 하루 단위 스냅샷으로 누적한다.
 * 조회수는 누적값이므로 같은 콘텐츠를 매일 다시 읽어도 문제없다 (날짜별로 덮어씀).
 * impressions 는 Graph API v22 부터 폐기되어 views 로 대체되었다.
 */
const IG_METRICS = ['views', 'reach', 'likes', 'comments', 'saved', 'shares'] as const;
const TH_METRICS = ['views', 'likes', 'replies', 'reposts', 'quotes'] as const;

export async function collectInsights(opts: { channel?: string } = {}): Promise<InsightRow[]> {
  const date = new Date().toISOString().slice(0, 10);
  const rows: InsightRow[] = [];
  const channels = [...loadChannels().values()].filter(
    (c) => !opts.channel || c.id === opts.channel,
  );

  for (const cfg of channels) {
    const published = listContent({ channel: cfg.id, status: 'published' });
    if (published.length === 0) continue;

    const igFollowers = cfg.targets?.instagram ? await followerCount(cfg.id).catch(() => undefined) : undefined;

    for (const file of published) {
      for (const rec of file.meta.published ?? []) {
        if (!rec.id || rec.error) continue;
        try {
          if (rec.platform === 'instagram') {
            const m = await mediaInsights('graph', 'IG_TOKEN', cfg.id, rec.id, IG_METRICS);
            rows.push({
              date,
              channel: cfg.id,
              platform: 'instagram',
              mediaId: rec.id,
              contentId: file.meta.id,
              format: file.meta.format,
              ...m,
              ...(igFollowers !== undefined ? { followers: igFollowers } : {}),
            });
          } else if (rec.platform === 'threads') {
            const m = await mediaInsights('threads', 'THREADS_TOKEN', cfg.id, rec.id, TH_METRICS);
            rows.push({
              date,
              channel: cfg.id,
              platform: 'threads',
              mediaId: rec.id,
              contentId: file.meta.id,
              format: file.meta.format,
              ...m,
            });
          }
        } catch (err) {
          console.warn(`[insights] ${file.meta.id}/${rec.platform} 수집 실패: ${String(err)}`);
        }
      }
    }
  }

  const added = mergeInsights(rows);
  console.log(`성과 ${rows.length}건 수집 (신규 ${added}건).`);
  return rows;
}

async function mediaInsights(
  host: 'graph' | 'threads',
  tokenPrefix: string,
  channel: ChannelId,
  mediaId: string,
  metrics: readonly string[],
): Promise<Partial<InsightRow>> {
  const token = credential(tokenPrefix, channel);
  const res = await graphGet<{ data?: MetricValue[] }>(
    host,
    `${mediaId}/insights`,
    { metric: metrics.join(',') },
    token,
  );
  const out: Record<string, number> = {};
  for (const m of res.data ?? []) {
    const value = m.total_value?.value ?? m.values?.[0]?.value;
    if (typeof value === 'number') out[m.name] = value;
  }
  return out as Partial<InsightRow>;
}

async function followerCount(channel: ChannelId): Promise<number | undefined> {
  const token = credential('IG_TOKEN', channel);
  const userId = credential('IG_USER_ID', channel);
  const res = await graphGet<{ followers_count?: number }>(
    'graph',
    userId,
    { fields: 'followers_count' },
    token,
  );
  return res.followers_count;
}
