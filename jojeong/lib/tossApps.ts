import "server-only";
import { randomBytes } from "node:crypto";
import { request } from "node:https";
import { decodePerson } from "./pairToken";
import { payMock, type Order } from "./pay";
import { priceFor, setPrice, SETS, type ProductId, type SetId } from "./products";
import { claimTossGrant, getOrderRaw, getTossGrant, notePaidOrder, noteTossOrder, releaseTossGrant, setOrderRaw, setTossGrant, tossOrderIds, getOrdersRaw } from "./store";
import { newYearOf, thisYear } from "./yeonun";

// The Apps in Toss mini app (hundo-toss/ at the repo root) sells the site's reports with Toss in-app payment. After a
// payment the mini app asks here to grant it: the order is checked with Toss (its partner API, over mTLS), then a
// paid site order is made exactly like one paid on the site, so /api/report writes and opens it the same way.
//
// TOSS_AIT_CERT / TOSS_AIT_KEY: the mTLS certificate and key from the Apps in Toss console (PEM, or the PEM
// base64-encoded on one line). Without them no order can be checked, so none is granted; PAY_MOCK=1 (never on
// production) skips the check for sandbox testing.

// What each in-app product (its sku, set in the console) opens. The mini app's shelf (hundo-toss/src/catalog.ts)
// uses the same skus; this map decides.
export const TOSS_SKUS: Record<string, { product: ProductId } | { set: SetId }> = {
  hundo_yeonun: { product: "yeonun" },
  hundo_pyeongsaeng: { product: "pyeongsaeng" },
  hundo_ny_set: { set: "ny" },
};

const API = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss";

const pem = (v: string | undefined) => {
  const t = v?.trim() ?? "";
  if (!t) return "";
  return t.includes("-----BEGIN") ? t.replace(/\\n/g, "\n") : Buffer.from(t, "base64").toString("utf8");
};

function partnerPost(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: string }> {
  const cert = pem(process.env.TOSS_AIT_CERT);
  const key = pem(process.env.TOSS_AIT_KEY);
  if (!cert || !key) return Promise.reject(new Error("TOSS_AIT_CERT / TOSS_AIT_KEY 환경변수가 필요합니다."));
  const url = new URL(`${API}${path}`);
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        cert,
        key,
        rejectUnauthorized: true,
        timeout: 10000,
        headers: { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(payload), ...headers },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c: string) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, data }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(payload);
  });
}

// The order's state as Toss tells it. Toss's answer is read loosely (the status may sit at the top or under
// `success`), and only a state that plainly means paid is taken as paid; anything else is refused and logged, so a
// new wording is noticed rather than granted.
// The exact words are to be confirmed against the sandbox's first real answer (the refusal log shows it).
const PAID = new Set(["PAYMENT_COMPLETED", "PURCHASED", "COMPLETED", "PAID", "DONE", "SUCCESS"]);

export async function tossOrderPaid(orderId: string, sku: string): Promise<{ ok: true; amount: number | null } | { ok: false; message: string }> {
  if (payMock()) return { ok: true, amount: null };
  let res: { status: number; data: string };
  try {
    res = await partnerPost("/order/get-order-status", { orderId });
  } catch (e) {
    console.error("toss order status", e);
    return { ok: false, message: "토스 결제를 확인하지 못했어요." };
  }
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(res.data) as Record<string, unknown>;
  } catch {
    // read below as unknown
  }
  const inner = (body.success && typeof body.success === "object" ? body.success : body) as Record<string, unknown>;
  const status = String(inner.status ?? inner.orderStatus ?? "").toUpperCase();
  const paidSku = typeof inner.sku === "string" ? inner.sku : null;
  if (res.status !== 200 || !PAID.has(status) || (paidSku && paidSku !== sku)) {
    console.error("toss order not paid", orderId, res.status, res.data.slice(0, 500));
    return { ok: false, message: "결제가 확인되지 않았어요." };
  }
  const amount = Number(inner.amount ?? inner.price);
  return { ok: true, amount: Number.isFinite(amount) && amount > 0 ? amount : null };
}

export type TossGrant = { ok: true; order: Order } | { ok: false; status: number; message: string };

// One Toss order → one paid site order, for the reader's own chart (`p`, the mini app's person token). Granting the
// same Toss order again gives back the order it already became.
export async function grantTossOrder(input: { orderId: string; sku: string; key: string | null; p: string }): Promise<TossGrant> {
  const { orderId, sku } = input;
  const what = TOSS_SKUS[sku];
  if (!/^[\w-]{4,128}$/.test(orderId) || !what) return { ok: false, status: 400, message: "알 수 없는 주문이에요." };

  const known = async () => {
    const id = await getTossGrant(orderId);
    const raw = id ? await getOrderRaw(id) : null;
    return raw ? (JSON.parse(raw) as Order) : null;
  };
  // Already granted: the same order, whatever chart this request carries (the order keeps the one it was paid for).
  const existing = await known();
  if (existing) return { ok: true, order: existing };
  const me = decodePerson(input.p);
  if (!me) return { ok: false, status: 400, message: "사주 정보를 다시 입력해 주세요." };

  // Another request is granting this order right now: wait for it rather than make a second site order.
  if (!(await claimTossGrant(orderId))) {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const done = await known();
      if (done) return { ok: true, order: done };
    }
    return { ok: false, status: 409, message: "잠시 뒤 다시 시도해 주세요." };
  }

  try {
    const paid = await tossOrderPaid(orderId, sku);
    if (!paid.ok) return { ok: false, status: 402, message: paid.message };

    // The 신년운세 sold now is the coming year's (September to February), else this year's (lib/yeonun.ts).
    const y = newYearOf() ?? thisYear();
    const bundle = "set" in what ? SETS[what.set].products : null;
    const product = "set" in what ? SETS[what.set].products[0] : what.product;
    const opensYeonun = product === "yeonun" || Boolean(bundle?.includes("yeonun"));
    const listPrice = "set" in what ? setPrice(what.set, "a") : priceFor(what.product, "a", y, y);
    const now = Date.now();
    const order: Order = {
      id: `hd${randomBytes(15).toString("base64url")}`,
      product,
      req: { product, p: input.p, ...(opensYeonun && { y: String(y) }) },
      who: me.name,
      ...("set" in what && bundle && { set: what.set, bundle }),
      amount: paid.amount ?? listPrice,
      status: "paid",
      shop: "a",
      createdAt: now,
      paidAt: now,
      paymentKey: `toss-iap:${orderId}`,
      method: "토스 인앱결제",
      src: "toss",
    };
    await setOrderRaw(order.id, JSON.stringify(order));
    await setTossGrant(orderId, order.id);
    await notePaidOrder(order.id);
    if (input.key && /^[\w+/=-]{8,200}$/.test(input.key)) await noteTossOrder(input.key, order.id).catch(() => {});
    return { ok: true, order };
  } finally {
    await releaseTossGrant(orderId);
  }
}

// The reports a Toss account bought, newest first, for the mini app's "내 보고서".
export async function tossOrdersOf(key: string): Promise<{ order: string; opens: ProductId[]; who: string; at: number }[]> {
  if (!/^[\w+/=-]{8,200}$/.test(key)) return [];
  const ids = [...new Set(await tossOrderIds(key).catch(() => []))].slice(-50);
  const raws = await getOrdersRaw(ids).catch(() => []);
  return raws
    .flatMap((raw) => (raw ? [JSON.parse(raw) as Order] : []))
    .filter((o) => o.status === "paid")
    .map((o) => ({ order: o.id, opens: o.bundle ?? [o.product], who: o.who, at: o.paidAt ?? o.createdAt }))
    .sort((a, b) => b.at - a.at);
}

// The mini app runs on Toss's own origin, and asks with no cookies: any origin may call these routes, which are
// opened only by an order id or a Toss order.
export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};
