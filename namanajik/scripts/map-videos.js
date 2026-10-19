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
// MV로 인정하는 채널: 가수 본인 채널, 소속사·음반사·유통사 공식 채널. 방송사(KBS/MBC/SBS/Mnet 등)와 개인 채널은 제외
const OFFICIAL_CH = /official|vevo|1thek|원더케이|smtown|stone music|genie music|지니뮤직|kakao ?ent|카카오엔터|danal|cube ent|united cube|\bjyp\b|yg ent|\bhybe\b|pledis|starship|\bfnc\b|woollim|\brbw\b|antenna|mystic|\bloen\b|entertainment|엔터테인먼트|\brecords\b|레코드|music\s*&\s*new|뮤직앤뉴|nhn ?bugs|벅스|neowiz|네오위즈|cj ?e&m|pony ?canyon|포니캐년|warner|워너|universal|유니버설|sony|소니|kt ?music|cj ?music|dreamus|드림어스/i;
// 방송 무대·라이브·직캠·가사·노래방·커버·리믹스·티저는 제외 (음원 순위이므로 MV와 음원만)
const BAD_TITLE = /가사|lyric|노래방|karaoke|cover|커버|reaction|리액션|remix|리믹스|\binst\b|\bmr\b|tj노래방|금영|8d|slowed|sped up|nightcore|1시간|1 hour|loop|반복|모음|playlist|플레이리스트|live|라이브|직캠|fancam|무대|stage|concert|콘서트|쇼케이스|showcase|teaser|티저|방송|kbs|mbc|sbs|mnet|인기가요|뮤직뱅크|music bank|쇼! 음악중심|엠카운트다운|m countdown|더 시즌즈|스케치북|러브레터|콘서트7080|유희열|성시경의|가요톱10/i;
const BROADCASTER = /\bkbs|\bmbc|\bsbs|mnet|jtbc|\btvn\b|\bm2\b|baambc|뱀비씨|가요톱10|kpop classic|방송/i;
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
  const nt = norm(s.title), na = norm(s.artist.split(',')[0]);
  const album = (s.note.match(/앨범: ([^/]+)/) || [])[1]?.trim();
  const nal = album ? normKeep(album) : null;
  const toCands = items => items.map(it => {
    const title = it.snippet.title, ch = it.snippet.channelTitle, desc = it.snippet.description || '';
    const blob = normKeep(title + ' ' + ch + ' ' + desc);
    return {
      id: it.id.videoId, title, channel: ch, desc: desc.slice(0, 120).replace(/\s+/g, ' '),
      isTopic: / - Topic$/.test(ch),
      titleMatch: norm(title).includes(nt) || normKeep(title).includes(normKeep(s.title)),
      artistMatch: blob.includes(na),
      albumMatch: nal ? blob.includes(nal) : false,
      officialCh: OFFICIAL_CH.test(ch) && !BROADCASTER.test(ch),
      mvTitle: /\bM\/?V\b|official|뮤직비디오|뮤비/i.test(title),
      badTitle: BAD_TITLE.test(title),
    };
  });
  // Topic 선택: 제목 일치 후보 중 가수·앨범이 확인되면 우선, 후보가 하나뿐이면 그대로 인정
  const pickTopic = cands => {
    const pool = cands.filter(c => c.isTopic && c.titleMatch);
    return pool.find(c => c.artistMatch && c.albumMatch) || pool.find(c => c.artistMatch || c.albumMatch) || (pool.length === 1 ? pool[0] : null);
  };
  let items;
  try {
    const r = await yt('search', { part: 'snippet', q, type: 'video', videoCategoryId: 10, maxResults: 8, regionCode: 'KR', relevanceLanguage: 'ko' });
    items = r.items || [];
  } catch (e) {
    if (e.quota) { quotaHit = true; console.error('쿼터 소진. 내일 이어서 실행하면 됩니다.'); break; }
    console.error(`${q}: ${e.message}`); continue;
  }
  used++;
  let cands = toCands(items);
  let topic = pickTopic(cands);
  // 2차 검색: 일반 검색에 Topic 음원이 안 잡히면 앨범명을 붙여 한 번 더 (Topic 영상 설명문에 앨범명이 있어 잘 잡힘)
  if (!topic && !s.topic_id && used < MAX) {
    try {
      const r2 = await yt('search', { part: 'snippet', q: `${qTitle} ${s.artist.split(',')[0]} ${album || ''} topic`, type: 'video', videoCategoryId: 10, maxResults: 6, regionCode: 'KR' });
      used++;
      const more = toCands(r2.items || []);
      topic = pickTopic(more);
      cands = cands.concat(more.filter(c => !cands.some(x => x.id === c.id)));
    } catch (e) { if (e.quota) { quotaHit = true; console.error('쿼터 소진(2차 검색).'); } else console.error(`2차 ${q}: ${e.message}`); }
    if (quotaHit) { s.search_done = ''; break; }
  }
  // MV: 제목 일치 + 제외어 없음 + (소속사·유통사 채널 또는 가수 본인 채널명)
  const artistCh = c => normKeep(c.channel).includes(na) && !BROADCASTER.test(c.channel);
  const mvPool = cands.filter(c => !c.isTopic && c.titleMatch && !c.badTitle && (c.officialCh || artistCh(c)));
  const mv = mvPool.find(c => c.mvTitle && c.artistMatch) || mvPool.find(c => c.mvTitle) || mvPool.find(c => c.artistMatch) || mvPool[0];
  if (topic && !s.topic_id) s.topic_id = topic.id;
  if (mv && !s.mv_id) s.mv_id = mv.id;
  s.search_done = today();
  console.log(`${s.song_id} ${q}  → ${s.mv_id ? 'MV' : '--'} ${s.topic_id ? 'Topic' : '-----'}`);
  if (!s.mv_id || !s.topic_id) {
    cands.slice(0, 6).forEach((c, i) => review.push({ song_id: s.song_id, title: s.title, artist: s.artist, missing: !s.mv_id && !s.topic_id ? 'both' : !s.mv_id ? 'mv' : 'topic', cand: i + 1, video_id: c.id, video_title: c.title, channel: c.channel, desc: c.desc, url: `https://youtu.be/${c.id}` }));
  }
}
// ---------- 재시도 패스: 검색은 했지만 Topic 음원이 없는 곡 → 검색어를 바꿔 최대 3회 더 ----------
const RETRY_MAX = Number(process.env.RETRY_SEARCHES_PER_RUN || 30);
const retryTargets = targets.filter(s => s.search_done && !s.topic_id && !/retry_done/.test(s.note));
let retryUsed = 0;
for (const s of retryTargets) {
  if (quotaHit || used >= MAX || retryUsed >= RETRY_MAX) break;
  const nt = norm(s.title), na = norm(s.artist.split(',')[0]);
  const album = (s.note.match(/앨범: ([^/]+)/) || [])[1]?.trim();
  const nal = album ? normKeep(album) : null;
  const plainTitle = s.title.replace(/\s*\([^()]*\)/g, '').trim() || s.title;
  const variants = [
    `${plainTitle} ${album || ''} provided to youtube`,          // Topic 설명문 첫 줄 문구
    `"${plainTitle}" ${s.artist.split(',')[0]}`,                    // 제목 정확 일치 + 가수
    `${plainTitle} ${s.artist.split(',')[0]} 2005 2006 2007 2008 2009 topic`,
  ];
  let found = null;
  for (const q of variants) {
    if (quotaHit || used >= MAX || retryUsed >= RETRY_MAX) break;
    let items;
    try { items = (await yt('search', { part: 'snippet', q, type: 'video', videoCategoryId: 10, maxResults: 10, regionCode: 'KR' })).items || []; }
    catch (e) { if (e.quota) { quotaHit = true; console.error('쿼터 소진(재시도).'); break; } console.error(`재시도 ${q}: ${e.message}`); continue; }
    used++; retryUsed++;
    const pool = items.filter(it => / - Topic$/.test(it.snippet.channelTitle)).map(it => {
      const blob = normKeep(it.snippet.title + ' ' + it.snippet.channelTitle + ' ' + (it.snippet.description || ''));
      const t = norm(it.snippet.title);
      return { id: it.id.videoId, title: it.snippet.title, channel: it.snippet.channelTitle,
        titleMatch: t.includes(nt) || nt.includes(t) && t.length >= 2 || normKeep(it.snippet.title).includes(normKeep(plainTitle)),
        artistMatch: blob.includes(na), albumMatch: nal ? blob.includes(nal) : false };
    }).filter(c => c.titleMatch);
    found = pool.find(c => c.artistMatch && c.albumMatch) || pool.find(c => c.albumMatch) || pool.find(c => c.artistMatch) || (pool.length === 1 ? pool[0] : null);
    if (found) break;
  }
  if (found) { s.topic_id = found.id; s.note = (s.note ? s.note + ' / ' : '') + `retry_done: ${found.channel}`; console.log(`재시도 성공 ${s.title} - ${s.artist} → ${found.channel}`); }
  else if (!quotaHit) { s.note = (s.note ? s.note + ' / ' : '') + 'retry_done: 못 찾음'; console.log(`재시도 실패 ${s.title} - ${s.artist}`); }
}
if (retryTargets.length) console.log(`재시도 대상 ${retryTargets.length}곡, 검색 ${retryUsed}회`);

saveSongs(songs);
if (review.length) {
  fs.mkdirSync(DIR.mapping, { recursive: true });
  const p = path.join(DIR.mapping, `review-${today()}.csv`);
  fs.writeFileSync(p, toCsv(review, Object.keys(review[0])));
  console.log(`수동 확인 필요 → data/mapping/${path.basename(p)} (${review.length}행). 맞는 ID를 data/songs.csv에 넣으세요.`);
}
console.log(`검색 ${used}회 사용 (약 ${used * 100}유닛)${quotaHit ? ', 쿼터 소진으로 중단' : ''}`);
