// How the 재회운 verdicts and windows spread over random pairs (lib/reunion.ts), to keep the verdict from leaning
// to hope: the 2026-10-23 target is "끈이 남아 있는 인연" for 35–45% of pairs. Run: npx tsx scripts/reunionSpread.mts [n] [seed]
import { reunionOf } from "../lib/reunion";
import { computePillars } from "../lib/saju";
import type { Person } from "../lib/pairToken";

const n = Number(process.argv[2] ?? 3000);
let seed = Number(process.argv[3] ?? 1023);
// A small fixed-seed generator, so a run can be repeated.
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const person = (name: string): Person => {
  const t = Date.UTC(1975, 0, 1) + Math.floor(rand() * 30 * 365.25) * 86400000;
  const d = new Date(t);
  const hour = rand() < 0.3 ? null : Math.floor(rand() * 12);
  const pillars = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: hour });
  return { name, pillars, gender: rand() < 0.5 ? "m" : "f", birthYear: d.getUTCFullYear(), daeun: [] };
};

const verdicts: Record<string, number> = {};
let noTogether = 0;
let anyWindow = 0;
const perYear: Record<number, number> = {};
let ran = 0;
for (let i = 0; i < n; i++) {
  const r = reunionOf(person("가"), person("나"), 2026, new Date(Date.UTC(2026, 9, 23)));
  if (!r) continue;
  ran++;
  verdicts[r.verdict] = (verdicts[r.verdict] ?? 0) + 1;
  const together = r.windows.filter((w) => w.kind === "together");
  if (!together.length) noTogether++;
  if (r.windows.length) anyWindow++;
  for (const w of together) perYear[w.year] = (perYear[w.year] ?? 0) + 1;
}
const pct = (x: number) => `${((x / ran) * 100).toFixed(1)}%`;
console.log(`pairs ${ran}`);
for (const [k, v] of Object.entries(verdicts).sort((a, b) => b[1] - a[1])) console.log(`${k}\t${pct(v)}`);
console.log(`다시 닿기 좋은 해 0개\t${pct(noTogether)}`);
console.log(`좋은 해 또는 마음이 움직이는 해 1개 이상\t${pct(anyWindow)}`);
for (const [y, v] of Object.entries(perYear)) console.log(`${y} 좋은 해로 뽑힘\t${pct(v)}`);
