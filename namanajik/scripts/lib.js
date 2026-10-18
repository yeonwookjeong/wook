// 공용 유틸: CSV, 곡/차트 목록, 날짜, 유튜브 API
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR = {
  lists: path.join(ROOT, 'data/lists'),        // 차트 목록: 2005-10.csv (월간), 2005.csv (연간)
  snapshots: path.join(ROOT, 'data/snapshots'),
  charts: path.join(ROOT, 'data/charts'),
  mapping: path.join(ROOT, 'data/mapping'),
};
export const SONGS_FILE = path.join(ROOT, 'data/songs.csv');   // 고유 곡 1줄씩 (영상 ID 포함)

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
  if (!rows.length) return [];
  const header = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r => Object.fromEntries(header.map((h, k) => [h, (r[k] ?? '').trim()])));
}
const esc = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
export function toCsv(rows, header) {
  return [header.join(','), ...rows.map(r => header.map(h => esc(r[h])).join(','))].join('\n') + '\n';
}

// ---------- 곡 키 ----------
// 같은 곡을 여러 차트에서 한 곡으로 묶기 위한 키: 곡명+가수를 소문자, 공백/기호 제거
export const songKey = (title, artist) => (title + '|' + artist).toLowerCase().replace(/\s+/g, '').replace(/[“”"'`’‘.,!?~\-_()\[\]…·:;]/g, '');

// ---------- 곡 목록 ----------
export const SONG_HEADER = ['song_id', 'title', 'artist', 'mv_id', 'topic_id', 'search_done', 'note'];
export function loadSongs() {
  if (!fs.existsSync(SONGS_FILE)) return [];
  return parseCsv(fs.readFileSync(SONGS_FILE, 'utf8')).filter(s => s.song_id);
}
export function saveSongs(rows) {
  fs.mkdirSync(path.dirname(SONGS_FILE), { recursive: true });
  fs.writeFileSync(SONGS_FILE, toCsv(rows, SONG_HEADER), 'utf8');
}

// ---------- 차트 목록 (연간 2005.csv / 월간 2005-10.csv) ----------
export const LIST_HEADER = ['rank', 'song_id', 'title', 'artist'];
export function listNames() {
  if (!fs.existsSync(DIR.lists)) return [];
  return fs.readdirSync(DIR.lists).filter(f => /^\d{4}(-\d{2})?\.csv$/.test(f)).map(f => f.slice(0, -4)).sort();
}
export function loadList(name) {
  return parseCsv(fs.readFileSync(path.join(DIR.lists, `${name}.csv`), 'utf8')).map(r => ({ ...r, rank: Number(r.rank) }));
}
export function saveList(name, rows) {
  fs.mkdirSync(DIR.lists, { recursive: true });
  fs.writeFileSync(path.join(DIR.lists, `${name}.csv`), toCsv(rows, LIST_HEADER), 'utf8');
}
// "2005-10" → "2005년 10월", "2005" → "2005년"
export const listLabel = name => name.length === 7 ? `${name.slice(0, 4)}년 ${Number(name.slice(5))}월` : `${name}년`;

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
    if (res.status === 403 && /quota/i.test(body)) { lastErr.quota = true; throw lastErr; }
    if (res.status < 500 && res.status !== 429) throw lastErr;
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw lastErr;
}

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
export const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeJson = (p, obj) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 1) + '\n'); };
