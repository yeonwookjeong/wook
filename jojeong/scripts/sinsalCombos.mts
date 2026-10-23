// Builds lib/sinsalCombos.json: how many births hold each set of 신살 kinds, over every day 1950–2008 at each of the
// 12 hours, as scripts/sinsal.mts. "이 조합은 100명 중 n명" on the result reads it (2026-10-23 대표님 지시). A 살 held
// twice or three times (도화 둘) counts as that 살 once: counting them apart split the births into 3,000 sets, most of
// them "만 명 중 n명", too fine to mean anything (대표님 결정, 486 sets this way). Run: npx tsx scripts/sinsalCombos.mts
import { writeFileSync } from "node:fs";
import { computePillars } from "../lib/saju";
import { cardsOf, heldOf } from "../lib/sinsal";

export const comboKey = (ids: string[]) => [...new Set(ids.map((id) => id.replace(/\d$/, "")))].sort().join("+") || "none";

const combos: Record<string, number> = {};
let total = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  for (let h = 0; h < 12; h++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h });
    const k = comboKey(cardsOf(heldOf(p)));
    combos[k] = (combos[k] ?? 0) + 1;
    total++;
  }
}
const sorted = Object.fromEntries(Object.entries(combos).sort((a, b) => b[1] - a[1]));
writeFileSync(new URL("../lib/sinsalCombos.json", import.meta.url), JSON.stringify({ total, combos: sorted }) + "\n");
const entries = Object.entries(sorted);
console.log("total", total, "distinct", entries.length);
let acc = 0;
entries.slice(0, 30).forEach(([k, v], i) => {
  acc += v;
  console.log(`${i + 1}\t${k}\t${v}\t${((v / total) * 100).toFixed(2)}%\t누적 ${((acc / total) * 100).toFixed(1)}%`);
});
const once = entries.filter(([, v]) => v === 1).length;
console.log("한 사람뿐인 조합", once);
