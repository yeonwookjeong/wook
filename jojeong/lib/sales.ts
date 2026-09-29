import { PRODUCTS, productById, SETS, type SetId } from "./products";

// What was sold, as one key per line of the owner's sales table: a set, 연운 split by the year it reads
// (past, this year, next year: the 신년운세 sold ahead), or a single report.
export type SaleKey = string;

const kstYear = (t: number) => new Date(t + 9 * 3600000).getUTCFullYear();

export function saleKey(product: string, set: SetId | string | undefined, y: string | number | undefined, at = Date.now()): SaleKey {
  if (set) return `set_${set}`;
  if (product === "yeonun" && y) {
    const d = Number(y) - kstYear(at);
    return d > 0 ? "yeonun_next" : d < 0 ? "yeonun_past" : "yeonun_now";
  }
  return product;
}

export function saleLabel(key: SaleKey): string | null {
  if (key.startsWith("set_")) return SETS[key.slice(4) as SetId]?.title ?? null;
  if (key === "yeonun_next") return "신년운세 · 다음 해 연운";
  if (key === "yeonun_now") return "연운 · 올해";
  if (key === "yeonun_past") return "연운 · 지난 연도";
  const p = productById(key);
  return p?.modern ? p.title : null;
}

// Every line the table can have, in shelf order: single reports, 연운 by year, then the sets.
export const SALE_KEYS: SaleKey[] = [
  ...PRODUCTS.filter((p) => p.modern && p.id !== "yeonun").map((p) => p.id),
  "yeonun_next",
  "yeonun_now",
  "yeonun_past",
  ...Object.keys(SETS).map((id) => `set_${id}`),
];
