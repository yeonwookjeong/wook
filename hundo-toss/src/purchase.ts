import { getAnonymousKey, IAP } from "@apps-in-toss/web-framework";
import type { Person } from "@/lib/pairToken";
import { grantOrder } from "./api";
import { addToList, personToken } from "./me";

// A site order opened here, kept on the phone so "내 보고서" lists it even before the server answers.
export const MINE_KEY = "hundo:orders";
export type Bought = { order: string; product: string; sku: string; who: string; at: number };

// The reader's Toss anonymous key: the same for this Toss account in this mini app, on any phone. The server files
// orders under it, so bought reports open again after a phone change. Null outside Toss or on an old Toss app.
export async function anonKey(): Promise<string | null> {
  try {
    if (!getAnonymousKey.isSupported()) return null;
    const r = await getAnonymousKey();
    return r && r !== "ERROR" ? r.hash : null;
  } catch {
    return null;
  }
}

// What the server needs to grant one Toss order: the chart it is for (the reader's own). The server picks the year
// of a 신년운세 itself.
async function grant(orderId: string, sku: string, me: Person) {
  const g = await grantOrder({ orderId, sku, key: await anonKey(), p: personToken(me) });
  if (g.ok) {
    const b: Bought = { order: g.order, product: g.product, sku, who: me.name, at: Date.now() };
    await addToList(MINE_KEY, JSON.stringify(b));
  }
  return g;
}

export const iapSupported = () => IAP.createOneTimePurchaseOrder.isSupported();

// Opens Toss's order sheet. The product is granted in `processProductGrant` (the server, by the order id, once);
// a payment that went through but whose grant failed stays pending and is granted on the next visit (restore).
export function buy(sku: string, me: Person, done: (r: { ok: true; order: string; product: string } | { ok: false; message: string }) => void) {
  let result: { ok: true; order: string; product: string } | { ok: false; message: string } = { ok: false, message: "결제가 끝나지 않았어요." };
  let cleanup: (() => void) | null = null;
  const finish = () => {
    cleanup?.();
    done(result);
  };
  try {
    cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: async ({ orderId }) => {
          const g = await grant(orderId, sku, me);
          result = g.ok ? { ok: true, order: g.order, product: g.product } : { ok: false, message: `결제는 됐지만 보고서를 여는 데 실패했어요. 다시 들어오면 자동으로 열려요. (${g.message})` };
          return g.ok;
        },
      },
      onEvent: () => finish(),
      onError: () => {
        if (!result.ok) result = { ok: false, message: "결제를 취소했거나 결제 중 문제가 생겼어요." };
        finish();
      },
    });
  } catch {
    done({ ok: false, message: "결제창을 열지 못했어요. 토스 앱을 최신으로 업데이트해 주세요." });
  }
}

// Payments that went through but were never granted (the app closed, the server failed): grant them now, then tell
// Toss the grant is done. Each needs the sku the server maps; an order without one waits for the next visit.
export async function restorePending(me: Person): Promise<number> {
  if (!IAP.getPendingOrders.isSupported()) return 0;
  let restored = 0;
  try {
    const { orders } = await IAP.getPendingOrders();
    for (const o of orders ?? []) {
      if (!o.sku) continue;
      const g = await grant(o.orderId, o.sku, me);
      if (!g.ok) continue;
      await IAP.completeProductGrant({ params: { orderId: o.orderId } }).catch(() => false);
      restored++;
    }
  } catch {
    // Tried again on the next visit.
  }
  return restored;
}
