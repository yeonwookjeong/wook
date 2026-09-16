import path from 'node:path';
import { ROOT } from '../config.js';
import { credential, graphGet, graphPost, waitForContainer } from './graph.js';
import type { ContentFile, PublishRecord } from '../types.js';

/**
 * 이미지는 Meta 서버가 직접 내려받으므로 공개 URL 이어야 한다.
 * PUBLIC_ASSET_BASE_URL 아래에 rendered/ 폴더가 그대로 올라가 있어야 한다.
 */
function publicUrl(relPath: string): string {
  const base = process.env.PUBLIC_ASSET_BASE_URL;
  if (!base) {
    throw new Error(
      'PUBLIC_ASSET_BASE_URL 이 없습니다. 인스타 API 는 공개 이미지 URL 을 요구합니다 (README 참고).',
    );
  }
  return `${base.replace(/\/$/, '')}/${relPath.split(path.sep).join('/')}`;
}

export async function publishToInstagram(file: ContentFile): Promise<PublishRecord> {
  const ch = file.meta.channel;
  const token = credential('IG_TOKEN', ch);
  const userId = credential('IG_USER_ID', ch);
  const caption = buildCaption(file);
  const images = file.meta.images ?? [];

  if (images.length === 0) {
    throw new Error(`${file.meta.id}: 렌더된 이미지가 없습니다. 먼저 \`pipe render\` 를 실행하세요.`);
  }
  // 캐러셀 API 상한은 10장 (앱 내 20장과 다름).
  if (images.length > 10) {
    throw new Error(`${file.meta.id}: 캐러셀은 최대 10장입니다 (현재 ${images.length}장).`);
  }

  await assertQuota(userId, token);

  let creationId: string;
  if (images.length === 1) {
    const single = await graphPost<{ id: string }>(
      'graph',
      `${userId}/media`,
      { image_url: publicUrl(images[0]!), caption },
      token,
    );
    creationId = single.id;
  } else {
    const children: string[] = [];
    for (const rel of images) {
      const item = await graphPost<{ id: string }>(
        'graph',
        `${userId}/media`,
        { image_url: publicUrl(rel), is_carousel_item: 'true' },
        token,
      );
      children.push(item.id);
    }
    for (const id of children) await waitForContainer('graph', id, token);

    const carousel = await graphPost<{ id: string }>(
      'graph',
      `${userId}/media`,
      { media_type: 'CAROUSEL', children: children.join(','), caption },
      token,
    );
    creationId = carousel.id;
  }

  await waitForContainer('graph', creationId, token);

  const published = await graphPost<{ id: string }>(
    'graph',
    `${userId}/media_publish`,
    { creation_id: creationId },
    token,
  );

  const info = await graphGet<{ permalink?: string }>(
    'graph',
    published.id,
    { fields: 'permalink' },
    token,
  ).catch(() => ({ permalink: undefined }));

  return {
    platform: 'instagram',
    id: published.id,
    ...(info.permalink ? { permalink: info.permalink } : {}),
    at: new Date().toISOString(),
  };
}

/** 24시간 100건 한도. 남은 게 없으면 시도 자체를 하지 않는다. */
async function assertQuota(userId: string, token: string): Promise<void> {
  try {
    const res = await graphGet<{ data?: Array<{ quota_usage: number; config?: { quota_total: number } }> }>(
      'graph',
      `${userId}/content_publishing_limit`,
      { fields: 'config,quota_usage' },
      token,
    );
    const row = res.data?.[0];
    if (!row) return;
    const total = row.config?.quota_total ?? 100;
    if (row.quota_usage >= total) {
      throw new Error(`인스타 발행 한도 소진 (${row.quota_usage}/${total}). 24시간 뒤 재시도.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('한도 소진')) throw err;
    // 한도 조회 실패는 발행을 막을 이유가 아니다.
  }
}

export function buildCaption(file: ContentFile): string {
  const tags = file.meta.hashtags ?? [];
  const body = file.body.trim();
  return tags.length ? `${body}\n\n${tags.join(' ')}` : body;
}

export { publicUrl };
