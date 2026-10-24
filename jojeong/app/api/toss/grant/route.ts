import { CORS, grantTossOrder } from "@/lib/tossApps";

// POST { orderId, sku, key, p } from the mini app's processProductGrant (hundo-toss/src/purchase.ts): checks the Toss
// order and answers with the site order that opens its report (lib/tossApps.ts).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { orderId?: unknown; sku?: unknown; key?: unknown; p?: unknown };
  const g = await grantTossOrder({
    orderId: String(body.orderId ?? ""),
    sku: String(body.sku ?? ""),
    key: typeof body.key === "string" ? body.key : null,
    p: String(body.p ?? ""),
  }).catch((e: unknown) => {
    console.error("toss grant", e);
    return { ok: false as const, status: 500, message: "잠시 뒤 다시 시도해 주세요." };
  });
  if (!g.ok) return Response.json({ error: g.message }, { status: g.status, headers: CORS });
  return Response.json({ order: g.order.id, product: g.order.product, opens: g.order.bundle ?? [g.order.product] }, { headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
