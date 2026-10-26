import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ORDERS_COOKIE } from "./cookies";
import { isSource, SRC_COOKIE, type Source } from "./source";
import { CREDIT_PACKS, type ProductId, type SetId } from "./products";
import type { JobRequest } from "./reportWriter";
import { isAdmin } from "./admin";
import { changeCredits, currentMember } from "./members";
import { getOrderRaw, getOrdersRaw, giftOrderIds, noteGiftOrder, notePaidOrder, paidOrderIds, setOrderRaw } from "./store";

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
  // A set: the report page it was bought on (orders made before this was kept have none).
  from?: ProductId;
  amount: number;
  // "canceled": refunded in the Toss admin (learned through the webhook); the report closes again.
  status: "ready" | "paid" | "canceled";
  // Given away from /admin: paid at 0 won with no payment behind it, and never among the paid orders.
  gift?: boolean;
  // 질문권: how many questions this order buys, for which member, and whether they were added already.
  credits?: number;
  member?: string;
  credited?: boolean;
  // Questions that came with a report (A안): how many, to which member, and whether they were added already.
  bonus?: number;
  bonusMember?: string;
  bonusGiven?: boolean;
  // "a": bought in the opened shop (the new prices, lib/pricing.ts; the owner's 시안 모드 too). Its report is the
  // new one (lib/reportPrompts.ts isV8); orders without it were bought before the opening and keep the old.
  shop?: "a";
  // The written report each product of this order opened with (its text's key, lib/store.ts getReportText), kept
  // the first time it is read: it opens that same text ever after, whatever later changes to how reports are asked.
  texts?: Partial<Record<ProductId, string>>;
  // When the owner had a report written again under today's reading (admin, a 👎 put right): the report is then
  // read and drawn as of that moment, not as of the payment (lib/patterns.ts ENGINE2_SINCE, lib/pairYears.ts).
  rewritten?: Partial<Record<ProductId, number>>;
  // A payment made to try the site (the owner's own, or marked so on /admin): kept, but out of the dashboard.
  test?: boolean;
  createdAt: number;
  paidAt?: number;
  paymentKey?: string;
  method?: string;
  // The road the buyer first came by (lib/source.ts); orders made before it was kept have none.
  src?: Source;
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

// Every order that was ever paid (refunded ones too, with their status), oldest first, for the owner.
export async function paidOrders(limit = 5000): Promise<Order[]> {
  const ids = [...new Set((await paidOrderIds().catch(() => [])).slice(-limit))];
  const raws = await getOrdersRaw(ids).catch(() => []);
  return raws.flatMap((raw) => (raw ? [JSON.parse(raw) as Order] : []));
}

export async function createOrder(
  product: ProductId,
  req: JobRequest,
  who: string,
  amount: number,
  set?: { set: SetId; bundle: ProductId[]; from?: ProductId },
  credits?: { credits: number; member: string },
  extra?: { bonus?: number; bonusMember?: string; shop?: "a" },
): Promise<Order> {
  // Toss wants 6–64 characters of [A-Za-z0-9_-=]; unguessable, since the id is also the link to the report.
  const src = (await cookies()).get(SRC_COOKIE)?.value;
  const order: Order = {
    id: `hd${randomBytes(15).toString("base64url")}`,
    product,
    req,
    who,
    amount,
    ...set,
    ...credits,
    ...extra,
    status: "ready",
    createdAt: Date.now(),
    ...(isSource(src) && { src }),
    // The owner trying a payment from a signed-in browser.
    ...((await isAdmin()) && { test: true }),
  };
  await setOrderRaw(order.id, JSON.stringify(order));
  return order;
}

// A report the owner gives to someone (a friend, a tester): an order that is already paid, at 0 won, that opens
// at /r/… like a bought one. It is kept out of the paid-order list (orders:paid), so it never enters the sales
// table, the revenue or the CSV; its own list (orders:gift) is the owner's record, and it can be closed again.
export async function createGiftOrder(product: ProductId, req: JobRequest, who: string, shop?: "a"): Promise<Order> {
  const now = Date.now();
  const order: Order = {
    id: `hd${randomBytes(15).toString("base64url")}`,
    product,
    req,
    who,
    amount: 0,
    status: "paid",
    gift: true,
    createdAt: now,
    paidAt: now,
    method: "관리자 발급",
    ...(shop && { shop }),
  };
  await setOrderRaw(order.id, JSON.stringify(order));
  await noteGiftOrder(order.id);
  return order;
}

// The gifts given so far, newest first.
export async function giftOrders(limit = 100): Promise<Order[]> {
  const ids = [...new Set((await giftOrderIds().catch(() => [])).slice(-limit))].reverse();
  const raws = await getOrdersRaw(ids).catch(() => []);
  return raws.flatMap((raw) => (raw ? [JSON.parse(raw) as Order] : []));
}

// An order written back as it is (the 질문권 'credited' mark), for the payment pages.
export async function setOrderRawPublic(order: Order) {
  await setOrderRaw(order.id, JSON.stringify(order));
}

// Keeps which text this order's report opened with (the order read fresh, so nothing written meanwhile is lost).
export async function pinReportText(orderId: string, product: ProductId, key: string): Promise<void> {
  const o = await getOrder(orderId);
  if (!o || o.texts?.[product] === key) return;
  await setOrderRaw(o.id, JSON.stringify({ ...o, texts: { ...o.texts, [product]: key } }));
}

// Has a bought report written again: its pinned text is let go, so the next opening writes it anew, read as of now.
export async function rewriteReport(orderId: string, product: ProductId): Promise<boolean> {
  const o = await getOrder(orderId);
  if (!o || o.status !== "paid" || !covers(o, product)) return false;
  const texts = { ...o.texts };
  delete texts[product];
  await setOrderRaw(o.id, JSON.stringify({ ...o, texts, rewritten: { ...o.rewritten, [product]: Date.now() } }));
  return true;
}
// The moment a report is read as of: when it was written again, else when it was bought.
export const readAtOf = (o: Order, product: ProductId) => o.rewritten?.[product] ?? o.paidAt ?? o.createdAt;

// Marks a paid order as a test payment (or a real one again), for the owner's dashboard.
export async function markTestOrder(orderId: string, test: boolean): Promise<void> {
  const order = await getOrder(orderId);
  if (!order || order.gift) return;
  await setOrderRaw(order.id, JSON.stringify({ ...order, test } satisfies Order));
}

// Closes a gift again (its link then leads to the shopper's own list). Only gifts, never a bought order.
export async function revokeGiftOrder(orderId: string): Promise<boolean> {
  const order = await getOrder(orderId);
  if (!order?.gift) return false;
  await setOrderRaw(order.id, JSON.stringify({ ...order, status: "canceled" } satisfies Order));
  return true;
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
  const payment = (await res.json()) as { orderId?: string; paymentKey?: string; status?: string; balanceAmount?: number };
  const order = await getOrder(payment.orderId);
  if (!order || order.paymentKey !== payment.paymentKey) return null;
  if (order.status === "paid" && (payment.status === "CANCELED" || payment.status === "PARTIAL_CANCELED")) {
    const canceled: Order = { ...order, status: "canceled" };
    await setOrderRaw(order.id, JSON.stringify(canceled));
    // A refunded report takes back the questions it brought, as far as they are left.
    if (payment.status === "CANCELED" && order.bonus && order.bonusMember && order.bonusGiven) await changeCredits(order.bonusMember, -order.bonus, `환불 ${order.id}`);
    // A refunded 질문권 takes back the questions refunded. What Toss still holds pays for those kept, at the single
    // price (the refund rule, app/refund): a whole refund takes them all, a part one leaves the ones used.
    if (order.credits && order.member && order.credited) {
      const kept = Math.min(order.credits, Math.round((payment.status === "CANCELED" ? 0 : (payment.balanceAmount ?? 0)) / CREDIT_PACKS[1]));
      if (order.credits - kept > 0) await changeCredits(order.member, -(order.credits - kept), `환불 ${order.id}`);
    }
    return canceled;
  }
  return order;
}

// Whether a paid order opens this report (its own product, or one of its set).
export const covers = (o: Order, product: ProductId) => o.status === "paid" && (o.product === product || Boolean(o.bundle?.includes(product)));

// Orders this browser bought, newest first, and those of the member signed in here (lib/members.ts).
export async function browserOrderIds(): Promise<string[]> {
  const raw = (await cookies()).get(ORDERS_COOKIE)?.value ?? "";
  return raw.split(".").filter((id) => /^[\w-]{6,64}$/.test(id)).slice(0, 30);
}
export async function ownedOrderIds(): Promise<string[]> {
  const mine = await browserOrderIds();
  const member = await currentMember().catch(() => null);
  return member ? [...new Set([...mine, ...member.orders])].slice(0, 200) : mine;
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
  const fields = ["p", "a", "b", "rel", "kind", "from", "n", "y"] as const;
  // The year matters only to 연운: a set that also bought a year still opens its other reports for this chart.
  const same = (o: Order) => covers(o, product) && fields.every((f) => (f === "y" && product !== "yeonun") || (o.req[f] ?? "") === (req[f] ?? ""));
  return (await ownedOrders()).find(same) ?? null;
}

// The questions a paid report brought, added once to the member (at payment if signed in, else at sign-in).
export async function giveBonus(order: Order, memberId: string): Promise<number> {
  if (order.status !== "paid" || !order.bonus || order.bonusGiven) return 0;
  await setOrderRaw(order.id, JSON.stringify({ ...order, bonusGiven: true, bonusMember: memberId }));
  await changeCredits(memberId, order.bonus, `동봉 ${order.id}`);
  return order.bonus;
}
