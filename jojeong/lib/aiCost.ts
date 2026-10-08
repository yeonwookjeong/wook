// What one model call cost, for the owner's dashboard: the tokens it used and, for a model whose price is known,
// that in won. Prices are the API list rates per million tokens (USD); a cache read is billed at a
// tenth of input and a cache write at 1.25×. A model not listed shows tokens only.

export type Usage = { model: string; input: number; output: number; cacheRead: number; cacheWrite: number };

const PER_MTOK: [prefix: string, input: number, output: number][] = [
  ["claude-opus-5-5", 4, 20],
  ["claude-opus-5", 5, 25],
  ["claude-sonnet-5-5", 2, 10],
  ["claude-sonnet-5", 2, 10],
  ["claude-haiku-5-5", 0.1, 0.5],
  // Google's introductory rate through 2026-12-31 (reported to double from 2027-01-01): check ai.google.dev pricing.
  ["gemini-3.8-flash", 0.75, 3.75],
];
// The won to the dollar used for the estimate (KRW_PER_USD overrides it).
const KRW_PER_USD = Number(process.env.KRW_PER_USD ?? 1400);

export function costKrw(u: Usage): number | null {
  const price = PER_MTOK.find(([p]) => u.model.startsWith(p));
  if (!price) return null;
  const [, inp, out] = price;
  const usd = (u.input * inp + u.cacheRead * inp * 0.1 + u.cacheWrite * inp * 1.25 + u.output * out) / 1_000_000;
  return usd * KRW_PER_USD;
}
