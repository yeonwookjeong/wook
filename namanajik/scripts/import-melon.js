// 멜론 시대별 차트 화면을 드래그 복사한 텍스트 → data/lists/<이름>.csv + data/songs.csv 갱신
// 사용법: node scripts/import-melon.js 2005-10 < 붙여넣기.txt      (월간)
//         node scripts/import-melon.js 2005    < 붙여넣기.txt      (연간)
// 같은 곡이 다른 달에 또 나오면 songs.csv에는 한 번만 들어가고 영상 매핑도 한 번만 합니다.
import fs from 'node:fs';
import path from 'node:path';
import { loadSongs, saveSongs, saveList, songKey, listLabel, ROOT } from './lib.js';

const name = process.argv[2];
if (!name || !/^\d{4}(-\d{2})?$/.test(name)) { console.error('이름을 지정하세요: 2005-10 (월간) 또는 2005 (연간)'); process.exit(1); }
const text = fs.readFileSync(process.argv[3] || 0, 'utf8');

// 멜론 복사 텍스트 구조: "순위" 줄 → "곡명 - 페이지 이동" → ... → "가수 | 앨범" → "좋아요 N"
const lines = text.split(/\r?\n/).map(l => l.trim());
// 순위 줄: "7" (연간) 또는 "7 NEW", "2 단계 상승 32", "1 순위 동일 0" (월간)
const RANK_LINE = /^(\d{1,3})(?:\s+(?:NEW|순위 동일|단계 상승|단계 하락)(?:\s+\d+)?)?$/;
const entries = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(RANK_LINE); if (!m) continue;
  const rank = Number(m[1]);
  let title = null, artist = null, album = '';
  for (let j = i + 1; j < Math.min(i + 12, lines.length) && !RANK_LINE.test(lines[j]); j++) {
    const l = lines[j];
    if (title === null && / - 페이지 이동$/.test(l)) title = l.replace(/ - 페이지 이동$/, '');
    else if (artist === null && l.includes(' | ')) { [artist, album] = l.split(' | ').map(s => s.trim()); }
  }
  if (title && artist) entries.push({ rank, rawTitle: title, rawArtist: artist, album });
}
if (!entries.length) { console.error('곡을 하나도 못 읽었습니다. 멜론 차트 화면을 그대로 드래그 복사한 텍스트인지 확인하세요.'); process.exit(1); }

// 표시용/검색용 정리
const DESC = /\s*\((?:[^()]*(?:드라마|CF|OST|삽입곡|테마|주제가|타이틀|메인|광고|여는 노래|오프닝|엔딩)[^()]*)\)/g;   // 설명형 괄호는 메모로
const cleanTitle = t => t.replace(DESC, '').replace(/\s{2,}/g, ' ').trim();
const cleanOne = a => {
  a = a.trim();
  const m = a.match(/^([A-Za-z0-9 .'&!-]+)\s*\(([^()]*[가-힣][^()]*)\)$/);   // "BIGBANG (빅뱅)" → "빅뱅"
  if (m) return m[2].trim();
  const stripped = a.replace(/\s*\([A-Za-z0-9 .'&!,-]+\)\s*$/, '').trim();   // "거미 (GUMMY)" → "거미"
  return stripped.length >= 2 ? stripped : a;                                   // "f(x)" 는 그대로
};
const cleanArtist = a => a.split(/,\s*/).map(cleanOne).join(', ');            // "김현철, 거미 (GUMMY)" → "김현철, 거미"

// 외국곡 제외 목록 (data/exclude-artists.txt)
const exPath = path.join(ROOT, 'data/exclude-artists.txt');
const excluded = new Set(fs.existsSync(exPath) ? fs.readFileSync(exPath, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')) : []);
const KNOWN_LATIN_KR = new Set(['KCM', 'god', 'BMK', 'izi', 'MC몽', 'JK 김동욱', 'V.O.S', 'Daylight', 'BGH4', 'JJMP', '2PM', '2am', '2AM', '4minute', '4Minute', 'G-DRAGON', 'f(x)', '2NE1', 'Supreme Team', 'T.O.P', 'TAEYANG', 'CL', 'HyunA', 'MBLAQ', 'B1A4', 'BTOB', 'VIXX', 'GOT7', 'MONSTA X', 'WINNER', 'iKON', 'Red Velvet', 'gugudan', 'Apink', 'EXID', 'AOA', 'GFRIEND', 'OH MY GIRL', 'LOONA', 'KARD', 'fromis_9', 'Wanna One', 'X1', 'TXT', 'ENHYPEN', 'STAYC', 'Kep1er', 'BIBI', 'Zico', 'ZICO', 'Dean', 'Colde', 'Sik-K', 'Paloalto', 'Simon Dominic', 'E SENS', 'Verbal Jint', 'San E', 'Bizzy', 'Tiger JK', 'Yoon Mirae', 'Drunken Tiger', 'DJ DOC', 'UV', 'MC Sniper', 'Outsider', 'Nell', 'Hyukoh', 'The Black Skirts', 'SURL', 'ADOY', 'SE SO NEON', 'wave to earth', 'Peppertones', 'Standing Egg', '10cm', 'Urban Zakapa', 'Epitone Project', 'Toy', 'Eddy Kim', 'Roy Kim', 'Sam Kim', 'Jung Seung Hwan', 'Paul Kim', 'Car, the garden', 'George', 'SOLE', 'Jukjae', 'LeeHi', 'Ailee', 'ALi', 'IU', 'Zion.T', 'Crush', 'DEAN', 'BoA', 'Rain', 'BIGBANG', 'EXO', 'BTS', 'NCT', 'SHINee', 'TWICE', 'ITZY', 'IVE', 'NMIXX', 'aespa', 'BLACKPINK', 'LE SSERAFIM', 'NewJeans', 'Stray Kids', 'ATEEZ', 'SEVENTEEN', 'AKMU', 'Heize', 'pH-1', 'Loco', 'GRAY', 'Jay Park', 'Dok2', 'Beenzino', 'Epik High', 'Dynamic Duo', 'Leessang', 'ALi', 'Ailee', 'IU', 'Zion.T', 'Crush', 'DEAN', 'BoA', 'Rain', 'BIGBANG', 'EXO', 'BTS', 'NCT', 'SHINee', 'TWICE', 'ITZY', 'IVE', 'NMIXX', 'aespa', 'BLACKPINK', 'LE SSERAFIM', 'NewJeans', 'Stray Kids', 'ATEEZ', 'SEVENTEEN', 'WINNER', 'iKON', 'AKMU', 'Heize', 'pH-1', 'Loco', 'GRAY', 'Jay Park', 'Dok2', 'Beenzino', 'Epik High', 'Dynamic Duo', 'Leessang', 'Sung Si Kyung']);
const skipped = [], latinCheck = [];
const songs = loadSongs();
const byKey = new Map(songs.map(s => [songKey(s.title, s.artist), s]));
let added = 0;
const listRows = [];
for (const e of entries) {
  const title = cleanTitle(e.rawTitle), artist = cleanArtist(e.rawArtist);
  if (excluded.has(e.rawArtist) || excluded.has(artist)) { skipped.push(`${e.rank}위 ${title} - ${artist}`); continue; }
  if (!/[가-힣]/.test(artist) && !KNOWN_LATIN_KR.has(artist)) latinCheck.push(`${e.rank}위 ${title} - ${artist}`);
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
if (skipped.length) console.log(`외국곡 제외 ${skipped.length}곡: ` + skipped.join(' · '));
if (latinCheck.length) console.log(`확인 필요(가수명이 영문뿐, 외국곡이면 data/exclude-artists.txt에 추가): ` + latinCheck.join(' · '));
