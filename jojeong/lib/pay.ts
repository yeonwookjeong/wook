import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ORDERS_COOKIE } from "./cookies";
import type { ProductId, SetId } from "./products";
import type { JobRequest } from "./reportWriter";
import { getOrderRaw, notePaidOrder, setOrderRaw } from "./store";

// Paying for a report with 토스페이먼츠 (결제창, API 개별 연동 키).
//   1. /api/pay/order makes an order: the report request, whose chart, and the amount fixed on our side.
//   2. The browser opens the Toss payment window with that order (components/PayButton.tsx).
//   3. Toss sends the buyer to /pay/success; there the amount is checked against the order and the payment is
//      confirmed with the secret key. Only a confirmed order opens the report (/api/report checks it).
// TOSS_CLIENT_KEY / TOSS_SECRET_KEY come from the environment (test_… keys first, live_… to sell). PAY_MOCK=1
// skips Toss for local testing and never works on the production deployment.

export type Order = {
  id: string;
  product: ProductId;
  req: JobRequest;
  // Whose report, for the order list: "지은" or "지은님과 민호님".
  who: string;
  // A set covers several reports for the same chart; `product` is then the first of them.
  set?: SetId;
  bundle?: ProductId[];
  amount: number;
  // "canceled": refunded in the Toss admin (learned through the webhook); the report closes again.
  status: "ready" | "paid" | "canceled";
  createdAt: number;
  paidAt?: number;
  paymentKey?: string;
  method?: string;
};

const clientKey = () => process.env.TOSS_CLIENT_KEY?.trim() ?? "";
const secretKey = () => process.env.TOSS_SECRET_KEY?.trim() ?? "";

export const payMock = () => process.env.PAY_MOCK === "1" && process.env.VERCEL_ENV !== "production";

// Both keys present and of the same kind (test with test, live with live).
export function payEnabled() {
  if (payMock()) return true;
  const ck = /^(test|live)_ck_/.exec(clientKey());
  const sk = /^(test|live)_sk_/.exec(secretKey());
  return Boolean(ck && sk && ck[1] === sk[1]);
}
export const payClientKey = () => (payMock() ? "mock" : clientKey());

export async function getOrder(orderId: string | undefined | null): Promise<Order | null> {
  if (!orderId) return null;
  const raw = await getOrderRaw(orderId).catch(() => null);
  return raw ? (JSON.parse(raw) as Order) : null;
}

export async function createOrder(product: ProductId, req: JobRequest, who: string, amount: number, set?: { set: SetId; bundle: ProductId[] }): Promise<Order> {
  // Toss wants 6–64 characters of [A-Za-z0-9_-=]; unguessable, since the id is also the link to the report.
  const order: Order = { id: `hd${randomBytes(15).toString("base64url")}`, product, req, who, amount, ...set, status: "ready", createdAt: Date.now() };
  await setOrderRaw(order.id, JSON.stringify(order));
  return order;
}

// Confirms the payment with Toss (결제 승인). The amount must be the one fixed in the order.
export async function confirmOrder(order: Order, paymentKey: string, amount: number): Promise<{ ok: true } | { ok: false; message: string }> {
  if (order.status === "paid") return { ok: true };
  if (amount !== order.amount) return { ok: false, message: "결제 금액이 주문과 달라요. 결제는 승인되지 않았어요." };

  let method = "mock";
  if (!payMock()) {
    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId: order.id, amount }),
      cache: "no-store",
    }).catch(() => null);
    if (!res) return { ok: false, message: "결제사와 연결되지 않았어요. 잠시 뒤 다시 시도해 주세요." };
    const body = (await res.json().catch(() => ({}))) as { status?: string; totalAmount?: number; method?: string; message?: string };
    if (!res.ok) return { ok: false, message: body.message ?? "결제를 승인하지 못했어요." };
    if (body.status !== "DONE" || body.totalAmount !== order.amount) return { ok: false, message: "결제가 끝나지 않았어요. 문의하기로 알려 주세요." };
    method = body.method ?? "";
  }
  const paid: Order = { ...order, status: "paid", paidAt: Date.now(), paymentKey, method };
  await setOrderRaw(order.id, JSON.stringify(paid));
  await notePaidOrder(order.id);
  return { ok: true };
}

// The Toss webhook only says that something changed; the payment itself is read back from Toss with the secret
// key, so a forged call cannot close anyone's report. A cancelled payment closes its order.
export async function syncPayment(paymentKey: string): Promise<Order | null> {
  if (payMock() || !/^[\w-]{10,200}$/.test(paymentKey)) return null;
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}` },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return null;
  const payment = (await res.json()) as { orderId?: string; paymentKey?: string; status?: string };
  const order = await getOrder(payment.orderId);
  if (!order || order.paymentKey !== payment.paymentKey) return null;
  if (order.status === "paid" && (payment.status === "CANCELED" || payment.status === "PARTIAL_CANCELED")) {
    const canceled: Order = { ...order, status: "canceled" };
    await setOrderRaw(order.id, JSON.stringify(canceled));
    return canceled;
  }
  return order;
}

// Whether a paid order opens this report (its own product, or one of its set).
export const covers = (o: Order, product: ProductId) => o.status === "paid" && (o.product === product || Boolean(o.bundle?.includes(product)));

// Orders this browser bought, newest first.
export async function ownedOrderIds(): Promise<string[]> {
  const raw = (await cookies()).get(ORDERS_COOKIE)?.value ?? "";
  return raw.split(".").filter((id) => /^[\w-]{6,64}$/.test(id)).slice(0, 30);
}
export const withOrder = (ids: string[], id: string) => [id, ...ids.filter((x) => x !== id)].slice(0, 30).join(".");

export async function ownedOrders(): Promise<Order[]> {
  const orders = await Promise.all((await ownedOrderIds()).map((id) => getOrder(id)));
  return orders.filter((o): o is Order => o?.status === "paid");
}

// The newest paid order in this browser for each report it opens (a set opens several), with the link to it.
export function ownedByProduct(orders: Order[]): Partial<Record<ProductId, { order: Order; href: string }>> {
  const out: Partial<Record<ProductId, { order: Order; href: string }>> = {};
  for (const o of orders) for (const id of o.bundle ?? [o.product]) out[id] ??= { order: o, href: `/reports/${id}?order=${o.id}` };
  return out;
}

// A paid order in this browser for exactly this report request (same product, same chart or pair).
export async function ownedOrderFor(product: ProductId, req: JobRequest): Promise<Order | null> {
  const fields = ["p", "a", "b", "rel", "kind", "from", "n"] as const;
  const same = (o: Order) => covers(o, product) && fields.every((f) => (o.req[f] ?? "") === (req[f] ?? ""));
  return (await ownedOrders()).find(same) ?? null;
}
