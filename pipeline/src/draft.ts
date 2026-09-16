import fs from 'node:fs';
import { z } from 'zod';
import { defaultFormat, formatSpec, getChannel, loadPrompt } from './config.js';
import { parseJson } from './claude.js';
import { channelBrief } from './ideas.js';
import { performanceBrief } from './perf.js';
import { nextFreeSlot } from './schedule.js';
import { listContent, loadIdeas, markIdeaUsed, writeContent } from './store.js';
import type { ChannelConfig, ContentMeta, FormatSpec, Idea } from './types.js';

const SlideDeck = z.object({
  title: z.string().describe('내부 식별용 제목 (슬라이드에 그대로 쓰이지 않음)'),
  slides: z.array(
    z.object({
      role: z.string().describe('포맷 구조에서 정의된 역할 (hook/context/insight/item 등)'),
      heading: z.string().describe('슬라이드 상단 볼드 소제목. 짧게.'),
      body: z.string().describe('슬라이드 본문'),
      keyword: z.string().describe('강조할 연도/숫자/고유명사. 없으면 빈 문자열.'),
    }),
  ),
  caption: z.string().describe('인스타 캡션 본문. 해시태그 제외.'),
  hashtags: z.array(z.string()).describe('# 포함. 채널 기본 태그 + 소재별 태그.'),
});

const Longform = z.object({
  title: z.string().describe('검색 유입을 고려한 블로그 제목'),
  body: z.string().describe('마크다운 본문. 소제목은 ###. 사진 자리는 [PHOTO:n].'),
  tags: z.array(z.string()).describe('네이버 태그. # 없이 단어만.'),
});

const ReelsScript = z.object({
  title: z.string(),
  narration: z.string().describe('내레이션 스크립트. 읽는 그대로. 문장마다 줄바꿈.'),
  overlays: z.array(z.string()).describe('영상 위에 올릴 타이포 문구. 영문 소문자 시적 단문.'),
  shot_list: z.array(z.string()).describe('필요한 컷 목록 — 사람이 촬영본에서 찾아야 할 것'),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

export interface DraftOptions {
  channel: string;
  ideaId?: string;
  format?: string;
  publishAt?: string;
  /**
   * 여행 메모 파일 경로. 네이버 롱폼처럼 본인 경험이 원재료인 글에 쓴다.
   * 메모가 있으면 소재 뱅크 없이도 초안을 만들 수 있다.
   */
  notesPath?: string;
}

export async function createDraft(opts: DraftOptions): Promise<{ path: string; meta: ContentMeta }> {
  const cfg = getChannel(opts.channel);
  const format = opts.format ?? defaultFormat(cfg);
  const spec = formatSpec(cfg, format);
  const notes = opts.notesPath ? readNotes(opts.notesPath) : undefined;
  // 메모가 있으면 그것이 원재료다. 없을 때만 소재 뱅크에서 꺼낸다.
  const idea = notes && !opts.ideaId ? undefined : pickIdea(cfg, opts.ideaId);

  const publishAt =
    opts.publishAt ??
    nextFreeSlot(
      cfg,
      listContent({ channel: cfg.id })
        .map((c) => c.meta.publishAt)
        .filter((v): v is string => Boolean(v)),
    ) ??
    undefined;

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = `${cfg.id}-${stamp}-${slugify(idea?.title ?? notes?.title ?? format)}`;
  const base = {
    id,
    channel: cfg.id,
    track: cfg.track,
    status: 'draft' as const,
    format,
    ...(publishAt ? { publishAt } : {}),
    ...(idea ? { ideaId: idea.id } : {}),
    ...(idea?.place ? { place: idea.place } : {}),
    createdAt: new Date().toISOString(),
  };

  const prompt = buildPrompt(cfg, spec, idea, notes?.text);
  const system = loadPrompt(cfg.id) || undefined;

  let meta: ContentMeta;
  let body: string;

  if (cfg.id === 'naver') {
    const out = await parseJson(Longform, prompt, { system, maxTokens: 24000 });
    meta = { ...base, title: out.title, hashtags: out.tags };
    body = out.body;
  } else if (format === 'reels') {
    const out = await parseJson(ReelsScript, prompt, { system, maxTokens: 16000 });
    meta = { ...base, title: out.title, hashtags: out.hashtags, assets: out.shot_list };
    body = [
      '## 내레이션',
      out.narration,
      '',
      '## 타이포 오버레이',
      ...out.overlays.map((o) => `- ${o}`),
      '',
      '## 필요한 컷',
      ...out.shot_list.map((s) => `- [ ] ${s}`),
      '',
      '## 캡션',
      out.caption,
    ].join('\n');
  } else {
    const out = await parseJson(SlideDeck, prompt, { system, maxTokens: 16000 });
    meta = {
      ...base,
      title: out.title,
      slides: out.slides.map((s) => ({
        role: s.role,
        heading: s.heading,
        body: s.body,
        ...(s.keyword ? { keyword: s.keyword } : {}),
      })),
      hashtags: out.hashtags,
    };
    body = out.caption;
  }

  const path = writeContent({ meta, body });
  if (idea) markIdeaUsed(idea.id, id);
  return { path, meta };
}

/* ------------------------------- 내부 헬퍼 ------------------------------- */

function pickIdea(cfg: ChannelConfig, ideaId?: string): Idea | undefined {
  const ideas = loadIdeas().filter((i) => i.channel === cfg.id);
  if (ideaId) {
    const found = ideas.find((i) => i.id === ideaId);
    if (!found) throw new Error(`소재 "${ideaId}" 를 찾을 수 없습니다. \`pipe ideas:list\` 로 확인하세요.`);
    return found;
  }
  const unused = ideas.find((i) => !i.usedBy);
  if (!unused) {
    throw new Error(
      `채널 ${cfg.id} 의 미사용 소재가 없습니다. 먼저 \`pipe ideas --channel ${cfg.id}\` 를 실행하세요.`,
    );
  }
  return unused;
}

function buildPrompt(
  cfg: ChannelConfig,
  spec: FormatSpec,
  idea?: Idea,
  notes?: string,
): string {
  const parts = [channelBrief(cfg), performanceBrief(cfg.id), formatBrief(spec)];

  if (notes) {
    parts.push(
      [
        '## 여행 메모 (원재료)',
        notes,
        '',
        '이 메모가 글의 사실 관계 전부입니다. 메모에 없는 장소·가격·시간을 채워 넣지 마세요.',
        '메모가 단편적이면 문장으로 잇되, 없는 사건을 만들지는 마세요.',
      ].join('\n'),
    );
  }

  if (idea) {
    parts.push(
      [
        '## 이번 소재',
        `제목: ${idea.title}`,
        `앵글: ${idea.angle}`,
        '근거 사실:',
        ...idea.facts.map(
          (f) => `- [${f.confidence}] ${f.claim}${f.source ? ` (출처: ${f.source})` : ''}`,
        ),
        '',
        'confidence 가 low 인 사실은 본문에서 단정하지 말고, 빼거나 완화해서 쓰세요.',
      ].join('\n'),
    );
  }

  parts.push(
    [
      '위 소재로 이 채널의 콘텐츠를 작성하세요.',
      '- 채널 톤 규칙과 금지 표현을 반드시 지킬 것.',
      '- 근거 사실에 없는 숫자·연도·가격을 만들어내지 말 것.',
      '- 포맷 구조에 정의된 역할 순서를 그대로 따를 것.',
    ].join('\n'),
  );

  return parts.filter(Boolean).join('\n\n');
}

function formatBrief(spec: FormatSpec): string {
  const lines = [`## 포맷: ${spec.name ?? spec.id}`];
  if (spec.note) lines.push(`- ${spec.note}`);
  if (spec.slides) lines.push(`- 슬라이드 ${spec.slides.min}~${spec.slides.max}장`);
  if (spec.length) lines.push(`- 본문 ${spec.length.min_chars}~${spec.length.max_chars}자`);
  if (spec.duration_sec) lines.push(`- 길이 ${spec.duration_sec.min}~${spec.duration_sec.max}초`);
  if (spec.structure?.length) {
    lines.push('- 구조:');
    for (const s of spec.structure) {
      lines.push(`  - ${s.role} ×${s.count}${s.note ? `: ${s.note}` : ''}`);
    }
  }
  return lines.join('\n');
}

function readNotes(p: string): { title: string; text: string } {
  if (!fs.existsSync(p)) throw new Error(`메모 파일을 찾을 수 없습니다: ${p}`);
  const text = fs.readFileSync(p, 'utf8').trim();
  if (!text) throw new Error(`메모 파일이 비어 있습니다: ${p}`);
  const firstHeading = /^#{1,6}\s+(.+)$/m.exec(text)?.[1];
  return { title: firstHeading ?? text.split('\n')[0]!.slice(0, 40), text };
}

function slugify(s: string): string {
  const cleaned = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || 'untitled';
}
