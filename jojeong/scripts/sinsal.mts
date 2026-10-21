// Builds lib/sinsalRarity.json: how many births hold each 신살 card, and how often each heads the card (every day
// 1950–2008 at each of the 12 hours, as scripts/rarity.mts). Run: npx tsx scripts/sinsal.mts
import { writeFileSync } from "node:fs";
import { computePillars } from "../lib/saju";
import { cardsOf, CARDS, heldOf } from "../lib/sinsal";

const held: Record<string, number> = Object.fromEntries(CARDS.map((c) => [c.id, 0]));
const sets: string[][] = [];
let total = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  for (let h = 0; h < 12; h++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h });
    const ids = cardsOf(heldOf(p));
    for (const id of ids) held[id]++;
    sets.push(ids);
    total++;
  }
}
// The card that heads: the rarest one held.
const head: Record<string, number> = Object.fromEntries([...CARDS.map((c) => [c.id, 0]), ["none", 0]]);
for (const ids of sets) {
  if (!ids.length) head.none++;
  else head[ids.reduce((a, b) => (held[b] < held[a] ? b : a))]++;
}
writeFileSync(new URL("../lib/sinsalRarity.json", import.meta.url), JSON.stringify({ total, held, head }) + "\n");
console.log(total, held, head);
