import fs from 'node:fs';
import path from 'node:path';
import { launch } from './browser.js';
import { ROOT, ensureDir, getChannel } from './config.js';
import { readContent, updateMeta } from './store.js';
import type { ChannelConfig, ContentFile, Slide } from './types.js';

export const RENDER_DIR = path.join(ROOT, 'rendered');

const SIZES: Record<string, { width: number; height: number }> = {
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};

/** 콘텐츠의 슬라이드를 PNG 로 렌더하고 meta.images 를 갱신한다. */
export async function renderContent(contentPath: string): Promise<string[]> {
  const file = readContent(contentPath);
  const cfg = getChannel(file.meta.channel);
  const slides = file.meta.slides ?? [];
  if (slides.length === 0) {
    throw new Error(`${file.meta.id}: 렌더할 슬라이드가 없습니다 (format=${file.meta.format}).`);
  }

  const ratio = cfg.formats.find((f) => f.id === file.meta.format)?.ratio ?? '4:5';
  const size = SIZES[ratio] ?? SIZES['4:5']!;
  const outDir = path.join(RENDER_DIR, file.meta.id);
  ensureDir(outDir);

  const browser = await launch();
  const rel: string[] = [];
  try {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    for (const [i, slide] of slides.entries()) {
      await page.setContent(slideHtml(cfg, slide, i + 1, slides.length, size), {
        waitUntil: 'networkidle',
      });
      const out = path.join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: out, type: 'png' });
      rel.push(path.relative(ROOT, out));
    }
  } finally {
    await browser.close();
  }

  updateMeta(file, { images: rel });
  return rel;
}

export async function renderAll(files: ContentFile[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  for (const f of files) {
    if (!f.meta.slides?.length) continue;
    result.set(f.meta.id, await renderContent(f.path));
  }
  return result;
}

function slideHtml(
  cfg: ChannelConfig,
  slide: Slide,
  index: number,
  total: number,
  size: { width: number; height: number },
): string {
  const t = cfg.theme ?? { bg: '#111', fg: '#fff', accent: '#c8a04a', font: 'sans-serif' };
  const isHook = index === 1;
  return `<!doctype html>
<html lang="${cfg.language}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size.width}px; height: ${size.height}px; }
  body {
    background: ${t.bg}; color: ${t.fg};
    font-family: ${t.font}, 'Noto Sans KR', sans-serif;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 96px 88px; -webkit-font-smoothing: antialiased;
  }
  .keyword { font-size: ${isHook ? 132 : 96}px; font-weight: 700; color: ${t.accent};
             letter-spacing: -0.03em; line-height: 1; margin-bottom: 40px; }
  .heading { font-size: ${isHook ? 76 : 58}px; font-weight: 700; line-height: 1.25;
             letter-spacing: -0.02em; margin-bottom: 36px; }
  .body    { font-size: ${isHook ? 42 : 40}px; font-weight: 400; line-height: 1.65;
             opacity: 0.86; word-break: keep-all; }
  .foot    { display: flex; justify-content: space-between; align-items: baseline;
             font-size: 28px; opacity: 0.45; letter-spacing: 0.04em; }
  .rule    { width: 96px; height: 5px; background: ${t.accent}; margin-bottom: 48px; }
  main     { display: flex; flex-direction: column; justify-content: center; flex: 1; }
</style></head>
<body>
  <div class="rule"></div>
  <main>
    ${slide.keyword ? `<div class="keyword">${esc(slide.keyword)}</div>` : ''}
    <div class="heading">${esc(slide.heading)}</div>
    <div class="body">${esc(slide.body).replace(/\n/g, '<br>')}</div>
  </main>
  <div class="foot"><span>${esc(cfg.targets?.instagram ?? cfg.name)}</span><span>${index} / ${total}</span></div>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderedFiles(contentId: string): string[] {
  const dir = path.join(RENDER_DIR, contentId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.join(dir, f));
}
