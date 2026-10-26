import { productById, SETS, type ProductId, type SetId } from "@/lib/products";
import { newYearOf, newYearProduct, thisYear } from "@/lib/yeonun";

// What the mini app sells, by the in-app product's sku (the Apps in Toss console). The server keeps its own copy of
// this map (jojeong/lib/tossApps.ts TOSS_SKUS) and is the one that decides what an order opens; this one only
// orders and words the shelf. Prices are set in the console and shown from it.
export type Item = { sku: string; title: string; tagline: string; toc: string[]; opens: ProductId[]; set?: SetId };

export function catalog(now = new Date()): Item[] {
  const y = newYearOf(now) ?? thisYear(now);
  const yeonun = productById("yeonun");
  const life = productById("pyeongsaeng");
  const out: Item[] = [];
  if (yeonun) {
    const p = newYearProduct(yeonun, y, now);
    out.push({ sku: "hundo_yeonun", title: p.title, tagline: p.tagline, toc: yeonun.toc.slice(0, 5), opens: ["yeonun"] });
  }
  if (life) out.push({ sku: "hundo_pyeongsaeng", title: life.title, tagline: life.tagline, toc: life.toc.slice(0, 5), opens: ["pyeongsaeng"] });
  out.push({
    sku: "hundo_ny_set",
    title: SETS.ny.title,
    tagline: `평생 사주 + ${y} 신년운세 + 재물운, 세 권을 한 번에`,
    toc: ["평생 사주 한 권", `${y} 신년운세 한 권`, "재물운 한 권"],
    opens: SETS.ny.products,
    set: "ny",
  });
  return out;
}

export const itemBySku = (sku: string) => catalog().find((i) => i.sku === sku) ?? null;
export const yearForSale = (now = new Date()) => newYearOf(now) ?? thisYear(now);
