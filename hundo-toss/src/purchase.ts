import { getAnonymousKey, IAP } from "@apps-in-toss/web-framework";
import type { Person } from "@/lib/pairToken";
import { grantOrder, refundOrder } from "./api";
import { addToList, personToken, readList } from "./me";

// A site order opened here, kept on the phone so "내 보고서" lists it even before the server answers.
export const MINE_KEY = "hundo:orders";
// `toss`: the Toss order it was paid with (kept from 2026-11; older entries have none).
export type Bought = { order: string; product: string; sku: string; who: string; at: number; toss?: string };
// Toss orders refunded and closed on the server.
export const REFUNDED_KEY = "hundo:refunded";

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
    const b: Bought = { order: g.order, product: g.product, sku, who: me.name, at: Date.now(), toss: orderId };
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

// Refunds: Toss lists this account's completed and refunded orders; each refunded one not closed yet is sent to the
// server, which checks it with Toss and closes its report (the user-harm policy from 2026-11-21 asks refunds be
// honoured within 7 business days). Run on every visit; a failure is tried again on the next.
export async function syncRefunds(): Promise<number> {
  if (!IAP.getCompletedOrRefundedOrders.isSupported()) return 0;
  const done = new Set(await readList(REFUNDED_KEY));
  let closed = 0;
  try {
    // SDK 3.8 reads the newest page only; a refund is seen on the visits right after it, while it is still there.
    const r = await IAP.getCompletedOrRefundedOrders();
    for (const o of r?.orders ?? []) {
      if (o.status !== "REFUNDED" || done.has(o.orderId)) continue;
      if (await refundOrder(o.orderId)) {
        await addToList(REFUNDED_KEY, o.orderId, 200);
        closed++;
      }
    }
  } catch {
    // Tried again on the next visit.
  }
  return closed;
}
