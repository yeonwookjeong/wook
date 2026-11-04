import { CORS, refundTossOrder } from "@/lib/tossApps";

// POST { orderId } from the mini app, for a Toss order that Toss lists as refunded: its report closes (lib/tossApps.ts).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { orderId?: unknown };
  const r = await refundTossOrder(String(body.orderId ?? "")).catch((e: unknown) => {
    console.error("toss refund", e);
    return { ok: false as const, status: 500, message: "잠시 뒤 다시 시도해 주세요." };
  });
  if (!r.ok) return Response.json({ error: r.message }, { status: r.status, headers: CORS });
  return Response.json({ closed: r.closed }, { headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
