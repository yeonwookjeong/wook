import { salsAt, type Sal } from "@/lib/deep";
import { ELEMENT_KO, readChart } from "@/lib/myeongri";
import type { Person } from "@/lib/pairToken";
import type { Pillars } from "@/lib/saju";
import { dayPillar, todayFor } from "@/lib/today";
import data from "./data/regions.json";

// 내 사주 명당: each 시군구 scored from home, in two layers of the same direction.
//  1. 사주 오행 (50%): the direction read as the five elements (풍수 방위: 북 수, 북동 토, 동 목, 남동 목, 남 화,
//     남서 토, 서 금, 북서 금) against what this chart needs (lib/myeongri.ts readChart: 용신, 희신, 기신).
//  2. 팔택 (50%): the same direction as one of the eight stars of the reader's 명괘 (팔택명경 하권 57쪽 총표,
//     jojeong/knowledge/notes-bazhai.md on claude/saju-db). Needs the gender; without it the first layer alone.
// The place name's characters are not read (decided 2026-11-07: not convincing).

export type Region = { code: string; sido: string; name: string; lon: number; lat: number; d: string };
export const MAP = data as { w: number; h: number; asOf: string; regions: Region[] };
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

// 팔택: 명괘 (1 坎 2 坤 3 震 4 巽 6 乾 7 兌 8 艮 9 離) from the 사주 year (입춘) and gender. The usual reduction of
// the year, which agrees with the book's 삼원 tables (1984, 하원 start: male 兌, female 艮); 5 is 坤 for men, 艮 for
// women.
export const GUA = ["", "坎", "坤", "震", "巽", "", "乾", "兌", "艮", "離"] as const;
export type Gua = { n: number; name: string; east: boolean };

export function sajuYear(p: Person): number | null {
  if (p.birthYear === null) return null;
  for (const y of [p.birthYear, p.birthYear - 1]) if ((((y - 4) % 12) + 12) % 12 === p.pillars.yearBranch) return y;
  return null;
}
export function guaNumber(year: number, gender: "m" | "f"): number {
  const r = (((year % 9) + 9) % 9);
  let n = gender === "m" ? (11 - r) % 9 : (r + 4) % 9;
  if (n === 0) n = 9;
  if (n === 5) n = gender === "m" ? 2 : 8;
  return n;
}
export function guaOf(p: Person): Gua | null {
  const y = sajuYear(p);
  if (y === null || !p.gender) return null;
  const n = guaNumber(y, p.gender);
  return { n, name: GUA[n], east: [1, 3, 4, 9].includes(n) };
}

// The eight stars by direction (북, 북동, 동, 남동, 남, 남서, 서, 북서), 57쪽 총표.
export type Star = "생기" | "천의" | "연년" | "복위" | "화해" | "육살" | "오귀" | "절명";
const BAZHAI: Record<number, Star[]> = {
  6: ["육살", "천의", "오귀", "화해", "절명", "연년", "생기", "복위"],
  1: ["복위", "오귀", "천의", "생기", "연년", "절명", "화해", "육살"],
  8: ["오귀", "복위", "육살", "절명", "화해", "생기", "연년", "천의"],
  3: ["천의", "육살", "복위", "연년", "생기", "화해", "절명", "오귀"],
  4: ["생기", "절명", "연년", "복위", "천의", "오귀", "육살", "화해"],
  9: ["연년", "화해", "생기", "천의", "복위", "육살", "오귀", "절명"],
  2: ["절명", "생기", "화해", "오귀", "육살", "복위", "천의", "연년"],
  7: ["화해", "연년", "절명", "육살", "오귀", "천의", "복위", "생기"],
};
const STAR_SCORE: Record<Star, number> = { 생기: 100, 천의: 90, 연년: 84, 복위: 72, 화해: 42, 육살: 34, 오귀: 26, 절명: 14 };
export const STAR_LINE: Record<Star, string> = {
  생기: "기운이 살아나는 방향(생기)이에요. 팔택에서 가장 좋게 보는 방위예요",
  천의: "몸과 마음을 돌보는 방향(천의)이에요",
  연년: "사람과 오래 가는 방향(연년)이에요",
  복위: "편안히 머무는 방향(복위)이에요",
  화해: "작은 마찰이 생기기 쉬운 방향(화해)이에요",
  육살: "어수선해지기 쉬운 방향(육살)이에요",
  오귀: "말이 많아지기 쉬운 방향(오귀)이에요",
  절명: "팔택에서 가장 피하라고 하는 방향(절명)이에요",
};
export const starAt = (g: Gua, dirIndex: number): Star => BAZHAI[g.n][dirIndex];
export const goodStars = (g: Gua) => DIRS.map((d, i) => ({ dir: d.name, star: starAt(g, i) })).filter((x) => STAR_SCORE[x.star] >= 72);

export type Scored = Region & {
  score: number | null; // 0–100, one decimal kept so near places part
  dir: string | null;
  dirEl: number | null;
  star: Star | null;
  km: number;
};

const kmBetween = (a: Region, b: Region) => {
  const dy = (b.lat - a.lat) * 111;
  const dx = (b.lon - a.lon) * 111 * Math.cos(((a.lat + b.lat) / 2) * RAD);
  return Math.round(Math.hypot(dx, dy));
};

function scoreOne(base: Region, to: Region, n: Need, g: Gua | null): Scored {
  const km = kmBetween(base, to);
  const deg = bearing(base, to);
  if (deg === null) return { ...to, score: null, dir: null, dirEl: null, star: null, km };
  // The two nearest directions blended by angle, so the map shades smoothly instead of in eight wedges.
  const i = Math.floor(deg / 45) % 8;
  const t = (deg - DIRS[i].deg) / 45;
  const el = elementScore(DIRS[i].el, n) * (1 - t) + elementScore(DIRS[(i + 1) % 8].el, n) * t;
  const di = Math.round(deg / 45) % 8;
  const star = g ? starAt(g, di) : null;
  const s = star ? el * 0.5 + STAR_SCORE[star] * 0.5 : el;
  const d = DIRS[di];
  return { ...to, score: Math.round(s * 10) / 10, dir: d.name, dirEl: d.el, star, km };
}

export const scoreAll = (base: Region, n: Need, g: Gua | null): Scored[] => MAP.regions.map((r) => scoreOne(base, r, n, g));

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

// Why this place, in one or two plain lines: the direction's element, then its 팔택 star.
export function whyOf(r: Scored, n: Need): string[] {
  const out: string[] = [];
  if (r.dirEl !== null) {
    const fit = r.dirEl === n.yong ? "가장 필요한" : r.dirEl === n.hee ? "두 번째로 필요한" : r.dirEl === n.gi ? "넘치면 버거운" : "무난한";
    out.push(`${r.dir}쪽은 ${elName(r.dirEl)} 기운의 방향, ${fit} 기운이에요`);
  }
  if (r.star) out.push(`팔택으로는 ${STAR_LINE[r.star]}`);
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

// 이번 주말 명당: the coming Saturday and Sunday, each read for this chart (the day's score from the site's 오늘의
// 운세, lib/today.ts todayFor), how far to go by the 살 the day wakes (역마: far, 화개: near, else a half day), and
// the best-scored places at that distance. Distances are straight lines between 시군구 centres.
export type Band = { key: "near" | "mid" | "far"; label: string; min: number; max: number };
const BANDS: Record<Band["key"], Band> = {
  near: { key: "near", label: "1시간 안팎", min: 10, max: 45 },
  mid: { key: "mid", label: "반나절", min: 30, max: 120 },
  far: { key: "far", label: "하루 코스", min: 100, max: 260 },
};
// The kind of place that brings in the needed element (a customary reading, worded softly on screen).
export const PLACE_KIND = ["숲길, 수목원, 공원", "야경, 축제, 따뜻한 남쪽", "들판, 낮은 산, 흙길 산책", "바위산, 전시, 도심 거리", "바다, 강, 호수, 온천"];

export type WeekendDay = { date: string; weekday: string; score: number | null; tone: string; sals: Sal[]; band: Band; why: string; places: Scored[] };

function kstDay(offset: number, now: Date) {
  const k = new Date(now.getTime() + 9 * 3600000 + offset * 86400000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate(), w: k.getUTCDay() };
}

export function weekendPlan(me: Person, all: Scored[], now = new Date()): WeekendDay[] {
  const days: ReturnType<typeof kstDay>[] = [];
  for (let i = 0; i < 8 && days.length < 2; i++) {
    const k = kstDay(i, now);
    if (k.w === 6 || k.w === 0) days.push(k);
  }
  const used = new Set<string>();
  return days.map((k) => {
    // Noon KST of that day, so todayFor reads that date.
    const t = todayFor(me, new Date(Date.UTC(k.y, k.m - 1, k.d, 3)));
    const sals = salsAt(me.pillars, dayPillar(k.y, k.m, k.d).branch).filter((s) => s !== "공망");
    const band = sals.includes("역마") ? BANDS.far : sals.includes("화개") ? BANDS.near : BANDS.mid;
    const why = sals.includes("역마")
      ? "역마가 깨어나는 날이라 멀리 갈수록 기운이 풀려요"
      : sals.includes("화개")
        ? "화개가 드는 날이라 가까운 곳에서 조용히 쉬기 좋아요"
        : sals.includes("도화")
          ? "도화가 도는 날이라 사람 많은 곳, 같이 가는 나들이가 좋아요"
          : "반나절 거리로 가볍게 다녀오기 좋은 날이에요";
    const tone = t.score === null ? "" : t.score >= 70 ? "나들이에 좋은 날" : t.score >= 50 ? "무난한 날" : "가볍게 쉬어 가는 날";
    const pool = ranked(all).filter((r) => r.km >= band.min && r.km <= band.max && !used.has(r.code));
    const seen = new Set<string>();
    const places = pool.filter((r) => !seen.has(r.sido) && !!seen.add(r.sido)).slice(0, 2);
    places.forEach((r) => used.add(r.code));
    return { date: `${k.m}월 ${k.d}일`, weekday: "일월화수목금토"[k.w], score: t.score, tone, sals, band, why, places };
  });
}
export const guaFromNumber = (n: number | null): Gua | null => (n && GUA[n] ? { n, name: GUA[n], east: [1, 3, 4, 9].includes(n) } : null);
