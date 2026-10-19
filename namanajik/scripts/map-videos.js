// 곡 → 유튜브 영상 ID 매핑 (하루 최대 MAX_SEARCHES_PER_RUN곡, 검색 1회 = 100유닛)
// 사용법: node scripts/map-videos.js            전체 미매핑 곡
//         node scripts/map-videos.js 2005-10    특정 차트 목록의 곡만 먼저
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, loadSongs, saveSongs, loadList, yt, DIR, toCsv, today } from './lib.js';

loadEnv();
const MAX = Number(process.env.MAX_SEARCHES_PER_RUN || 95);
const onlyList = process.argv[2] || null;

const norm = s => s.toLowerCase().replace(/\(.*?\)|\[.*?\]|feat\..*$/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
const OFFICIAL_HINTS = /official|vevo|1thek|stone music|genie|kakao|sm ?town|hybe|jyp|yg ent|cube|starship|pledis|fnc|woollim|rbw|antenna|mystic|loen|mnet|kbs|mbc|sbs/i;

const songs = loadSongs();
let targets = songs;
if (onlyList) { const ids = new Set(loadList(onlyList).map(r => r.song_id)); targets = songs.filter(s => ids.has(s.song_id)); }
const todo = targets.filter(s => !s.search_done && !(s.mv_id && s.topic_id));
console.log(`대상 ${targets.length}곡 중 미매핑 ${todo.length}곡, 이번 실행 상한 ${MAX}곡`);

const review = [];
let used = 0, quotaHit = false;
for (const s of todo) {
  if (used >= MAX) break;
  // 검색어: 괄호 설명은 빼고 Feat.만 남김 ("Tell me (Sampling From ...)" → "Tell me")
  const qTitle = s.title.replace(/\s*\((?!feat)[^()]*\)/gi, '').replace(/\s{2,}/g, ' ').trim() || s.title;
  const q = `${s.artist.split(',')[0]} ${qTitle}`;
  let items;
  try {
    const r = await yt('search', { part: 'snippet', q, type: 'video', videoCategoryId: 10, maxResults: 8, regionCode: 'KR', relevanceLanguage: 'ko' });
    items = r.items || [];
  } catch (e) {
    if (e.quota) { quotaHit = true; console.error('쿼터 소진. 내일 이어서 실행하면 됩니다.'); break; }
    console.error(`${q}: ${e.message}`); continue;
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
  const topic = cands.find(c => c.isTopic && c.titleMatch && c.artistMatch) || cands.find(c => c.isTopic && c.titleMatch);
  const mv = cands.find(c => !c.isTopic && c.titleMatch && c.official && c.artistMatch)
          || cands.find(c => !c.isTopic && c.titleMatch && (c.official || c.artistMatch));
  if (topic && !s.topic_id) s.topic_id = topic.id;
  if (mv && !s.mv_id) s.mv_id = mv.id;
  s.search_done = today();
  console.log(`${s.song_id} ${q}  → ${s.mv_id ? 'MV' : '--'} ${s.topic_id ? 'Topic' : '-----'}`);
  if (!s.mv_id || !s.topic_id) {
    cands.slice(0, 5).forEach((c, i) => review.push({ song_id: s.song_id, title: s.title, artist: s.artist, missing: !s.mv_id && !s.topic_id ? 'both' : !s.mv_id ? 'mv' : 'topic', cand: i + 1, video_id: c.id, video_title: c.title, channel: c.channel, url: `https://youtu.be/${c.id}` }));
  }
}
saveSongs(songs);
if (review.length) {
  fs.mkdirSync(DIR.mapping, { recursive: true });
  const p = path.join(DIR.mapping, `review-${today()}.csv`);
  fs.writeFileSync(p, toCsv(review, Object.keys(review[0])));
  console.log(`수동 확인 필요 → data/mapping/${path.basename(p)} (${review.length}행). 맞는 ID를 data/songs.csv에 넣으세요.`);
}
console.log(`검색 ${used}회 사용 (약 ${used * 100}유닛)${quotaHit ? ', 쿼터 소진으로 중단' : ''}`);
