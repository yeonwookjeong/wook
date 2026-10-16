// 레이스 영상용 데이터: 한 연도의 차트 기록을 모아 render/data.json 생성
// 사용법: node scripts/race-data.js 2012 [주간 간격(일), 기본 7]
import fs from 'node:fs';
import path from 'node:path';
import { readJson, loadSongs, DIR, ROOT } from './lib.js';

const year = Number(process.argv[2]); const step = Number(process.argv[3] || 7);
if (!year) { console.error('연도를 지정하세요: node scripts/race-data.js 2012'); process.exit(1); }
const dir = path.join(DIR.charts, String(year));
const dates = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
// step 일 간격으로 솎아내기
const picked = []; let lastT = -Infinity; const used = [];
for (const d of dates) { const t = new Date(d).getTime(); if (t - lastT >= step * 864e5 - 1) { picked.push(d); lastT = t; } }
const songs = loadSongs().filter(s => s.year === year);
const series = Object.fromEntries(songs.map(s => [s.title + '|' + s.artist, { title: s.title, artist: s.artist, then: s.then_rank, v: [] }]));
for (const d of picked) {
  const c = readJson(path.join(dir, `${d}.json`));
  if (!c.window_days) continue; // 첫 스냅샷(누적 기준)은 증가분이 아니라 제외
  used.push(d);
  const byKey = Object.fromEntries([...c.chart, ...c.on_hold].map(r => [r.title + '|' + r.artist, r]));
  for (const k of Object.keys(series)) { const r = byKey[k]; series[k].v.push(r ? Math.max(0, r.delta ?? r.total) : 0); }
}
const weeks = used.map(d => d.replace(/-/g, '.'));
const out = { year, weeks, songs: Object.values(series) };
fs.writeFileSync(path.join(ROOT, 'render/data.json'), JSON.stringify(out));
console.log(`${year}: ${weeks.length}개 시점, ${out.songs.length}곡 → render/data.json`);
