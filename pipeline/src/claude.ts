import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

export const MODEL = 'claude-opus-5';

let _client: Anthropic | null = null;
export function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      // SDK 는 `ant auth login` 프로필도 읽으므로 키가 없다고 바로 실패시키지 않는다.
      console.warn('[claude] ANTHROPIC_API_KEY 미설정 — 저장된 인증 프로필을 시도합니다.');
    }
    _client = new Anthropic();
  }
  return _client;
}

/** API 에러를 사람이 읽을 수 있는 메시지로 바꾼다. */
export function explainError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'Anthropic 인증 실패 — ANTHROPIC_API_KEY 를 확인하세요.';
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Anthropic 레이트 리밋 — 잠시 후 다시 실행하세요.';
  }
  if (err instanceof Anthropic.BadRequestError) {
    return `요청이 거부되었습니다: ${err.message}`;
  }
  if (err instanceof Anthropic.APIError) {
    return `Anthropic API 오류 ${err.status}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * 웹 검색을 붙여 자유 서술 리서치를 돌린다.
 * 서버 도구 턴은 pause_turn 으로 끊길 수 있으므로 직접 이어붙인다.
 */
export async function research(
  prompt: string,
  opts: { system?: string; maxUses?: number; maxRounds?: number } = {},
): Promise<string> {
  const { system, maxUses = 8, maxRounds = 6 } = opts;
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  const out: string[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const res = await client().messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      ...(system ? { system } : {}),
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses }],
      messages,
    });

    if (res.stop_reason === 'refusal') {
      throw new Error(`요청이 거절되었습니다 (${res.stop_details?.category ?? 'unknown'}).`);
    }
    for (const block of res.content) {
      if (block.type === 'text') out.push(block.text);
    }
    if (res.stop_reason !== 'pause_turn') break;

    // 서버 도구가 길어져 멈춘 경우: 그대로 되돌려주면 이어서 진행한다.
    messages.push({ role: 'assistant', content: res.content });
  }

  const text = out.join('\n').trim();
  if (!text) throw new Error('리서치 결과가 비어 있습니다.');
  return text;
}

/** 스키마에 맞춘 JSON 을 받아온다. 파싱 실패 시 예외. */
export async function parseJson<S extends z.ZodType>(
  schema: S,
  prompt: string,
  opts: { system?: string; maxTokens?: number } = {},
): Promise<z.infer<S>> {
  const res = await client().messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    thinking: { type: 'adaptive' },
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: zodOutputFormat(schema) },
  });

  if (res.stop_reason === 'refusal') {
    throw new Error(`요청이 거절되었습니다 (${res.stop_details?.category ?? 'unknown'}).`);
  }
  if (res.stop_reason === 'max_tokens') {
    throw new Error('응답이 max_tokens 에서 잘렸습니다. maxTokens 를 올리세요.');
  }
  if (!res.parsed_output) {
    throw new Error('구조화 출력 파싱에 실패했습니다.');
  }
  return res.parsed_output as z.infer<S>;
}
