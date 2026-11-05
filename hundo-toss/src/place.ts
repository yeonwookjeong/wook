import { ELEMENT_KO, readChart } from "@/lib/myeongri";
import type { Pillars } from "@/lib/saju";
import data from "./data/regions.json";

// 내 사주에 맞는 동네: where a place lies from where one lives, read as the five elements' directions (풍수 방위:
// 북 수, 북동 토, 동 목, 남동 목, 남 화, 남서 토, 서 금, 북서 금), then scored by what this chart needs. The need
// is the engine's own reading (lib/myeongri.ts readChart): 용신 first, 희신 next, 기신 last, the same three the
// site's reports use. Only the direction counts, never the distance; a place right beside home has no direction.

export type Region = { code: string; sido: string; name: string; lon: number; lat: number; d: string };
export const MAP = data as { w: number; h: number; regions: Region[] };

// The same projection as scripts/regions.py (width 600, east–west shrunk at 36°N), for drawing a point on the map.
const LON0 = 124.55, LON1 = 131.0, LAT1 = 38.65;
const KX = Math.cos(36 * (Math.PI / 180));
const SX = 600 / ((LON1 - LON0) * KX);
export const proj = (r: Region) => ({ x: (r.lon - LON0) * KX * SX, y: (LAT1 - r.lat) * SX });

export const EL_HANJA = ["木", "火", "土", "金", "水"];
export const EL_PLAIN = ["나무", "불", "흙", "쇠", "물"];

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

export type Need = { yong: number; hee: number; gi: number; heavy: number; elements: number[] };

// What this chart needs, by element. `heavy`: the element it has most of (shown as why the 기신 side is heavy).
export function needOf(p: Pillars): Need | null {
  const r = readChart(p);
  if (!r) return null;
  const elements = r.elements;
  const heavy = elements.indexOf(Math.max(...elements));
  return { yong: r.yong, hee: r.hee, gi: r.gi, heavy, elements };
}

// One element's fit, 0–100: 용신 best, 희신 next, 기신 worst, the rest between.
export function elementScore(el: number, n: Need): number {
  if (el === n.yong) return 96;
  if (el === n.hee) return 84;
  if (el === n.gi) return 30;
  // The element that feeds the 기신 leans the wrong way a little.
  if (el === (n.gi + 4) % 5) return 50;
  return 64;
}

const RAD = Math.PI / 180;

// Compass bearing from a to b (0 = north), on a flat map shrunk east–west at Korea's latitude.
export function bearing(a: Region, b: Region): number | null {
  const dx = (b.lon - a.lon) * Math.cos(36 * RAD);
  const dy = b.lat - a.lat;
  if (Math.hypot(dx, dy) < 0.06) return null; // next door: no direction to speak of
  return (Math.atan2(dx, dy) / RAD + 360) % 360;
}

export function dirOf(deg: number) {
  return DIRS[Math.round(deg / 45) % 8];
}

// A place's score: the two nearest directions blended by angle, so the map shades smoothly instead of in eight
// wedges.
export function placeScore(base: Region, to: Region, n: Need): { score: number; dir: string; el: number } | null {
  const deg = bearing(base, to);
  if (deg === null) return null;
  const i = Math.floor(deg / 45) % 8;
  const t = (deg - DIRS[i].deg) / 45;
  const s = elementScore(DIRS[i].el, n) * (1 - t) + elementScore(DIRS[(i + 1) % 8].el, n) * t;
  const d = dirOf(deg);
  return { score: Math.round(s), dir: d.name, el: d.el };
}

export type Scored = Region & { score: number | null; dir: string | null; el: number | null };

export function scoreAll(base: Region, n: Need): Scored[] {
  return MAP.regions.map((r) => {
    const s = placeScore(base, r, n);
    return { ...r, score: s?.score ?? null, dir: s?.dir ?? null, el: s?.el ?? null };
  });
}

// The top places, one per 시도 so the list is not five 구 of one city.
export function topPlaces(all: Scored[], k = 5): Scored[] {
  const seen = new Set<string>();
  const out: Scored[] = [];
  for (const r of [...all].filter((x) => x.score !== null).sort((a, b) => b.score! - a.score! || a.code.localeCompare(b.code))) {
    if (seen.has(r.sido)) continue;
    seen.add(r.sido);
    out.push(r);
    if (out.length === k) break;
  }
  return out;
}

// The direction to go easy on: the 기신's own.
export function weakSide(n: Need): string {
  return DIRS.filter((d) => d.el === n.gi).map((d) => `${d.name}쪽`).join(", ");
}

export const elName = (el: number) => `${ELEMENT_KO[el]}(${EL_PLAIN[el]})`;
export const label = (r: Region) => `${r.sido} ${r.name}`;
export const SIDOS = [...new Set(MAP.regions.map((r) => r.sido))];
