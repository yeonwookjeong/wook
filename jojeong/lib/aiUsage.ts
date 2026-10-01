import "server-only";
import { aiUsageLog, logAiUsage } from "./store";
import { inPeriods, type Period } from "./stats";

// What each freshly written report cost: one line per model call, kept so /admin can show the real model in use
// and the real cost per report instead of an estimate. Only token counts are kept, never the report or the chart.
export type AiUsage = {
  at: number;
  model: string; // the model that answered (a fallback may differ from REPORT_MODEL)
  product: string;
  input: number;
  output: number; // the answer itself
  thinking: number; // reasoning tokens, billed as output (Claude counts them inside output and reports 0 here)
  ok: boolean; // false: the writing stopped midway and was not saved, but was still billed
};

export async function recordAiUsage(u: AiUsage) {
  try {
    await logAiUsage(JSON.stringify(u));
  } catch (e) {
    console.error("ai usage not recorded", e); // never fails the report
  }
}

// List prices in USD per million tokens, checked 2026-10-01. The first match by model-name prefix wins, so
// longer names come first. Gemini 3.8 Flash is at its introductory price until the end of 2026.
const PRICES: { prefix: string; until?: string; input: number; output: number }[] = [
  { prefix: "gemini-3.8-flash", until: "2027-01-01", input: 0.75, output: 3.75 },
  { prefix: "gemini-3.8-flash", input: 1.5, output: 7.5 },
  { prefix: "claude-opus-5-5", input: 4, output: 20 },
  { prefix: "claude-opus-5", input: 5, output: 25 },
  { prefix: "claude-sonnet-5-5", input: 2, output: 10 },
  { prefix: "claude-haiku-4-5", input: 1, output: 5 },
];
// An assumed exchange rate for showing won; the bill itself is in dollars.
export const KRW_PER_USD = Number(process.env.KRW_PER_USD ?? 1400);

// The cost of one call in USD, or null for a model missing from the price list.
export function costUsd(u: AiUsage): number | null {
  const day = new Date(u.at).toISOString().slice(0, 10);
  const p = PRICES.find((x) => u.model.startsWith(x.prefix) && (!x.until || day < x.until));
  if (!p) return null;
  return (u.input * p.input + (u.output + u.thinking) * p.output) / 1e6;
}

export type ModelSummary = { model: string; n: number; failed: number; input: number; output: number; thinking: number; usd: number | null };

// Per model, for each period: how many calls, their tokens and their cost. Also the latest calls, newest first.
export async function aiUsageSummary(): Promise<{ by: Record<Period, ModelSummary[]>; recent: AiUsage[] }> {
  const rows: AiUsage[] = [];
  for (const line of await aiUsageLog().catch(() => [])) {
    try {
      rows.push(JSON.parse(line) as AiUsage);
    } catch {}
  }
  const by = { today: [], yesterday: [], week: [], month: [], all: [] } as Record<Period, ModelSummary[]>;
  for (const u of rows) {
    const usd = costUsd(u);
    for (const p of inPeriods(u.at)) {
      let s = by[p].find((x) => x.model === u.model);
      if (!s) by[p].push((s = { model: u.model, n: 0, failed: 0, input: 0, output: 0, thinking: 0, usd: 0 }));
      s.n += 1;
      if (!u.ok) s.failed += 1;
      s.input += u.input;
      s.output += u.output;
      s.thinking += u.thinking;
      s.usd = s.usd === null || usd === null ? null : s.usd + usd;
    }
  }
  return { by, recent: rows.slice(-10).reverse() };
}
