// 레이스 영상 렌더: render/data.json → frames/*.png → ffmpeg로 mp4
// 사용법: node render/render.js [초, 기본 18] [fps, 기본 24]
// 사전 준비: npm i -D playwright && npx playwright install chromium   (로컬 1회)
// 완료 후: ffmpeg -framerate 24 -i render/frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 render/race.mp4
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEC = Number(process.argv[2] || 18), FPS = Number(process.argv[3] || 24), N = SEC * FPS;
const { chromium } = await import('playwright').catch(() => { console.error('playwright가 없습니다: npm i -D playwright && npx playwright install chromium'); process.exit(1); });

// data.json을 fetch로 읽어야 해서 간단한 정적 서버를 띄움
const server = http.createServer((req, res) => {
  const f = path.join(HERE, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!f.startsWith(HERE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const frames = path.join(HERE, 'frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
for (let k = 0; k < N; k++) {
  await page.evaluate(t => window.renderFrame(t), k / (N - 1));
  await page.screenshot({ path: path.join(frames, String(k).padStart(4, '0') + '.png') });
  if (k % (FPS * 2) === 0) process.stdout.write(`\r${k}/${N}`);
}
await browser.close(); server.close();
console.log(`\n${N}프레임 완료 → render/frames/. 다음: ffmpeg -framerate ${FPS} -i render/frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 render/race.mp4`);
