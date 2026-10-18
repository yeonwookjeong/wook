// 멜론 시대별 차트 화면을 드래그 복사한 텍스트 → data/lists/<이름>.csv + data/songs.csv 갱신
// 사용법: node scripts/import-melon.js 2005-10 < 붙여넣기.txt      (월간)
//         node scripts/import-melon.js 2005    < 붙여넣기.txt      (연간)
// 같은 곡이 다른 달에 또 나오면 songs.csv에는 한 번만 들어가고 영상 매핑도 한 번만 합니다.
import fs from 'node:fs';
import { loadSongs, saveSongs, saveList, songKey, listLabel } from './lib.js';

const name = process.argv[2];
if (!name || !/^\d{4}(-\d{2})?$/.test(name)) { console.error('이름을 지정하세요: 2005-10 (월간) 또는 2005 (연간)'); process.exit(1); }
const text = fs.readFileSync(process.argv[3] || 0, 'utf8');

// 멜론 복사 텍스트 구조: "순위" 줄 → "곡명 - 페이지 이동" → ... → "가수 | 앨범" → "좋아요 N"
const lines = text.split(/\r?\n/).map(l => l.trim());
const entries = [];
for (let i = 0; i < lines.length; i++) {
  if (!/^\d{1,3}$/.test(lines[i])) continue;
  const rank = Number(lines[i]);
  let title = null, artist = null, album = '';
  for (let j = i + 1; j < Math.min(i + 12, lines.length) && !/^\d{1,3}$/.test(lines[j]); j++) {
    const l = lines[j];
    if (title === null && / - 페이지 이동$/.test(l)) title = l.replace(/ - 페이지 이동$/, '');
    else if (artist === null && l.includes(' | ')) { [artist, album] = l.split(' | ').map(s => s.trim()); }
  }
  if (title && artist) entries.push({ rank, rawTitle: title, rawArtist: artist, album });
}
if (!entries.length) { console.error('곡을 하나도 못 읽었습니다. 멜론 차트 화면을 그대로 드래그 복사한 텍스트인지 확인하세요.'); process.exit(1); }

// 표시용/검색용 정리
const DESC = /\s*\((?:[^()]*(?:드라마|CF|OST|삽입곡|테마|주제가|타이틀|메인|광고)[^()]*)\)/g;   // 설명형 괄호는 메모로
const cleanTitle = t => t.replace(DESC, '').replace(/\s{2,}/g, ' ').trim();
const cleanArtist = a => a.replace(/\s*\([A-Za-z0-9 .'&-]+\)\s*$/, '').trim();   // "거미 (GUMMY)" → "거미"

const songs = loadSongs();
const byKey = new Map(songs.map(s => [songKey(s.title, s.artist), s]));
let added = 0;
const listRows = [];
for (const e of entries) {
  const title = cleanTitle(e.rawTitle), artist = cleanArtist(e.rawArtist);
  const key = songKey(title, artist);
  let s = byKey.get(key);
  if (!s) {
    const noteParts = [];
    if (title !== e.rawTitle) noteParts.push(`원제: ${e.rawTitle}`);
    if (e.album) noteParts.push(`앨범: ${e.album}`);
    s = { song_id: `s${String(songs.length + 1).padStart(4, '0')}`, title, artist, mv_id: '', topic_id: '', search_done: '', note: noteParts.join(' / ') };
    songs.push(s); byKey.set(key, s); added++;
  }
  listRows.push({ rank: e.rank, song_id: s.song_id, title: s.title, artist: s.artist });
}
listRows.sort((a, b) => a.rank - b.rank);
saveSongs(songs);
saveList(name, listRows);
console.log(`${listLabel(name)}: ${listRows.length}곡 저장 (1~${listRows.at(-1).rank}위) → data/lists/${name}.csv`);
console.log(`곡 DB: 새 곡 ${added}개 추가, 전체 ${songs.length}곡 → data/songs.csv`);
const dup = listRows.length - added;
if (dup) console.log(`이미 있던 곡 ${dup}개는 재사용 (영상 매핑 불필요)`);
