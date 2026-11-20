// Builds lib/celebs.json and lib/celebPop.json for 나와 같은 일주 유명인 (app/star).
//
// Source: Wikidata (CC0), fetched once by hand with query.wikidata.org: people of South Korean citizenship
// (P27 Q884) with a birth date to the day (P569, precision 11), born 1920 or later, on 4+ Wikipedias, with their
// occupations (P106) and the musical groups they belong to (P463). That list is passed in as JSON
// [{name, y, m, d, tags[], links, group}]. Politicians are left out (not a light-hearted subject), as is adult film.
// Only the six letters are kept, not the birth date: year, month and day pillars, read at noon (no hour is known).
// The historical figures are the kings of lib/kings.ts (실록 음력 생일) and a few others with a recorded birthday.
//
// Run: npx tsx scripts/celebs.mts <celebs-src.json>
import { readFileSync, writeFileSync } from "node:fs";
import { Lunar, Solar } from "lunar-javascript";
import { gunghapScore } from "../lib/couple";
import { KING_BIRTHS } from "../lib/kings";
import type { Person } from "../lib/pairToken";
import { BRANCHES, computePillars, STEMS, type Pillars } from "../lib/saju";

type Src = { name: string; y: number; m: number; d: number; tags: string[]; links: number; group: string | null };
const TAGS = ["아이돌", "배우", "가수", "운동선수", "역사 인물"] as const;

const src: Src[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const six = (ec: { getYearGan(): string; getYearZhi(): string; getMonthGan(): string; getMonthZhi(): string; getDayGan(): string; getDayZhi(): string }) => {
  const s = (g: string) => STEMS.indexOf(g as (typeof STEMS)[number]);
  const b = (z: string) => BRANCHES.indexOf(z as (typeof BRANCHES)[number]);
  return [s(ec.getYearGan()), b(ec.getYearZhi()), s(ec.getMonthGan()), b(ec.getMonthZhi()), s(ec.getDayGan()), b(ec.getDayZhi())];
};

// Living people only (Wikidata P570 empty); a name's "(가수)"-style disambiguation dropped.
// [name, tag bits, group, birth year, ys, yb, ms, mb, ds, db]
type Row = [string, number, string, number, ...number[]];
const rows: Row[] = [];
for (const c of src) {
  const bits = c.tags.reduce((a, t) => a | (1 << TAGS.indexOf(t as (typeof TAGS)[number])), 0);
  const p = computePillars({ year: c.y, month: c.m, day: c.d, calendar: "solar", hourBranch: null });
  rows.push([c.name, bits, c.group ?? "", c.y, p.yearStem!, p.yearBranch, p.monthStem!, p.monthBranch!, p.dayStem, p.dayBranch]);
}
// 역사 인물: lunar birthdays from the Annals (lib/kings.ts) and a few others, each with its source.
const HIST: { name: string; lunar?: [number, number, number]; solar?: [number, number, number]; note: string }[] = [
  ...KING_BIRTHS.map((k) => ({ name: k.name, lunar: k.lunar, note: k.note })),
  { name: "신사임당", lunar: [1504, 10, 29], note: "조선의 화가이자 시인" }, // 한국민족문화대백과사전
  { name: "홍범도", solar: [1868, 10, 12], note: "봉오동 전투의 의병장" }, // lib/figures.ts
];
for (const h of HIST) {
  const ec = (h.lunar ? Lunar.fromYmdHms(h.lunar[0], h.lunar[1], h.lunar[2], 12, 0, 0) : Solar.fromYmdHms(h.solar![0], h.solar![1], h.solar![2], 12, 0, 0).getLunar()).getEightChar();
  rows.push([h.name, 1 << 4, h.note, (h.lunar ?? h.solar!)[0], ...six(ec)]);
}
writeFileSync(new URL("../lib/celebs.json", import.meta.url), JSON.stringify(rows));

// How a pair's score spreads over real births (every 5th day 1950–2008, random pairs), for 상위 n%.
const days: Pillars[] = [];
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 5 * 86400000) {
  const d = new Date(t);
  days.push(computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: null }));
}
const P = (pillars: Pillars) => ({ name: "", pillars, gender: null, birthYear: null, daeun: [] }) as unknown as Person;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const n = 200000;
const count = new Array(100).fill(0);
for (let i = 0; i < n; i++) count[gunghapScore(P(days[Math.floor(rnd() * days.length)]), P(days[Math.floor(rnd() * days.length)]), "친구")]++;
// atLeast[s] = 100명 중 몇 명이 s점 이상인지
const atLeast = count.map((_, s) => Math.round((count.slice(s).reduce((a, b) => a + b, 0) / n) * 1000) / 10);
writeFileSync(new URL("../lib/celebPop.json", import.meta.url), JSON.stringify({ n, atLeast }));
console.log(rows.length, "rows; score at least:", [95, 90, 85, 80, 75, 70].map((s) => `${s}:${atLeast[s]}%`).join(" "));
