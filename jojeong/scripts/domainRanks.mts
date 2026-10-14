// Builds lib/domainRanks.json: how the topic cards' numbers (lib/domains.ts domainCard) spread among the same births
// as lib/rarity.json (every day 1950–2008 at each of the 12 hours), for "상위 N%" beside each.
// Run: npx tsx scripts/domainRanks.mts
import { writeFileSync } from "node:fs";
import { WORK_TYPES, hasStore } from "../lib/domains";
import { readChart, type GodGroup } from "../lib/myeongri";
import { computePillars } from "../lib/saju";

const hist = () => new Array(141).fill(0);
const work: Record<string, number[]> = Object.fromEntries(WORK_TYPES.map((w) => [w.name, hist()]));
let total = 0;
let store = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  for (let h = 0; h < 12; h++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h });
    const r = readChart(p)!;
    const sum = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
    const share = (g: GodGroup) => Math.round((r.godWeights[g] / sum) * 100);
    for (const w of WORK_TYPES) work[w.name][Math.min(140, w.score(share))]++;
    if (hasStore(p)) store++;
    total++;
  }
}
writeFileSync(new URL("../lib/domainRanks.json", import.meta.url), JSON.stringify({ total, work, store }));
console.log("charts", total);
