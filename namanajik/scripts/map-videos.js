// 곡 → 유튜브 영상 ID 매핑 (하루 최대 MAX_SEARCHES_PER_RUN곡, 검색 1회 = 100유닛)
// 사용법: node scripts/map-videos.js [연도]   예) node scripts/map-videos.js 2012
// 결과: data/songs/<연도>.csv 의 mv_id / topic_id 채움, 애매한 건 data/mapping/review-<연도>.csv 에 후보 기록
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, loadSongs, saveSongsFile, yt, DIR, toCsv } from './lib.js';

loadEnv();
const MAX = Number(process.env.MAX_SEARCHES_PER_RUN || 95);
const onlyYear = process.argv[2] ? Number(process.argv[2]) : null;

const norm = s => s.toLowerCase().replace(/\(.*?\)|\[.*?\]|feat\..*$/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
const OFFICIAL_HINTS = /official|vevo|1thek|stone music|genie|kakao|sm ?town|hybe|jyp|yg ent|cube|starship|pledis|fnc|woollim|rbw|antenna|mystic|loen/i;

const songs = loadSongs().filter(s => !onlyYear || s.year === onlyYear);
const todo = songs.filter(s => !s.search_done && !(s.mv_id && s.topic_id));
console.log(`대상 ${songs.length}곡 중 미매핑 ${todo.length}곡, 이번 실행 상한 ${MAX}곡`);

const review = [];
let used = 0, quotaHit = false;
for (const s of todo) {
  if (used >= MAX) break;
  const q = `${s.artist} ${s.title}`;
  let items;
  try {
    const r = await yt('search', { part: 'snippet', q, type: 'video', videoCategoryId: 10, maxResults: 8, regionCode: 'KR', relevanceLanguage: 'ko' });
    items = r.items || [];
  } catch (e) {
    if (e.quota) { quotaHit = true; console.error('쿼터 소진. 내일 이어서 실행하면 됩니다.'); break; }
    console.error(`[${s.year}] ${q}: ${e.message}`); continue;
  }
  used++;
  const nt = norm(s.title), na = norm(s.artist);
  const cands = items.map(it => ({
    id: it.id.videoId, title: it.snippet.title, channel: it.snippet.channelTitle,
    isTopic: / - Topic$/.test(it.snippet.channelTitle),
    titleMatch: norm(it.snippet.title).includes(nt),
    artistMatch: norm(it.snippet.channelTitle).includes(na) || norm(it.snippet.title).includes(na),
    official: OFFICIAL_HINTS.test(it.snippet.channelTitle) || /\bM\/?V\b|official|뮤직비디오|뮤비/i.test(it.snippet.title),
  }));
  // Topic 오디오: 채널명이 "가수 - Topic" 이고 제목이 곡명과 맞는 것
  const topic = cands.find(c => c.isTopic && c.titleMatch && c.artistMatch) || cands.find(c => c.isTopic && c.titleMatch);
  // 공식 MV: Topic 아니고, 제목 일치 + (공식 힌트 또는 가수 채널)
  const mv = cands.find(c => !c.isTopic && c.titleMatch && c.official && c.artistMatch)
          || cands.find(c => !c.isTopic && c.titleMatch && (c.official || c.artistMatch));
  if (topic && !s.topic_id) s.topic_id = topic.id;
  if (mv && !s.mv_id) s.mv_id = mv.id;
  s.search_done = new Date().toISOString().slice(0, 10);
  const status = `${s.mv_id ? 'MV' : '--'} ${s.topic_id ? 'Topic' : '-----'}`;
  console.log(`[${s.year}] ${String(s.then_rank).padStart(3)}위 ${q}  → ${status}`);
  if (!s.mv_id || !s.topic_id) {
    cands.slice(0, 5).forEach((c, i) => review.push({ year: s.year, then_rank: s.then_rank, title: s.title, artist: s.artist, missing: !s.mv_id && !s.topic_id ? 'both' : !s.mv_id ? 'mv' : 'topic', cand: i + 1, video_id: c.id, video_title: c.title, channel: c.channel, url: `https://youtu.be/${c.id}` }));
  }
}

// 파일별로 저장 (search_done, id 반영)
const byFile = {};
for (const s of loadSongs()) { (byFile[s._file] ||= []).push(s); }
for (const s of songs) { const arr = byFile[s._file]; const i = arr.findIndex(r => r.year === s.year && r.then_rank === s.then_rank && r.title === s.title); if (i >= 0) arr[i] = s; }
for (const [file, rows] of Object.entries(byFile)) saveSongsFile(file, rows);

if (review.length) {
  fs.mkdirSync(DIR.mapping, { recursive: true });
  const years = [...new Set(review.map(r => r.year))];
  for (const y of years) {
    const p = path.join(DIR.mapping, `review-${y}.csv`);
    const rows = review.filter(r => r.year === y);
    const header = Object.keys(rows[0]);
    const prev = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : toCsv([], header);
    fs.writeFileSync(p, prev + toCsv(rows, header).split('\n').slice(1).join('\n'));
    console.log(`수동 확인 필요 → ${path.relative(process.cwd(), p)} (${rows.length}행)`);
  }
}
console.log(`검색 ${used}회 사용 (약 ${used * 100}유닛)${quotaHit ? ', 쿼터 소진으로 중단' : ''}`);
