// 레이스 영상용 데이터: 한 차트 목록의 날짜별 순위 기록 → render/data.json
// 사용법: node scripts/race-data.js 2005-10 [간격(일), 기본 7]
import fs from 'node:fs';
import path from 'node:path';
import { readJson, loadList, listLabel, DIR, ROOT } from './lib.js';

const name = process.argv[2]; const step = Number(process.argv[3] || 7);
if (!name) { console.error('차트 목록 이름을 지정하세요: node scripts/race-data.js 2005-10'); process.exit(1); }
const dir = path.join(DIR.charts, name);
const dates = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
const series = Object.fromEntries(loadList(name).map(r => [r.song_id, { title: r.title, artist: r.artist, then: r.rank, v: [] }]));
const used = []; let lastT = -Infinity;
for (const d of dates) {
  const t = new Date(d).getTime(); if (t - lastT < step * 864e5 - 1) continue;
  const c = readJson(path.join(dir, `${d}.json`));
  if (!c.window_days) continue;            // 첫 스냅샷(누적 기준)은 제외
  lastT = t; used.push(d);
  const by = Object.fromEntries([...c.chart, ...c.on_hold].map(r => [r.song_id, r]));
  for (const [id, s] of Object.entries(series)) s.v.push(Math.max(0, by[id]?.delta ?? 0));
}
const out = { year: listLabel(name).replace('년 ', '.').replace('년', '').replace('월', ''), label: listLabel(name), weeks: used.map(d => d.replace(/-/g, '.')), songs: Object.values(series).filter(s => s.v.some(v => v > 0)) };
fs.writeFileSync(path.join(ROOT, 'render/data.json'), JSON.stringify(out));
console.log(`${out.label}: ${used.length}개 시점, ${out.songs.length}곡 → render/data.json`);
