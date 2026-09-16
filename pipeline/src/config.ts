import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { ChannelConfig, ChannelId } from './types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');
export const CHANNELS_DIR = path.join(ROOT, 'channels');
export const PROMPTS_DIR = path.join(ROOT, 'prompts');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const DATA_DIR = path.join(ROOT, 'data');

let cache: Map<ChannelId, ChannelConfig> | null = null;

export function loadChannels(): Map<ChannelId, ChannelConfig> {
  if (cache) return cache;
  const map = new Map<ChannelId, ChannelConfig>();
  for (const file of fs.readdirSync(CHANNELS_DIR)) {
    if (!file.endsWith('.yaml')) continue;
    const raw = fs.readFileSync(path.join(CHANNELS_DIR, file), 'utf8');
    const cfg = YAML.parse(raw) as ChannelConfig;
    const expected = file.replace(/\.yaml$/, '');
    if (cfg.id !== expected) {
      throw new Error(`channels/${file}: id "${cfg.id}" 가 파일명 "${expected}" 과 다릅니다.`);
    }
    map.set(cfg.id, cfg);
  }
  cache = map;
  return map;
}

export function getChannel(id: string): ChannelConfig {
  const cfg = loadChannels().get(id as ChannelId);
  if (!cfg) {
    const known = [...loadChannels().keys()].join(', ');
    throw new Error(`알 수 없는 채널: "${id}". 사용 가능: ${known}`);
  }
  return cfg;
}

export function defaultFormat(cfg: ChannelConfig): string {
  return (cfg.formats.find((f) => f.default) ?? cfg.formats[0])!.id;
}

export function formatSpec(cfg: ChannelConfig, formatId: string) {
  const spec = cfg.formats.find((f) => f.id === formatId);
  if (!spec) {
    throw new Error(
      `채널 ${cfg.id} 에 "${formatId}" 포맷이 없습니다. 사용 가능: ${cfg.formats.map((f) => f.id).join(', ')}`,
    );
  }
  return spec;
}

/** 프롬프트 파일을 읽는다. 없으면 빈 문자열 (채널 설정만으로도 동작하도록). */
export function loadPrompt(id: string): string {
  const p = path.join(PROMPTS_DIR, `${id}.md`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
