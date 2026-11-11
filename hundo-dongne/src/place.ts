import { josa } from "@/lib/josa";
import { salsAt, type Sal } from "@/lib/deep";
import { ELEMENT_KO, readChart } from "@/lib/myeongri";
import type { Person } from "@/lib/pairToken";
import type { Pillars } from "@/lib/saju";
import { dayPillar, todayFor } from "@/lib/today";
import data from "./data/regions.json";
import landData from "./data/land.json";

// 내 사주 명당: each 시군구 scored by its own ground, read as the five elements, against what this chart needs
// (lib/myeongri.ts readChart: 용신, 희신, 기신). The same for a reader wherever they live (decided 2026-11-10: the
// direction from home says nothing about the place itself). The ground (scripts/land2026.py): the land's own use from
// the 지적통계 (임야, 논밭, 물, 집터와 길, 공장) with the DEM's mountains and the sea, rivers and lakes:
//   목 숲(임야)과 산, 화 남쪽 볕과 번화한 불빛(집터와 길), 토 논밭, 금 바위산과 공장, 수 바다 강 호수 저수지.
// 배산임수 (mountains and water together) adds a little.
// The direction from home is kept for 이사 방향 점검 only: its element and its 팔택 star (팔택명경 하권 57쪽 총표,
// jojeong/knowledge/notes-bazhai.md on claude/saju-db). The place name's characters are not read (2026-11-07).

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

export type Need = { yong: number; hee: number; gi: number; short: number; heavy: number; elements: number[] };

export function needOf(p: Pillars): Need | null {
  const r = readChart(p);
  if (!r) return null;
  const e = r.elements;
  return { yong: r.yong, hee: r.hee, gi: r.gi, heavy: e.indexOf(Math.max(...e)), short: e.indexOf(Math.min(...e)), elements: [...e] };
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
const GUA_KO: Record<string, string> = { 坎: "감", 坤: "곤", 震: "진", 巽: "손", 乾: "건", 兌: "태", 艮: "간", 離: "리" };
export const guaLabel = (g: Gua) => `${GUA_KO[g.name]}(${g.name})괘`;

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

export type Use = { forest: number; farm: number; water: number; town: number; factory: number };
export type Land = { el: number; top: number; mt: number; rock: number; flat: number; sea: number; flow: number; ne: number; res: number; dam: string[]; use: Use | null; spa: number; lat: number; climate: Climate };
// 1991~2020 평년값 from the nearest KMA station: yearly mean temperature (°C), rain (mm), sunshine (hours).
export type Climate = { temp: number; rain: number; sun: number };
const LAND = (landData as { regions: Record<string, Land> }).regions;

// Each region's ground as five shares 0–1 (목 화 토 금 수), ranked against the whole country so each reads "how much
// of this, for Korea".
const pctOf = (vals: number[]) => {
  const sorted = [...vals].sort((a, b) => a - b);
  return (v: number) => (sorted.length < 2 ? 0.5 : sorted.findLastIndex((x) => x <= v) / (sorted.length - 1));
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const LANDS = MAP.regions.map((r) => LAND[r.code]).filter(Boolean);
const pMt = pctOf(LANDS.map((l) => l.mt)), pTop = pctOf(LANDS.map((l) => l.top)), pRock = pctOf(LANDS.map((l) => l.rock)), pFlat = pctOf(LANDS.map((l) => l.flat));
const useOf = (l: Land): Use => l.use ?? { forest: 0, farm: 0, water: 0, town: 0, factory: 0 };
const pTemp = pctOf(LANDS.map((l) => l.climate.temp)), pSun = pctOf(LANDS.map((l) => l.climate.sun)), pRain = pctOf(LANDS.map((l) => l.climate.rain));
const pForest = pctOf(LANDS.map((l) => useOf(l).forest)), pFarm = pctOf(LANDS.map((l) => useOf(l).farm)), pTown = pctOf(LANDS.map((l) => useOf(l).town)), pFactory = pctOf(LANDS.map((l) => useOf(l).factory));
// Water, the strongest of: the sea at the border; the biggest river through it (the DEM's drainage, or a big river
// Natural Earth names running 10 km or more through it, taken as 10,000 km²; 100 km² reads 0, 10,000 km² reads 1); a big dam lake (0.9); the farm
// reservoirs' full surface (about 30 ha reads 0, 1,500 ha reads 1).
const waterOf = (l: Land) =>
  Math.max(
    clamp01(l.sea / 40),
    clamp01((Math.log10(Math.max(l.flow, l.ne >= 10 ? 10000 : 0, 1)) - 2) / 2),
    l.dam.length ? 0.9 : 0,
    clamp01((Math.log10(l.res + 1) - 1.5) / 1.7),
    clamp01(useOf(l).water / 15), // rivers, ponds and ditches as a share of the land (지적통계)
    0.6 * pRain(l.climate.rain), // a wet sky: the rainiest places read up to 0.6, never as much as a river
  );
export function groundOf(code: string): number[] | null {
  const l = LAND[code];
  if (!l) return null;
  const u = useOf(l);
  const mount = (pMt(l.mt) + pTop(l.top)) / 2;
  return [
    0.6 * pForest(u.forest) + 0.4 * mount, // 목: 숲과 산
    0.35 * pTemp(l.climate.temp) + 0.25 * pSun(l.climate.sun) + 0.4 * pTown(u.town), // 화: 따뜻함, 볕, 번화한 불빛
    0.8 * pFarm(u.farm) + 0.2 * pFlat(l.flat), // 토: 논밭과 들
    0.5 * pRock(l.rock) + 0.5 * pFactory(u.factory), // 금: 바위산, 공장
    waterOf(l), // 수
  ];
}

// A place for this chart: the 용신 counts most, then the 희신; the 기신 and what feeds it count against.
const weightsOf = (n: Need) => [0, 1, 2, 3, 4].map((e) => (e === n.yong ? 1 : e === n.hee ? 0.6 : e === n.gi ? -0.8 : e === (n.gi + 4) % 5 ? -0.3 : 0.15));
// 배산임수: mountains behind and water before, both strong for Korea (48 of the 256).
const isBaesan = (g: number[]) => g[0] >= 0.65 && g[4] >= 0.6;
function fitOf(g: number[], n: Need): number {
  const w = weightsOf(n);
  return g.reduce((s, v, e) => s + v * w[e], 0) + (isBaesan(g) ? 0.15 : 0);
}

export type Scored = Region & {
  score: number | null; // 0–100 over the country, one decimal kept so near places part
  ground: number[] | null;
  baesan: boolean;
  // The way from home, for 이사 방향 점검 and the weekend's distance: never in the score.
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

function wayFrom(base: Region, to: Region, g: Gua | null) {
  const deg = bearing(base, to);
  if (deg === null) return { dir: null, dirEl: null, star: null };
  const di = Math.round(deg / 45) % 8;
  return { dir: DIRS[di].name, dirEl: DIRS[di].el, star: g ? starAt(g, di) : null };
}

export function scoreAll(base: Region | null, n: Need, g: Gua | null): Scored[] {
  const raw = MAP.regions.map((r) => {
    const ground = groundOf(r.code);
    return { r, ground, fit: ground ? fitOf(ground, n) : null };
  });
  const fits = raw.flatMap((x) => (x.fit === null ? [] : [x.fit]));
  const lo = Math.min(...fits), hi = Math.max(...fits);
  return raw.map(({ r, ground, fit }) => ({
    ...r,
    score: fit === null ? null : Math.round((40 + ((fit - lo) / (hi - lo || 1)) * 58) * 10) / 10,
    ground,
    baesan: Boolean(ground && isBaesan(ground)),
    ...(base ? wayFrom(base, r, g) : { dir: null, dirEl: null, star: null }),
    km: base ? kmBetween(base, r) : 0,
  }));
}

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

// 우리 지역: the places of home's own 시도, ranked. A 시도 with few places (세종, 제주, 대전, 울산) takes in its
// nearest neighbours until there are six, so the list is never one or two lines.
export function localPlaces(all: Scored[], home: Region, min = 6): { list: Scored[]; area: string; mixed: boolean } {
  const list = ranked(all);
  const own = list.filter((r) => r.sido === home.sido);
  if (own.length >= min) return { list: own, area: home.sido, mixed: false };
  const near = list.filter((r) => r.sido !== home.sido).sort((a, b) => a.km - b.km).slice(0, min - own.length);
  return { list: [...own, ...near].sort(order), area: `${home.sido} 근처`, mixed: true };
}

export function rankOf(all: Scored[], code: string): { rank: number; of: number } | null {
  const list = ranked(all);
  const i = list.findIndex((r) => r.code === code);
  return i < 0 ? null : { rank: i + 1, of: list.length };
}

// Why this place, in one or two plain lines: the side of the ground that gives this chart the most, then 배산임수 or
// the next side.
// The reason for a side of the ground, with the place's own figures where it has them.
function groundReason(r: Scored, e: number): string {
  const l = LAND[r.code];
  if (!l) return "";
  const u = useOf(l);
  if (e === 0) return `숲(임야)이 땅의 ${Math.round(u.forest)}%예요`;
  const c = l.climate;
  if (e === 1) {
    if (u.town >= 30) return `집과 길이 땅의 ${Math.round(u.town)}%인 번화한 곳이에요`;
    if (pSun(c.sun) >= pTemp(c.temp)) return `볕이 한 해 ${Math.round(c.sun).toLocaleString()}시간 드는 곳이에요`;
    return `한 해 평균 기온이 ${c.temp.toFixed(1)}도인 따뜻한 곳이에요`;
  }
  if (e === 2) return `논밭이 땅의 ${Math.round(u.farm)}%예요`;
  if (e === 3) return u.factory >= 5 ? `공장 땅이 ${Math.round(u.factory)}%예요` : "바위산이 많아요";
  if (l.dam.length) return `${l.dam.join(", ")}가 있어요`;
  if (l.sea >= 10) return "바다에 닿아 있어요";
  if (waterOf(l) === 0.6 * pRain(c.rain)) return `비가 한 해 ${Math.round(c.rain).toLocaleString()}mm 오는 촉촉한 곳이에요`;
  return "큰 물길이 지나요";
}
// The weather of a place against home's, in plain words (only differences big enough to feel).
export function weatherOf(r: Scored, home: Region | null): string[] {
  const c = LAND[r.code]?.climate;
  if (!c) return [];
  const out = [`한 해 평균 ${c.temp.toFixed(1)}도, 비 ${Math.round(c.rain).toLocaleString()}mm, 볕 ${Math.round(c.sun).toLocaleString()}시간이에요`];
  const h = home ? LAND[home.code]?.climate : null;
  if (h && home && home.code !== r.code) {
    const dt = c.temp - h.temp;
    const ds = c.sun - h.sun;
    const warm = Math.abs(dt) >= 0.8 ? `${Math.abs(dt).toFixed(1)}도 ${dt > 0 ? "따뜻해요" : "서늘해요"}` : "";
    const sun = Math.abs(ds) >= 100 ? `볕이 한 해 ${Math.round(Math.abs(ds))}시간 ${ds > 0 ? "더 들어요" : "덜 들어요"}` : "";
    if (warm && sun) out.push(`${home.name}보다 ${warm.replace(/해요$/, "하고")}, ${sun}`);
    else if (warm || sun) out.push(`${home.name}보다 ${warm || sun}`);
    else out.push(`${josa(home.name, "과/와")} 날씨가 거의 같아요`);
  }
  return out;
}
// What a place is like, in a name: its strongest side for Korea.
export const NICK = ["숲의 고을", "불빛 고을", "들녘 고을", "쇠의 고을", "물의 고을"];
export const nickOf = (r: Scored) => (r.ground ? NICK[r.ground.indexOf(Math.max(...r.ground))] : "");
export const spaOf = (r: Scored) => LAND[r.code]?.spa ?? 0;
export function whyOf(r: Scored, n: Need): string[] {
  if (!r.ground) return [];
  const g = r.ground;
  const w = weightsOf(n);
  const gives = [0, 1, 2, 3, 4].filter((e) => w[e] > 0 && g[e] >= 0.4).sort((a, b) => w[b] - w[a] || g[b] - g[a]);
  const out: string[] = [];
  const say = (e: number) =>
    `${e === n.yong ? "가장 필요한" : e === n.hee ? "두 번째로 필요한" : "도움이 되는"} ${elName(e)} 기운이 넉넉한 땅이에요. ${groundReason(r, e)}`;
  if (gives.length) out.push(say(gives[0]));
  else out.push(`필요한 ${elName(n.yong)} 기운이 조금 드는 무난한 땅이에요`);
  if (r.baesan) out.push(LAND[r.code]?.dam.length ? `산과 ${LAND[r.code].dam.join(", ")}가 함께 있는 배산임수 자리라 기운이 모여요` : "산과 물이 함께 있는 배산임수 자리라 기운이 모여요");
  else if (gives[1] !== undefined) out.push(say(gives[1]));
  if (g[n.gi] >= 0.7) out.push(`다만 넘치면 버거운 ${elName(n.gi)} 기운도 센 곳이에요. ${groundReason(r, n.gi)}`);
  if (spaOf(r) >= 5) out.push(`온천이 ${spaOf(r)}곳 있어 물과 불이 만나는 동네예요`);
  return out;
}

// 이사 방향 점검: from home to this place, its element and its 팔택 star, and this year's 대장군방 and 삼살방
// (흠정협기변방서; 2026 병오년 대장군 동, 삼살 북, 2027 정미년 대장군 동, 삼살 서).
const BAD_WAYS: Record<number, { general: string; samsal: string }> = { 2026: { general: "동", samsal: "북" }, 2027: { general: "동", samsal: "서" } };
export function moveCheck(r: Scored, n: Need, year: number): string[] {
  if (!r.dir || r.dirEl === null) return ["지금 사는 곳과 거의 같은 자리라 방향을 따질 게 없어요"];
  const out: string[] = [];
  const fit = r.dirEl === n.yong ? "가장 필요한" : r.dirEl === n.hee ? "두 번째로 필요한" : r.dirEl === n.gi ? "넘치면 버거운" : "무난한";
  out.push(`${r.dir}쪽으로 가는 길이에요. ${elName(r.dirEl)} 기운의 방향이라 ${fit} 기운이에요`);
  if (r.star) out.push(`팔택으로는 ${STAR_LINE[r.star]}`);
  const bad = BAD_WAYS[year];
  if (bad) {
    const main = r.dir.length === 1 ? r.dir : null;
    if (main === bad.general) out.push(`올해(${year}년)는 ${bad.general}쪽이 대장군방이에요. 옛 책은 이 방향으로 집을 옮기는 일을 꺼려요`);
    if (main === bad.samsal) out.push(`올해(${year}년)는 ${bad.samsal}쪽이 삼살방이에요. 옛 책은 이 방향으로 집을 옮기는 일을 꺼려요`);
  }
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

// Short tags for a list row: the strongest one or two sides of the ground.
const TAG = ["숲", "불빛", "논밭", "쇠", "물가"];
export function tagsOf(r: Scored): string {
  if (!r.ground) return "";
  const t = [0, 1, 2, 3, 4].filter((e) => r.ground![e] >= 0.6).sort((a, b) => r.ground![b] - r.ground![a]).slice(0, 2).map((e) => TAG[e]);
  return [...(r.baesan ? ["배산임수"] : []), ...(spaOf(r) >= 5 ? ["온천"] : []), ...t].slice(0, 2).join(", ");
}

// 나를 닮은 동네: the ground whose five sides are shaped most like the chart's own five elements (cosine of the two,
// each centred on its mean so the shape counts, not the size). A place like oneself is easy to live in but does not
// fill what is missing: the counterpart of the ranking.
export function lookAlikes(all: Scored[], n: Need, k = 3): Scored[] {
  const centre = (v: number[]) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return v.map((x) => x - m);
  };
  const me = centre(n.elements);
  const sim = (g: number[]) => {
    const c = centre(g);
    const dot = c.reduce((s, x, i) => s + x * me[i], 0);
    const nn = Math.hypot(...c) * Math.hypot(...me);
    return nn ? dot / nn : 0;
  };
  const seen = new Set<string>();
  return all
    .filter((r) => r.ground)
    .map((r) => ({ r, s: sim(r.ground!) }))
    .sort((a, b) => b.s - a.s || a.r.code.localeCompare(b.r.code))
    .map((x) => x.r)
    .filter((r) => !seen.has(r.sido) && !!seen.add(r.sido))
    .slice(0, k);
}
