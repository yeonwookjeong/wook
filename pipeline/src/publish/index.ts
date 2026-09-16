import { getChannel } from '../config.js';
import { isDue } from '../schedule.js';
import { listContent, readContent, updateMeta } from '../store.js';
import { publishToInstagram } from './instagram.js';
import { publishToThreads } from './threads.js';
import { publishToNaver } from './naver.js';
import type { ContentFile, PublishRecord } from '../types.js';

export interface PublishOptions {
  channel?: string;
  dryRun?: boolean;
  /**
   * 기본값(false)은 `approved` 만 올린다.
   * CI 에서는 true 로 둔다 — 기본 브랜치에 올라온 draft 는 PR 이 머지된 것이므로 승인과 같다.
   */
  includeDrafts?: boolean;
}

export interface PublishResult {
  contentId: string;
  records: PublishRecord[];
  ok: boolean;
}

/** 발행 시각이 지난 approved 콘텐츠를 모두 올린다. */
export async function publishDue(opts: PublishOptions = {}): Promise<PublishResult[]> {
  const allowed = opts.includeDrafts ? ['approved', 'draft'] : ['approved'];
  const candidates = listContent(opts.channel ? { channel: getChannel(opts.channel).id } : {})
    .filter((c) => allowed.includes(c.meta.status))
    .filter((c) => isDue(c.meta.publishAt))
    // 슬라이드형인데 아직 렌더되지 않았다면 올리지 않는다.
    .filter((c) => !c.meta.slides?.length || (c.meta.images?.length ?? 0) > 0);

  const results: PublishResult[] = [];
  for (const file of candidates) {
    if (opts.dryRun) {
      console.log(`[dry-run] ${file.meta.id} → ${targetsOf(file).join(', ')} (${file.meta.publishAt})`);
      results.push({ contentId: file.meta.id, records: [], ok: true });
      continue;
    }
    results.push(await publishOne(file.path));
  }
  return results;
}

export async function publishOne(contentPath: string): Promise<PublishResult> {
  let file = readContent(contentPath);
  const cfg = getChannel(file.meta.channel);
  const records: PublishRecord[] = [...(file.meta.published ?? [])];
  let ok = true;

  for (const target of targetsOf(file)) {
    // 이미 성공한 대상은 다시 올리지 않는다 (재실행 안전).
    if (records.some((r) => r.platform === target && r.id && !r.error)) continue;
    try {
      const record =
        target === 'instagram'
          ? await publishToInstagram(file)
          : target === 'threads'
            ? await publishToThreads(file)
            : await publishToNaver(file, { mode: cfg.publish.mode ?? 'draft' });
      records.push(record);
      console.log(`✓ ${file.meta.id} → ${target}${record.permalink ? ` ${record.permalink}` : ''}`);
    } catch (err) {
      ok = false;
      const message = err instanceof Error ? err.message : String(err);
      records.push({ platform: target, at: new Date().toISOString(), error: message });
      console.error(`✗ ${file.meta.id} → ${target}: ${message}`);
    }
  }

  file = updateMeta(file, { published: records, status: ok ? 'published' : 'failed' });
  return { contentId: file.meta.id, records, ok };
}

function targetsOf(file: ContentFile): PublishRecord['platform'][] {
  const cfg = getChannel(file.meta.channel);
  const out: PublishRecord['platform'][] = [];
  if (cfg.targets?.instagram) out.push('instagram');
  if (cfg.targets?.threads) out.push('threads');
  if (cfg.targets?.naver_blog_id) out.push('naver');
  return out;
}
