import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { CONTENT_DIR, DATA_DIR, ensureDir } from './config.js';
import type { ChannelId, ContentFile, ContentMeta, Idea, InsightRow } from './types.js';

/* ------------------------------ 콘텐츠 파일 ------------------------------ */

export function contentPath(meta: Pick<ContentMeta, 'channel' | 'id'>): string {
  return path.join(CONTENT_DIR, meta.channel, `${meta.id}.md`);
}

export function writeContent(file: { meta: ContentMeta; body: string }): string {
  const p = contentPath(file.meta);
  ensureDir(path.dirname(p));
  // gray-matter 의 기본 직렬화 대신 YAML 을 직접 써서 키 순서를 안정적으로 유지한다.
  const fm = YAML.stringify(file.meta).trimEnd();
  fs.writeFileSync(p, `---\n${fm}\n---\n\n${file.body.trim()}\n`, 'utf8');
  return p;
}

export function readContent(p: string): ContentFile {
  const parsed = matter(fs.readFileSync(p, 'utf8'));
  return { path: p, meta: parsed.data as ContentMeta, body: parsed.content.trim() };
}

export function listContent(filter: { channel?: ChannelId; status?: ContentMeta['status'] } = {}): ContentFile[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const channels = filter.channel ? [filter.channel] : fs.readdirSync(CONTENT_DIR);
  const out: ContentFile[] = [];
  for (const ch of channels) {
    const dir = path.join(CONTENT_DIR, ch);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      const file = readContent(path.join(dir, f));
      if (filter.status && file.meta.status !== filter.status) continue;
      out.push(file);
    }
  }
  return out.sort((a, b) => (a.meta.publishAt ?? '').localeCompare(b.meta.publishAt ?? ''));
}

export function updateMeta(file: ContentFile, patch: Partial<ContentMeta>): ContentFile {
  const next: ContentFile = { ...file, meta: { ...file.meta, ...patch } };
  writeContent(next);
  return next;
}

/* -------------------------------- 소재 뱅크 ------------------------------- */

const IDEAS_FILE = path.join(DATA_DIR, 'ideas.json');

export function loadIdeas(): Idea[] {
  if (!fs.existsSync(IDEAS_FILE)) return [];
  return JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8')) as Idea[];
}

export function saveIdeas(ideas: Idea[]): void {
  ensureDir(DATA_DIR);
  fs.writeFileSync(IDEAS_FILE, `${JSON.stringify(ideas, null, 2)}\n`, 'utf8');
}

/** 같은 채널 안에서 제목이 겹치는 소재는 버린다. */
export function appendIdeas(fresh: Idea[]): { added: Idea[]; skipped: Idea[] } {
  const existing = loadIdeas();
  const seen = new Set(existing.map((i) => `${i.channel}::${normalize(i.title)}`));
  const added: Idea[] = [];
  const skipped: Idea[] = [];
  for (const idea of fresh) {
    const key = `${idea.channel}::${normalize(idea.title)}`;
    if (seen.has(key)) {
      skipped.push(idea);
      continue;
    }
    seen.add(key);
    added.push(idea);
  }
  if (added.length) saveIdeas([...existing, ...added]);
  return { added, skipped };
}

export function markIdeaUsed(ideaId: string, contentId: string): void {
  const ideas = loadIdeas();
  const target = ideas.find((i) => i.id === ideaId);
  if (!target) return;
  target.usedBy = contentId;
  saveIdeas(ideas);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/* -------------------------------- 성과 데이터 ------------------------------ */

const INSIGHTS_FILE = path.join(DATA_DIR, 'insights.json');

export function loadInsights(): InsightRow[] {
  if (!fs.existsSync(INSIGHTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(INSIGHTS_FILE, 'utf8')) as InsightRow[];
}

/** 같은 (date, platform, mediaId) 는 덮어쓴다 — 매일 재수집해도 중복되지 않게. */
export function mergeInsights(rows: InsightRow[]): number {
  const existing = loadInsights();
  const key = (r: InsightRow) => `${r.date}::${r.platform}::${r.mediaId}`;
  const map = new Map(existing.map((r) => [key(r), r]));
  for (const r of rows) map.set(key(r), r);
  const merged = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  ensureDir(DATA_DIR);
  fs.writeFileSync(INSIGHTS_FILE, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged.length - existing.length;
}
