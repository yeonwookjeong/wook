// 매일 1회: 매핑된 모든 영상의 조회수·댓글수를 data/snapshots/YYYY-MM-DD.json 으로 저장 (영상 50개당 1유닛)
import path from 'node:path';
import { loadEnv, loadSongs, yt, chunk, today, writeJson, DIR } from './lib.js';

loadEnv();
const date = process.argv[2] || today();
const ids = [...new Set(loadSongs().flatMap(s => [s.mv_id, s.topic_id]).filter(Boolean))];
if (!ids.length) { console.log('매핑된 영상이 없습니다. 먼저 import-melon → map-videos 를 실행하세요.'); process.exit(0); }

const stats = {}; const missing = [];
for (const batch of chunk(ids, 50)) {
  const r = await yt('videos', { part: 'statistics', id: batch.join(','), maxResults: 50 });
  const seen = new Set();
  for (const it of r.items || []) {
    seen.add(it.id);
    stats[it.id] = { views: Number(it.statistics.viewCount || 0), comments: Number(it.statistics.commentCount || 0) };
  }
  for (const id of batch) if (!seen.has(id)) missing.push(id);
}
const out = path.join(DIR.snapshots, `${date}.json`);
writeJson(out, { date, count: ids.length, missing, stats });
console.log(`${date}: ${Object.keys(stats).length}/${ids.length}개 저장` + (missing.length ? `, 사라진 영상 ${missing.length}개: ${missing.join(' ')}` : ''));
