// 매일 1회: 매핑된 모든 영상의 조회수·댓글수를 data/snapshots/YYYY-MM-DD.json 으로 저장 (영상 50개당 1유닛)
import path from 'node:path';
import fs from 'node:fs';
import { loadEnv, loadSongs, yt, chunk, today, writeJson, DIR, ROOT, parseCsv, toCsv } from './lib.js';

loadEnv();
const date = process.argv[2] || today();
const songs = loadSongs();
const ids = [...new Set(songs.flatMap(s => [s.mv_id, s.topic_id]).filter(Boolean))];
// 영상 제목·채널 기록 (사람이 매핑을 검토하는 용도). 한 번 받은 영상은 다시 안 받음.
const VIDEOS = path.join(ROOT, 'data/videos.csv');
const known = fs.existsSync(VIDEOS) ? Object.fromEntries(parseCsv(fs.readFileSync(VIDEOS, 'utf8')).map(v => [v.video_id, v])) : {};
const needMeta = ids.filter(id => !known[id]);
if (!ids.length) { console.log('매핑된 영상이 없습니다. 먼저 import-melon → map-videos 를 실행하세요.'); process.exit(0); }

const stats = {}; const missing = [];
for (const batch of chunk(ids, 50)) {
  const wantMeta = batch.some(id => needMeta.includes(id));
  const r = await yt('videos', { part: wantMeta ? 'statistics,snippet' : 'statistics', id: batch.join(','), maxResults: 50 });
  const seen = new Set();
  for (const it of r.items || []) {
    seen.add(it.id);
    stats[it.id] = { views: Number(it.statistics.viewCount || 0), comments: Number(it.statistics.commentCount || 0) };
    if (it.snippet && !known[it.id]) known[it.id] = { video_id: it.id, title: it.snippet.title, channel: it.snippet.channelTitle, published: (it.snippet.publishedAt || '').slice(0, 10) };
  }
  for (const id of batch) if (!seen.has(id)) missing.push(id);
}
// videos.csv: 곡과 연결해서 저장 (song_id, 역할, 곡명, 가수, 영상 제목, 채널, 게시일, 조회수)
const rows = [];
for (const s of songs) for (const [role, id] of [['MV', s.mv_id], ['Topic', s.topic_id]]) if (id) {
  const v = known[id] || {};
  rows.push({ song_id: s.song_id, role, title: s.title, artist: s.artist, video_id: id, video_title: v.title || '', channel: v.channel || '', published: v.published || '', views: stats[id]?.views ?? '', url: `https://youtu.be/${id}` });
}
fs.writeFileSync(VIDEOS, toCsv(rows, ['song_id', 'role', 'title', 'artist', 'video_id', 'video_title', 'channel', 'published', 'views', 'url']));
const out = path.join(DIR.snapshots, `${date}.json`);
writeJson(out, { date, count: ids.length, missing, stats });
console.log(`${date}: ${Object.keys(stats).length}/${ids.length}개 저장` + (missing.length ? `, 사라진 영상 ${missing.length}개: ${missing.join(' ')}` : ''));
