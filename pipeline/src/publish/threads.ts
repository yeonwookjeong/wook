import { credential, graphGet, graphPost, waitForContainer } from './graph.js';
import { publicUrl } from './instagram.js';
import type { ContentFile, PublishRecord } from '../types.js';

/**
 * Threads 발행. 본인 계정이면 Meta 앱을 development 모드에 두고
 * 해당 계정을 테스터로 넣어 쓰는 것이 전제 — 프로덕션 접근은 별도 심사 대상이다.
 */
export async function publishToThreads(file: ContentFile): Promise<PublishRecord> {
  const ch = file.meta.channel;
  const token = credential('THREADS_TOKEN', ch);
  const userId = credential('THREADS_USER_ID', ch);
  const images = file.meta.images ?? [];
  const text = truncate(file.body.trim(), 500);

  let creationId: string;
  if (images.length <= 1) {
    const res = await graphPost<{ id: string }>(
      'threads',
      `${userId}/threads`,
      images.length === 1
        ? { media_type: 'IMAGE', image_url: publicUrl(images[0]!), text }
        : { media_type: 'TEXT', text },
      token,
    );
    creationId = res.id;
  } else {
    const children: string[] = [];
    for (const rel of images.slice(0, 20)) {
      const item = await graphPost<{ id: string }>(
        'threads',
        `${userId}/threads`,
        { media_type: 'IMAGE', image_url: publicUrl(rel), is_carousel_item: 'true' },
        token,
      );
      children.push(item.id);
    }
    const carousel = await graphPost<{ id: string }>(
      'threads',
      `${userId}/threads`,
      { media_type: 'CAROUSEL', children: children.join(','), text },
      token,
    );
    creationId = carousel.id;
  }

  await waitForContainer('threads', creationId, token);

  const published = await graphPost<{ id: string }>(
    'threads',
    `${userId}/threads_publish`,
    { creation_id: creationId },
    token,
  );

  const info = await graphGet<{ permalink?: string }>(
    'threads',
    published.id,
    { fields: 'permalink' },
    token,
  ).catch(() => ({ permalink: undefined }));

  return {
    platform: 'threads',
    id: published.id,
    ...(info.permalink ? { permalink: info.permalink } : {}),
    at: new Date().toISOString(),
  };
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
