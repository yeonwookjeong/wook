// Builds lib/sinsalRarity.json: how many births hold each 신살 card, and how often each heads the card (every day
// 1950–2008 at each of the 12 hours, as scripts/rarity.mts), and how many hold each whole set of cards (`combo`,
// keyed by comboKey; `comboNoHour` the same over one hour-less chart a day). Run: npx tsx scripts/sinsal.mts
import { writeFileSync } from "node:fs";
import { computePillars } from "../lib/saju";
import { cardsOf, CARDS, comboKey, heldOf } from "../lib/sinsal";

const held: Record<string, number> = Object.fromEntries(CARDS.map((c) => [c.id, 0]));
const sets: string[][] = [];
const combo: Record<string, number> = {};
const comboNoHour: Record<string, number> = {};
let total = 0;
let days = 0;
for (let t = Date.UTC(1950, 0, 1); t < Date.UTC(2009, 0, 1); t += 86400000) {
  const d = new Date(t);
  const k = comboKey(cardsOf(heldOf(computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: null }))));
  comboNoHour[k] = (comboNoHour[k] ?? 0) + 1;
  days++;
  for (let h = 0; h < 12; h++) {
    const p = computePillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), calendar: "solar", hourBranch: h });
    const ids = cardsOf(heldOf(p));
    for (const id of ids) held[id]++;
    sets.push(ids);
    combo[comboKey(ids)] = (combo[comboKey(ids)] ?? 0) + 1;
    total++;
  }
}
// The card that heads: the rarest one held.
const head: Record<string, number> = Object.fromEntries([...CARDS.map((c) => [c.id, 0]), ["none", 0]]);
for (const ids of sets) {
  if (!ids.length) head.none++;
  else head[ids.reduce((a, b) => (held[b] < held[a] ? b : a))]++;
}
writeFileSync(new URL("../lib/sinsalRarity.json", import.meta.url), JSON.stringify({ total, held, head, days, combo, comboNoHour }) + "\n");
console.log(total, held, head);
