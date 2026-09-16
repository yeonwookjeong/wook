import { z } from 'zod';
import { getChannel, loadPrompt } from './config.js';
import { parseJson, research } from './claude.js';
import { performanceBrief } from './perf.js';
import { appendIdeas, loadIdeas } from './store.js';
import type { ChannelConfig, Idea } from './types.js';

const IdeaDraft = z.object({
  title: z.string().describe('소재 제목. 훅이 아니라 식별용 제목.'),
  angle: z.string().describe('왜 이게 이 채널에 맞는지 한 줄'),
  facts: z
    .array(
      z.object({
        claim: z.string().describe('본문에 쓸 구체적 사실. 연도/숫자/고유명사를 포함할 것.'),
        source: z.string().describe('출처 URL 또는 출처명. 없으면 빈 문자열.'),
        confidence: z.enum(['high', 'medium', 'low']),
      }),
    )
    .describe('초안이 근거로 쓸 사실 목록. 3~7개.'),
  place_name: z.string().describe('장소명. 장소 기반 소재가 아니면 빈 문자열.'),
  place_district: z.string().describe('자치구/동. 없으면 빈 문자열.'),
  japan_related: z.boolean().describe('일본 관련 소재면 true (일본어 스레드 교차 공유 후보)'),
});

const IdeaBatch = z.object({ ideas: z.array(IdeaDraft) });

export async function generateIdeas(channelId: string, count: number): Promise<Idea[]> {
  const cfg = getChannel(channelId);
  const existing = loadIdeas().filter((i) => i.channel === cfg.id);
  const notes = cfg.research?.enabled ? await runResearch(cfg, count, existing) : assistBrief(cfg);

  const batch = await parseJson(
    IdeaBatch,
    [
      channelBrief(cfg),
      performanceBrief(cfg.id),
      existing.length
        ? `## 이미 뱅크에 있는 소재 (중복 금지)\n${existing.map((i) => `- ${i.title}`).join('\n')}`
        : '',
      '## 리서치 원문',
      notes,
      '',
      `위 리서치를 근거로 "${cfg.name}" 채널용 소재 ${count}개를 뽑아주세요.`,
      'facts 의 claim 은 리서치 원문에 실제로 등장한 내용만 씁니다. 추측은 confidence: low 로 표시하세요.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    { system: loadPrompt('ideas') || undefined, maxTokens: 20000 },
  );

  const now = new Date().toISOString();
  const stamp = now.slice(0, 10).replace(/-/g, '');
  return batch.ideas.slice(0, count).map((d, i) => ({
    id: `${cfg.id}-${stamp}-${String(i + 1).padStart(2, '0')}`,
    channel: cfg.id,
    title: d.title,
    angle: d.angle,
    facts: d.facts.map((f) => ({
      claim: f.claim,
      ...(f.source ? { source: f.source } : {}),
      confidence: f.confidence,
    })),
    ...(d.place_name
      ? { place: { name: d.place_name, ...(d.place_district ? { district: d.place_district } : {}) } }
      : {}),
    japan_related: d.japan_related,
    createdAt: now,
  }));
}

export async function refillBank(channelId: string, count: number) {
  const fresh = await generateIdeas(channelId, count);
  return appendIdeas(fresh);
}

/* ------------------------------- 내부 헬퍼 ------------------------------- */

async function runResearch(cfg: ChannelConfig, count: number, existing: Idea[]): Promise<string> {
  const hints = cfg.research?.query_hints ?? [];
  const prompt = [
    channelBrief(cfg),
    existing.length ? `이미 다룬 소재(제외): ${existing.map((i) => i.title).join(', ')}` : '',
    '',
    `웹 검색으로 이 채널에 쓸 소재 후보를 ${count + 3}개 찾아 정리하세요.`,
    hints.length ? `검색 방향 힌트: ${hints.join(' / ')}` : '',
    '',
    '각 후보마다 다음을 포함하세요:',
    '- 소재명',
    '- 핵심 사실 3~7개 (연도, 숫자, 고유명사 포함)',
    '- 각 사실의 출처 URL',
    '- 시의성 (지금 다룰 이유가 있는지, 기간 한정이면 정확한 날짜)',
    '',
    '확인되지 않은 내용은 "미확인" 이라고 명시하세요. 지어내지 마세요.',
  ]
    .filter(Boolean)
    .join('\n');

  return research(prompt, { maxUses: Math.min(12, count + 4) });
}

/** assist 트랙(만타/색보정/스레드)은 웹 리서치가 아니라 보유 자산·성과 기반으로 뽑는다. */
function assistBrief(cfg: ChannelConfig): string {
  return [
    '이 채널은 실제 촬영본이 있어야 콘텐츠가 됩니다. 웹 리서치가 아니라',
    '보유한 소재·과거 성과·시리즈 구조에서 다음에 만들 것을 제안하세요.',
    cfg.series?.length
      ? `검증된 시리즈: ${cfg.series.map((s) => `${s.name}(${s.note ?? ''})`).join(' / ')}`
      : '',
    cfg.source_hints?.length ? `소스 힌트: ${cfg.source_hints.join(' / ')}` : '',
    cfg.performance_baseline ? `성과 베이스라인: ${JSON.stringify(cfg.performance_baseline)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function channelBrief(cfg: ChannelConfig): string {
  const lines = [
    `## 채널: ${cfg.name} (${cfg.id})`,
    `- 언어: ${cfg.language}`,
    `- 포지셔닝: ${cfg.positioning ?? ''}`,
    `- 바이오: ${cfg.bio ?? ''}`,
    `- 톤: ${cfg.tone.voice}`,
  ];
  if (cfg.tone.rules?.length) lines.push(`- 규칙:\n${cfg.tone.rules.map((r) => `  - ${r}`).join('\n')}`);
  if (cfg.tone.banned_phrases?.length) {
    lines.push(`- 금지 표현: ${cfg.tone.banned_phrases.join(', ')}`);
  }
  if (cfg.owner) lines.push(`- 운영: ${cfg.owner}`);
  return lines.join('\n');
}
