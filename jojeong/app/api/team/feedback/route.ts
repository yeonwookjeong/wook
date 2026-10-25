import type { NextRequest } from "next/server";
import { siteUrl } from "@/lib/brand";
import { listFeedback } from "@/lib/feedback";
import { getOrder } from "@/lib/pay";
import { productById, type ProductId } from "@/lib/products";
import { getReportText } from "@/lib/store";
import { TEAM_HEADERS as HEADERS, teamAllowed } from "@/lib/teamAuth";

export const dynamic = "force-dynamic";

// Read-only report feedback for the team (2026-10-25, 궁합 첫 👎): each 👍/👎 with its line, the report's own link
// (the order id is the buyer's link, so this stays behind TEAM_READ_TOKEN), and for a 👎 the text it opened with,
// so the reviewer can read what was disliked. No birth data, contact or member id leaves here; nothing is written.
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const ok = teamAllowed(request);
  if (ok === null) return new Response(null, { status: 404, headers: HEADERS });
  if (!ok) return new Response(null, { status: 401, headers: HEADERS });

  const q = request.nextUrl.searchParams;
  const sinceRaw = q.get("since");
  const since = sinceRaw ? Date.parse(sinceRaw) : 0;
  if (sinceRaw && Number.isNaN(since)) return Response.json({ error: "since must be an ISO date" }, { status: 400, headers: HEADERS });
  const n = Number(q.get("limit") ?? 50);
  const limit = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), MAX_LIMIT) : 50;
  const only = q.get("only"); // "down" | "up" | null
  const product = q.get("product");

  try {
    const list = (await listFeedback(limit)).filter(
      (f) => f.at >= since && (only !== "down" || !f.up) && (only !== "up" || f.up) && (!product || f.product === product),
    );
    const origin = siteUrl();
    const feedback = await Promise.all(
      list.map(async (f) => {
        const order = await getOrder(f.order).catch(() => null);
        const key = order?.texts?.[f.product as ProductId];
        return {
          at: new Date(f.at).toISOString(),
          product: f.product,
          title: productById(f.product)?.title ?? f.product,
          up: f.up,
          text: f.text,
          share: f.share,
          paidAt: order ? new Date(order.paidAt ?? order.createdAt).toISOString() : null,
          refunded: order?.status === "canceled",
          link: `${origin}/reports/${f.product}?order=${encodeURIComponent(f.order)}`,
          report: !f.up && key ? await getReportText(key).catch(() => null) : null,
        };
      }),
    );
    return Response.json({ feedback, generatedAt: new Date().toISOString() }, { headers: HEADERS });
  } catch {
    return Response.json({ error: "store unavailable" }, { status: 500, headers: HEADERS });
  }
}
