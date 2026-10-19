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
const normKeep = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');   // 괄호 안 포함, 설명문 대조용
// "공식"으로 인정하는 채널: 방송사·음반사·유통사·공식 채널. 가사 영상, 노래방, 개인 업로드는 제외
const OFFICIAL_CH = /official|vevo|1thek|원더케이|smtown|\bkbs\b|kbs ?kpop|\bmbc|\bsbs|mnet|\bm2\b|jtbc|\btvn\b|stone music|genie music|지니뮤직|kakao ?ent|카카오엔터|danal|cube ent|united cube|\bjyp\b|yg ent|\bhybe\b|pledis|starship|\bfnc\b|woollim|\brbw\b|antenna|mystic|\bloen\b|baambc|뱀비씨|가요톱10|kpop classic|entertainment|엔터테인먼트|\brecords\b|레코드|뮤직비디오 공식/i;
const BAD_TITLE = /가사|lyric|노래방|karaoke|cover|커버|reaction|리액션|remix|리믹스|inst\b|mr\b|tj노래방|금영|8d|slowed|sped up|nightcore|1시간|1 hour|loop|반복|모음|playlist|플레이리스트/i;
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
  const nt = norm(s.title), na = norm(s.artist.split(',')[0]);
  const album = (s.note.match(/앨범: ([^/]+)/) || [])[1]?.trim();
  const nal = album ? normKeep(album) : null;
  const cands = items.map(it => {
    const title = it.snippet.title, ch = it.snippet.channelTitle, desc = it.snippet.description || '';
    const blob = normKeep(title + ' ' + ch + ' ' + desc);
    return {
      id: it.id.videoId, title, channel: ch,
      isTopic: / - Topic$/.test(ch),
      titleMatch: norm(title).includes(nt) || normKeep(title).includes(normKeep(s.title)),
      artistMatch: blob.includes(na),                       // Topic 영상은 설명문에 "곡 · 가수 · 앨범"이 있음
      albumMatch: nal ? blob.includes(nal) : false,
      officialCh: OFFICIAL_CH.test(ch),
      mvTitle: /\bM\/?V\b|official|뮤직비디오|뮤비/i.test(title),
      badTitle: BAD_TITLE.test(title),
    };
  });
  // Topic: 제목 일치 + (가수 또는 앨범 일치). 가수·앨범 확인 안 되면 선택하지 않고 검토로
  const topic = cands.find(c => c.isTopic && c.titleMatch && c.artistMatch && c.albumMatch)
             || cands.find(c => c.isTopic && c.titleMatch && (c.artistMatch || c.albumMatch));
  // MV: 제목 일치 + 가사/노래방류 아님 + 공식 채널. 공식 MV 표기가 있으면 우선
  const mvPool = cands.filter(c => !c.isTopic && c.titleMatch && !c.badTitle && (c.officialCh || c.artistMatch && c.mvTitle));
  const mv = mvPool.find(c => c.mvTitle && c.artistMatch) || mvPool.find(c => c.mvTitle) || mvPool.find(c => c.artistMatch) || mvPool[0];
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
