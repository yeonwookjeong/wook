import { ELEMENT_KO, readChart } from "@/lib/myeongri";
import type { Pillars } from "@/lib/saju";
import data from "./data/regions.json";
import names from "./data/names.json";

// 내 사주 동네: each 시군구 scored by what this chart needs, in two layers.
//  1. 방향 (60%): where the place lies from home, read as the five elements' directions (풍수 방위: 북 수, 북동 토,
//     동 목, 남동 목, 남 화, 남서 토, 서 금, 북서 금). Only the direction counts, never the distance.
//  2. 이름 (40%): the elements in the place name's own characters (자원오행, jojeong/lib/naming/hanja.tsv via
//     scripts/names.py). A name with no such character leaves the score to the direction alone.
// The need is the engine's own reading (lib/myeongri.ts readChart): 용신 first, 희신 next, 기신 last.

export type Region = { code: string; sido: string; name: string; lon: number; lat: number; d: string };
export const MAP = data as { w: number; h: number; asOf: string; regions: Region[] };
const NAMES = names as Record<string, { h: string; el: number[] }>;
export const byCode = (code: string | null | undefined) => MAP.regions.find((r) => r.code === code) ?? null;

// The same projection as scripts/regions2026.py (width 600, east–west shrunk at 36°N), for drawing a point.
const LON0 = 124.55, LON1 = 131.0, LAT1 = 38.65;
const KX = Math.cos(36 * (Math.PI / 180));
const SX = 600 / ((LON1 - LON0) * KX);
export const proj = (r: Region) => ({ x: (r.lon - LON0) * KX * SX, y: (LAT1 - r.lat) * SX });

export const EL_HANJA = ["木", "火", "土", "金", "水"];
export const EL_PLAIN = ["나무", "불", "흙", "쇠", "물"];
export const elName = (el: number) => `${EL_PLAIN[el]}(${EL_HANJA[el]})`;
export const label = (r: Region) => `${r.sido} ${r.name}`;
export const SIDOS = [...new Set(MAP.regions.map((r) => r.sido))];

// Clockwise from north, every 45°.
const DIRS: { deg: number; el: number; name: string }[] = [
  { deg: 0, el: 4, name: "북" },
  { deg: 45, el: 2, name: "북동" },
  { deg: 90, el: 0, name: "동" },
  { deg: 135, el: 0, name: "남동" },
  { deg: 180, el: 1, name: "남" },
  { deg: 225, el: 2, name: "남서" },
  { deg: 270, el: 3, name: "서" },
  { deg: 315, el: 3, name: "북서" },
];
export const dirsOf = (el: number) => DIRS.filter((d) => d.el === el).map((d) => `${d.name}쪽`).join(", ");

export type Need = { yong: number; hee: number; gi: number; short: number; heavy: number };

export function needOf(p: Pillars): Need | null {
  const r = readChart(p);
  if (!r) return null;
  const e = r.elements;
  return { yong: r.yong, hee: r.hee, gi: r.gi, heavy: e.indexOf(Math.max(...e)), short: e.indexOf(Math.min(...e)) };
}

// One element's fit, 0–100: 용신 best, 희신 next, 기신 worst, the element feeding the 기신 low, the rest between.
export function elementScore(el: number, n: Need): number {
  if (el === n.yong) return 96;
  if (el === n.hee) return 84;
  if (el === n.gi) return 30;
  if (el === (n.gi + 4) % 5) return 50;
  return 64;
}

const RAD = Math.PI / 180;
export function bearing(a: Region, b: Region): number | null {
  const dx = (b.lon - a.lon) * Math.cos(36 * RAD);
  const dy = b.lat - a.lat;
  if (Math.hypot(dx, dy) < 0.06) return null; // next door: no direction to speak of
  return (Math.atan2(dx, dy) / RAD + 360) % 360;
}
const dirOf = (deg: number) => DIRS[Math.round(deg / 45) % 8];

export type Scored = Region & {
  score: number | null; // 0–100, one decimal kept so near places part
  dir: string | null;
  dirEl: number | null;
  nameEls: number[];
  hanja: string;
};

function scoreOne(base: Region, to: Region, n: Need): Scored {
  const nm = NAMES[to.code] ?? { h: "", el: [] };
  const deg = bearing(base, to);
  if (deg === null) return { ...to, score: null, dir: null, dirEl: null, nameEls: nm.el, hanja: nm.h };
  // The two nearest directions blended by angle, so the map shades smoothly instead of in eight wedges.
  const i = Math.floor(deg / 45) % 8;
  const t = (deg - DIRS[i].deg) / 45;
  const dir = elementScore(DIRS[i].el, n) * (1 - t) + elementScore(DIRS[(i + 1) % 8].el, n) * t;
  const name = nm.el.length ? nm.el.reduce((s, e) => s + elementScore(e, n), 0) / nm.el.length : null;
  const s = name === null ? dir : dir * 0.6 + name * 0.4;
  const d = dirOf(deg);
  return { ...to, score: Math.round(s * 10) / 10, dir: d.name, dirEl: d.el, nameEls: nm.el, hanja: nm.h };
}

export const scoreAll = (base: Region, n: Need): Scored[] => MAP.regions.map((r) => scoreOne(base, r, n));

const order = (a: Scored, b: Scored) => b.score! - a.score! || a.code.localeCompare(b.code);
export const ranked = (all: Scored[]) => all.filter((x) => x.score !== null).sort(order);

// The top places, one per 시도 so the list is not five 구 of one city.
export function topPlaces(all: Scored[], k = 5): Scored[] {
  const seen = new Set<string>();
  const out: Scored[] = [];
  for (const r of ranked(all)) {
    if (seen.has(r.sido)) continue;
    seen.add(r.sido);
    out.push(r);
    if (out.length === k) break;
  }
  return out;
}

export function rankOf(all: Scored[], code: string): { rank: number; of: number } | null {
  const list = ranked(all);
  const i = list.findIndex((r) => r.code === code);
  return i < 0 ? null : { rank: i + 1, of: list.length };
}

// Why this place, in one or two plain lines: the direction's element, then the name's.
export function whyOf(r: Scored, n: Need): string[] {
  const out: string[] = [];
  if (r.dirEl !== null) {
    const fit = r.dirEl === n.yong ? "가장 필요한" : r.dirEl === n.hee ? "두 번째로 필요한" : r.dirEl === n.gi ? "넘치면 버거운" : "무난한";
    out.push(`${r.dir}쪽은 ${elName(r.dirEl)} 기운의 방향, ${fit} 기운이에요`);
  }
  if (r.nameEls.length) {
    const els = [...new Set(r.nameEls)];
    const good = els.filter((e) => e === n.yong || e === n.hee);
    const bad = els.filter((e) => e === n.gi);
    const what = els.map(elName).join(", ");
    out.push(
      good.length
        ? `이름 ${r.hanja}에 ${what} 기운이 들어 있어 한 번 더 채워 줘요`
        : bad.length
          ? `이름 ${r.hanja}에 ${what} 기운이 들어 있어 조금 덜어 내요`
          : `이름 ${r.hanja}에 ${what} 기운이 들어 있어요`,
    );
  } else out.push(`이름 ${r.hanja}에는 따로 드러난 오행이 없어 방향만 봤어요`);
  return out;
}

// Two people: each from their own home. Both have to be pleased: a place loved by one and disliked by the other
// sinks.
export type Pair = Scored & { mine: number; theirs: number };
export function pairPlaces(a: Scored[], b: Scored[], k = 3): Pair[] {
  const theirs = new Map(b.map((r) => [r.code, r.score]));
  const out: Pair[] = [];
  for (const r of a) {
    const t = theirs.get(r.code);
    if (r.score === null || t === null || t === undefined) continue;
    out.push({ ...r, mine: r.score, theirs: t, score: Math.round(((r.score + t) / 2 - Math.abs(r.score - t) * 0.25) * 10) / 10 });
  }
  out.sort((x, y) => y.score! - x.score! || x.code.localeCompare(y.code));
  const seen = new Set<string>();
  return out.filter((r) => !seen.has(r.sido) && !!seen.add(r.sido)).slice(0, k);
}

export const weakSide = (n: Need) => dirsOf(n.gi);
export { ELEMENT_KO };
