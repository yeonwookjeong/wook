import { ownedOrders, type Order } from "./pay";
import { basePrice, bonusFor, PRICE, SETS, setPrice, type Pricing, type ProductId, type SetId } from "./products";

// A set for a chart that already has some of its reports: what was paid for those comes off the set's price, so a
// customer with 평생 사주 moves up to 사주 전서 for the difference instead of paying for 평생 사주 twice.
export type SetOffer = {
  price: number;
  // What the reports still missing would cost one by one (the "따로 사면" of an upgrade).
  regular: number;
  // The set's reports this chart already has, and what came off for them.
  owned: ProductId[];
  credit: number;
  // Questions still to come with it (the set's, less those the bought reports brought).
  bonus: number;
};

// The set's reports an order opens for this chart (a 연운 only for the year the set carries).
function coveredBy(o: Order, set: SetId, p: string, ny: number | null): ProductId[] {
  if (o.status !== "paid" || o.req.p !== p) return [];
  return (o.bundle ?? [o.product]).filter((id) => SETS[set].products.includes(id) && (id !== "yeonun" || (ny !== null && o.req.y === String(ny))));
}

// The set's price for this chart, from the orders bought in this browser or by the member signed in. Null when
// the set is no better than buying what is missing one by one (or nothing is missing).
export function setOfferFrom(orders: Order[], set: SetId, p: string | undefined, pr: Pricing, ny: number | null): SetOffer | null {
  const full = setPrice(set, pr);
  const all = SETS[set].products;
  const single = (id: ProductId) => basePrice(id, pr, ny ?? undefined, ny);
  if (!p) return { price: full, regular: all.reduce((sum, id) => sum + single(id), 0), owned: [], credit: 0, bonus: bonusFor(pr, null, set) };
  const owned = new Set<ProductId>();
  let paid = 0;
  let brought = 0;
  for (const o of orders) {
    const covered = coveredBy(o, set, p, ny);
    if (!covered.length) continue;
    covered.forEach((id) => owned.add(id));
    // An order that also opened reports outside this set counts for its share only.
    paid += Math.round((o.amount * covered.length) / (o.bundle ?? [o.product]).length);
    brought += o.bonus ?? 0;
  }
  const missing = all.filter((id) => !owned.has(id));
  const regular = missing.reduce((sum, id) => sum + single(id), 0);
  if (!owned.size) return { price: full, regular, owned: [], credit: 0, bonus: bonusFor(pr, null, set) };
  // Never more off than those reports cost today, and never under the dearest missing report alone (the upgrade
  // must not undercut buying that one report).
  const credit = Math.min(
    paid,
    [...owned].reduce((sum, id) => sum + single(id), 0),
  );
  const price = Math.max(PRICE, ...missing.map(single), full - credit);
  if (!missing.length || price >= regular) return null;
  return { price, regular, owned: [...owned], credit: full - price, bonus: Math.max(0, bonusFor(pr, null, set) - brought) };
}

export async function setOffer(set: SetId, p: string | undefined, pr: Pricing, ny: number | null): Promise<SetOffer | null> {
  return setOfferFrom(p ? await ownedOrders() : [], set, p, pr, ny);
}
