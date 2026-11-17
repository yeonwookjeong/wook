// Builds lib/byeoseulPop.json for 벼슬길 (lib/byeoseulSim.ts): over real births (every 3rd day 1950–2008, every
// hour), the spread of each road's fit (101 quantiles, for each road's ceiling) and each door's score (the thirds
// that make 잘 풀림 / 그럭저럭 / 역풍). Run: npx tsx scripts/byeoseulPop.mts
import { writeFileSync } from "node:fs";
import { factsOf } from "../lib/byeoseul";
import { TRACKS } from "../lib/byeoseulRanks";
import { ALL_DOORS, boardOf, nextScene, start, trackRaw, traitOf, walk } from "../lib/byeoseulSim";
import { TRACK } from "../lib/byeoseulRanks";
import { computePillars } from "../lib/saju";

const tr: Record<string, number[]> = Object.fromEntries(TRACKS.map((t) => [t, []]));
const dr: Record<string, number[]> = Object.fromEntries(ALL_DOORS.map((d) => [d.id, []]));
let n = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 3 * 86400000) {
  const d = new Date(t);
  for (let h = 0; h < 12; h++) {
    const f = factsOf(computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h }));
    if (!f) continue;
    n++;
    for (const k of TRACKS) tr[k].push(trackRaw(f, k));
    for (const door of ALL_DOORS) dr[door.id].push(door.trait.reduce((s, [k, w]) => s + traitOf(f, k) * w, 0));
  }
}
const q = (a: number[], p: number) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const track = Object.fromEntries(TRACKS.map((k) => { const a = tr[k].sort((x, y) => x - y); return [k, Array.from({ length: 101 }, (_, i) => r4(q(a, i / 100)))]; }));
const door = Object.fromEntries(ALL_DOORS.map((d) => { const a = dr[d.id].sort((x, y) => x - y); return [d.id, [r4(q(a, 1 / 3)), r4(q(a, 2 / 3))]]; }));
// How far people get, playing every door at random (run after the thresholds above exist): the share ending at
// each rank or higher, for "100명 중 n명".
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const reach = new Array(18).fill(0);
let plays = 0;
for (let i = 0; i < 20000; i++) {
  const t = Date.UTC(1950, 0, 1) + Math.floor(rnd() * 58 * 365) * 86400000;
  const d = new Date(t);
  const b = boardOf(computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: Math.floor(rnd() * 12) }));
  if (!b) continue;
  let l = start();
  for (let s = nextScene(l); s; s = nextScene(l)) l = walk(b, l, s, s.doors[Math.floor(rnd() * s.doors.length)]);
  reach[TRACK[l.track].ladder[l.index].rank]++;
  plays++;
}
const atLeast = reach.map((_, i) => Math.round((reach.slice(i).reduce((a, b) => a + b, 0) / plays) * 1000) / 10);
writeFileSync(new URL("../lib/byeoseulPop.json", import.meta.url), JSON.stringify({ n, track, door, atLeast }));
console.log("charts", n);
