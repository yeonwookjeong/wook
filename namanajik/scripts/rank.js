// 순위 계산: 오늘 스냅샷 - 7일 전 스냅샷 = 7일 증가분 → 연도별 순위
// 사용법: node scripts/rank.js [날짜]   (기본 오늘)
// 결과: data/charts/<연도>/<날짜>.json, data/charts/<연도>/latest.json, data/charts/<연도>/latest.md
import fs from 'node:fs';
import path from 'node:path';
import { loadSongs, readJson, writeJson, addDays, today, DIR } from './lib.js';

const WINDOW = 7;          // 증가분 기간(일)
const RANKED = 30;         // 공식 순위로 공개하는 범위 (그 아래는 노이즈)
const SPIKE_X = 8;         // 지난 증가분의 8배 넘게 튀면 "확인 필요"로 표시 (Topic 영상 교체, 바이럴 등)

const date = process.argv[2] || today();
const snapFiles = fs.existsSync(DIR.snapshots) ? fs.readdirSync(DIR.snapshots).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort() : [];
const cur = snapFiles.filter(d => d <= date).at(-1);
if (!cur) { console.log('스냅샷이 없습니다. 먼저 npm run snapshot 을 실행하세요.'); process.exit(0); }
// 7일 전과 가장 가까운 과거 스냅샷 (없으면 가장 오래된 것)
const target = addDays(cur, -WINDOW);
const prev = snapFiles.filter(d => d <= target).at(-1) || snapFiles.find(d => d < cur) || null;
const prev2 = prev ? (snapFiles.filter(d => d <= addDays(prev, -WINDOW)).at(-1) || null) : null;

const S = readJson(path.join(DIR.snapshots, `${cur}.json`)).stats;
const P = prev ? readJson(path.join(DIR.snapshots, `${prev}.json`)).stats : null;
const P2 = prev2 ? readJson(path.join(DIR.snapshots, `${prev2}.json`)).stats : null;
const span = prev ? Math.round((new Date(cur) - new Date(prev)) / 864e5) : 0;

const sum = (stats, s) => [s.mv_id, s.topic_id].filter(Boolean).reduce((a, id) => a + (stats?.[id]?.views ?? 0), 0);
const songs = loadSongs().filter(s => s.mv_id || s.topic_id);
const years = [...new Set(songs.map(s => s.year))].sort();

// 지난 차트(있으면) 불러서 등락 계산
const loadLatest = y => { const p = path.join(DIR.charts, String(y), 'latest.json'); return fs.existsSync(p) ? readJson(p) : null; };

for (const y of years) {
  const rows = songs.filter(s => s.year === y).map(s => {
    const total = sum(S, s);
    const before = P ? sum(P, s) : null;
    const delta = before === null ? null : total - before;
    const deltaPrev = (P && P2) ? sum(P, s) - sum(P2, s) : null;
    const perDay = delta === null ? null : delta / Math.max(span, 1);
    const flags = [];
    if (delta !== null && delta < 0) flags.push('감소(영상 교체/삭제 의심)');
    if (delta !== null && deltaPrev !== null && deltaPrev > 0 && delta > deltaPrev * SPIKE_X) flags.push('급등(확인 필요)');
    const missing = [s.mv_id, s.topic_id].filter(Boolean).filter(id => !S[id]);
    if (missing.length) flags.push(`사라진 영상 ${missing.length}개`);
    return { then_rank: s.then_rank, title: s.title, artist: s.artist, mv_id: s.mv_id || null, topic_id: s.topic_id || null, total, delta, per_day: perDay === null ? null : Math.round(perDay), flags };
  });
  // 정렬: 증가분(없으면 누적) 내림차순. 감소/확인필요 곡은 순위에서 보류
  const key = r => (r.delta ?? r.total);
  const ok = rows.filter(r => !r.flags.length), hold = rows.filter(r => r.flags.length);
  ok.sort((a, b) => key(b) - key(a));
  const last = loadLatest(y); const lastRank = Object.fromEntries((last?.chart || []).map(c => [c.title + '|' + c.artist, c.now_rank]));
  const chart = ok.map((r, i) => ({ now_rank: i + 1, ...r, change_vs_then: r.then_rank - (i + 1), change_vs_last: lastRank[r.title + '|' + r.artist] ? lastRank[r.title + '|' + r.artist] - (i + 1) : null, official: i < RANKED }));
  const out = { year: y, date: cur, basis: P ? `${prev} → ${cur} (${span}일 증가분)` : `${cur} 누적 조회수 (첫 스냅샷, 임시)`, window_days: span, ranked: RANKED, chart, on_hold: hold };
  writeJson(path.join(DIR.charts, String(y), `${cur}.json`), out);
  writeJson(path.join(DIR.charts, String(y), 'latest.json'), out);
  // 사람이 읽는 표
  const fmt = n => n === null ? '-' : n >= 1e4 ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '만' : String(n);
  const arrow = d => d === null ? '' : d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '–';
  const md = [`# ${y}년 노래, 지금 Top ${RANKED}`, '', `기준: ${out.basis} · 유튜브 공식 영상 조회수(MV + Topic 합산)`, '', '| 지금 | 곡 | 가수 | 7일 증가 | 그때 | 그때 대비 | 지난주 대비 |', '|---:|---|---|---:|---:|:--:|:--:|',
    ...chart.slice(0, RANKED).map(c => `| ${c.now_rank} | ${c.title} | ${c.artist} | ${fmt(c.delta ?? c.total)} | ${c.then_rank}위 | ${arrow(c.change_vs_then)} | ${arrow(c.change_vs_last)} |`),
    '', hold.length ? `보류 ${hold.length}곡: ` + hold.map(h => `${h.title}(${h.flags.join(', ')})`).join(' · ') : '보류 곡 없음', ''].join('\n');
  fs.writeFileSync(path.join(DIR.charts, String(y), 'latest.md'), md);
  const top = chart[0]; const mover = [...chart].filter(c => c.change_vs_then !== null).sort((a, b) => b.change_vs_then - a.change_vs_then)[0];
  console.log(`${y}: ${chart.length}곡 집계, 보류 ${hold.length} · 1위 ${top?.title ?? '-'}` + (mover ? ` · 최대 역주행 ${mover.title} (그때 ${mover.then_rank}위 → 지금 ${mover.now_rank}위)` : ''));
}
console.log(`기준 ${P ? `${prev} → ${cur}` : cur + ' (첫 스냅샷)'}`);
