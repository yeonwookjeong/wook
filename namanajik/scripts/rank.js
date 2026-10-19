// 순위 계산: 차트 목록(연간/월간)마다 "그 목록의 곡들 중 지금 7일 증가분 순위"
// 사용법: node scripts/rank.js [날짜]   → data/charts/<목록>/<날짜>.json, latest.json, latest.md
import fs from 'node:fs';
import path from 'node:path';
import { loadSongs, listNames, loadList, listLabel, readJson, writeJson, addDays, today, DIR } from './lib.js';

const WINDOW = 7;      // 증가분 기간(일)
const RANKED = 100;    // 순위 매기는 범위 (목록 전체). 플레이리스트는 상위 PLAYLIST곡
export const PLAYLIST = 50;
const SPIKE_X = 8;     // 지난 증가분 대비 8배 넘게 튀면 보류

const date = process.argv[2] || today();
const snaps = fs.existsSync(DIR.snapshots) ? fs.readdirSync(DIR.snapshots).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort() : [];
const cur = snaps.filter(d => d <= date).at(-1);
if (!cur) { console.log('스냅샷이 없습니다. 먼저 npm run snapshot 을 실행하세요.'); process.exit(0); }
const prev = snaps.filter(d => d <= addDays(cur, -WINDOW)).at(-1) || snaps.find(d => d < cur) || null;
const prev2 = prev ? (snaps.filter(d => d <= addDays(prev, -WINDOW)).at(-1) || null) : null;
const S = readJson(path.join(DIR.snapshots, `${cur}.json`)).stats;
const P = prev ? readJson(path.join(DIR.snapshots, `${prev}.json`)).stats : null;
const P2 = prev2 ? readJson(path.join(DIR.snapshots, `${prev2}.json`)).stats : null;
const span = prev ? Math.round((new Date(cur) - new Date(prev)) / 864e5) : 0;

const songs = Object.fromEntries(loadSongs().map(s => [s.song_id, s]));
const sum = (stats, s) => [s.mv_id, s.topic_id].filter(Boolean).reduce((a, id) => a + (stats?.[id]?.views ?? 0), 0);
const fmt = n => n === null ? '-' : n >= 1e4 ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '만' : String(n);
const arrow = d => d === null ? '' : d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '–';

for (const name of listNames()) {
  const list = loadList(name);
  const rows = [], unmapped = [];
  for (const r of list) {
    const s = songs[r.song_id];
    if (!s || !(s.mv_id || s.topic_id)) { unmapped.push(r); continue; }
    const total = sum(S, s), before = P ? sum(P, s) : null;
    const delta = before === null ? null : total - before;
    const deltaPrev = (P && P2) ? sum(P, s) - sum(P2, s) : null;
    const flags = [];
    if (delta !== null && delta < 0) flags.push('감소(영상 교체/삭제 의심)');
    if (delta !== null && deltaPrev !== null && deltaPrev > 0 && delta > deltaPrev * SPIKE_X) flags.push('급등(확인 필요)');
    const gone = [s.mv_id, s.topic_id].filter(Boolean).filter(id => !S[id]);
    if (gone.length) flags.push(`사라진 영상 ${gone.length}개`);
    rows.push({ song_id: s.song_id, then_rank: r.rank, title: s.title, artist: s.artist, mv_id: s.mv_id || null, topic_id: s.topic_id || null, total, delta, per_day: delta === null ? null : Math.round(delta / Math.max(span, 1)), flags });
  }
  const key = r => (r.delta ?? r.total);
  const ok = rows.filter(r => !r.flags.length).sort((a, b) => key(b) - key(a)), hold = rows.filter(r => r.flags.length);
  const latestPath = path.join(DIR.charts, name, 'latest.json');
  const lastRank = fs.existsSync(latestPath) ? Object.fromEntries(readJson(latestPath).chart.map(c => [c.song_id, c.now_rank])) : {};
  const chart = ok.map((r, i) => ({ now_rank: i + 1, ...r, change_vs_then: r.then_rank - (i + 1), change_vs_last: lastRank[r.song_id] ? lastRank[r.song_id] - (i + 1) : null, official: i < RANKED }));
  const out = { list: name, label: listLabel(name), date: cur, basis: P ? `${prev} → ${cur} (${span}일 증가분)` : `${cur} 누적 조회수 (첫 스냅샷, 임시)`, window_days: span, ranked: RANKED, total_songs: list.length, chart, on_hold: hold, unmapped: unmapped.map(u => `${u.rank}위 ${u.title} - ${u.artist}`) };
  writeJson(path.join(DIR.charts, name, `${cur}.json`), out);
  writeJson(latestPath, out);
  const md = [`# ${out.label} 노래, 지금 Top ${RANKED}`, '', `기준: ${out.basis} · 유튜브 공식 영상 조회수(MV + Topic 합산) · 집계 ${rows.length}/${list.length}곡`, '',
    '| 지금 | 곡 | 가수 | 7일 증가 | 그때 | 그때 대비 | 지난번 대비 |', '|---:|---|---|---:|---:|:--:|:--:|',
    ...chart.slice(0, RANKED).map(c => `| ${c.now_rank} | ${c.title} | ${c.artist} | ${fmt(c.delta ?? c.total)} | ${c.then_rank}위 | ${arrow(c.change_vs_then)} | ${arrow(c.change_vs_last)} |`),
    '', hold.length ? `보류 ${hold.length}곡: ` + hold.map(h => `${h.title}(${h.flags.join(', ')})`).join(' · ') : '보류 곡 없음',
    unmapped.length ? `미매핑 ${unmapped.length}곡: ` + out.unmapped.join(' · ') : '', ''].join('\n');
  fs.writeFileSync(path.join(DIR.charts, name, 'latest.md'), md);
  const top = chart[0], mover = [...chart].sort((a, b) => b.change_vs_then - a.change_vs_then)[0];
  console.log(`${out.label}: ${rows.length}/${list.length}곡 집계, 보류 ${hold.length}, 미매핑 ${unmapped.length} · 1위 ${top?.title ?? '-'}` + (mover && mover.change_vs_then > 0 ? ` · 최대 역주행 ${mover.title} (그때 ${mover.then_rank}위 → 지금 ${mover.now_rank}위)` : ''));
}
console.log(`기준 ${P ? `${prev} → ${cur}` : cur + ' (첫 스냅샷)'}`);
