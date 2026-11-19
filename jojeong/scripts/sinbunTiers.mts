// Counts lib/sinbunTiers.ts TIER_N: each 양반 life by rung, over every day 1950–2008 at each of the 12 hours.
// Run: npx tsx scripts/sinbunTiers.mts
import { computePillars } from "../lib/saju";
import { keyOf } from "../lib/sinbun";
const n: Record<string, number> = {};
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  for (let hb = 0; hb < 12; hb++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: hb });
    const { key, sub, tier } = keyOf(p);
    if (!key.endsWith("양반")) continue;
    const k = tier === "saeng" ? `${key}|saeng` : `${key}|${sub}|${tier}`;
    n[k] = (n[k] ?? 0) + 1;
  }
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(n).sort())));
