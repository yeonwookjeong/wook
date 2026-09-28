// Builds lib/rarity.json: how often each pattern, share and day-pillar build turns up among real births
// (every day 1950–2008 at each of the 12 hours, genders alternating). Run: npx tsx scripts/rarity.mts
import { writeFileSync } from "node:fs";
import { readChart } from "../lib/myeongri";
import { PATTERN_IDS, patternsOf } from "../lib/patterns";
import { computePillars } from "../lib/saju";
import { isBaekho, isGoegang, salsAt } from "../lib/deep";
import { chartOf } from "../lib/myeongri";

const groups = ["비겁", "식상", "재성", "관성", "인성"] as const;
const hist = () => new Array(101).fill(0);
const metrics: Record<string, number[]> = { support: hist() };
for (const g of groups) metrics[`god:${g}`] = hist();
for (let e = 0; e < 5; e++) metrics[`el:${e}`] = hist();
const patterns = { m: Object.fromEntries(PATTERN_IDS.map((id) => [id, 0])), f: Object.fromEntries(PATTERN_IDS.map((id) => [id, 0])) };
const n = { m: 0, f: 0 };
// 신살 held anywhere in the chart (one count per chart), for "100명 중 N명" on each.
const sals: Record<string, number> = {};
const ilju: Record<string, { n: number; sig: Record<string, number> }> = {};

let i = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  for (let h = 0; h < 12; h++, i++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h });
    const r = readChart(p)!;
    const gender = i % 2 ? "f" : "m";
    n[gender]++;
    for (const x of patternsOf(p, gender)) patterns[gender][x.id]++;
    const gsum = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
    const esum = r.weights.reduce((a, b) => a + b, 0);
    metrics.support[Math.round(r.support * 100)]++;
    for (const g of groups) metrics[`god:${g}`][Math.round((100 * r.godWeights[g]) / gsum)]++;
    for (let e = 0; e < 5; e++) metrics[`el:${e}`][Math.round((100 * r.weights[e]) / esum)]++;
    const held = new Set<string>();
    for (const s of chartOf(p as never)) if (s.branch !== null) for (const x of salsAt(p, s.branch)) held.add(x);
    if (isGoegang(p)) held.add("괴강");
    if (isBaekho(p)) held.add("백호");
    for (const x of held) sals[x] = (sals[x] ?? 0) + 1;
    const key = `${p.dayStem}-${p.dayBranch}`;
    const heavy = groups.reduce((a, b) => (r.godWeights[b] > r.godWeights[a] ? b : a));
    const sig = `${r.season}|${r.gyeok}|${heavy}`;
    ilju[key] ??= { n: 0, sig: {} };
    ilju[key].n++;
    ilju[key].sig[sig] = (ilju[key].sig[sig] ?? 0) + 1;
  }
}
writeFileSync(new URL("../lib/rarity.json", import.meta.url), JSON.stringify({ total: n.m + n.f, n, patterns, metrics, ilju, sals }));
console.log("charts", n.m + n.f);
