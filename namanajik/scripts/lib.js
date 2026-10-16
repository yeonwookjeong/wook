// 공용 유틸: CSV 읽기/쓰기, 날짜, 유튜브 API 호출
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR = {
  songs: path.join(ROOT, 'data/songs'),
  snapshots: path.join(ROOT, 'data/snapshots'),
  charts: path.join(ROOT, 'data/charts'),
  mapping: path.join(ROOT, 'data/mapping'),
};

// .env 파일이 있으면 읽어서 process.env에 채움 (GitHub Actions에서는 Secrets가 대신 들어옴)
export function loadEnv() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ---------- CSV ----------
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r => Object.fromEntries(header.map((h, k) => [h, (r[k] ?? '').trim()])));
}
const esc = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
export function toCsv(rows, header) {
  return [header.join(','), ...rows.map(r => header.map(h => esc(r[h])).join(','))].join('\n') + '\n';
}

export const SONG_HEADER = ['year', 'then_rank', 'title', 'artist', 'mv_id', 'topic_id', 'search_done', 'note'];

// data/songs/*.csv 전부 읽기 (TEMPLATE 제외). 연도는 파일명이 아니라 year 컬럼 기준.
export function loadSongs() {
  if (!fs.existsSync(DIR.songs)) return [];
  const files = fs.readdirSync(DIR.songs).filter(f => /^\d{4}\.csv$/.test(f)).sort();
  const songs = [];
  for (const f of files) {
    for (const r of parseCsv(fs.readFileSync(path.join(DIR.songs, f), 'utf8'))) {
      r.year = Number(r.year); r.then_rank = Number(r.then_rank); r._file = f;
      if (!r.year || !r.title) continue;
      songs.push(r);
    }
  }
  return songs;
}
export function saveSongsFile(file, rows) {
  fs.writeFileSync(path.join(DIR.songs, file), toCsv(rows, SONG_HEADER), 'utf8');
}

// ---------- 날짜 ----------
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---------- 유튜브 API ----------
export async function yt(endpoint, params) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY가 없습니다. .env 또는 GitHub Secrets를 확인하세요.');
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries({ ...params, key })) if (v !== undefined) url.searchParams.set(k, String(v));
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    const body = await res.text();
    lastErr = new Error(`YouTube API ${res.status} ${endpoint}: ${body.slice(0, 300)}`);
    if (res.status === 403 && /quota/i.test(body)) { lastErr.quota = true; throw lastErr; } // 쿼터 소진은 재시도 무의미
    if (res.status < 500 && res.status !== 429) throw lastErr;
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw lastErr;
}

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
export const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeJson = (p, obj) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 1) + '\n'); };
