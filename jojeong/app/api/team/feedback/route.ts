import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { listFeedback } from "@/lib/feedback";
import { memberNo } from "@/lib/members";
import { decodePerson } from "@/lib/pairToken";
import { getOrder } from "@/lib/pay";
import { productById, type ProductId } from "@/lib/products";
import { getReportText } from "@/lib/store";
import { TEAM_HEADERS as HEADERS, teamAllowed } from "@/lib/teamAuth";

export const dynamic = "force-dynamic";

// Read-only report feedback for the team (2026-10-25, 궁합 첫 👎): each 👍/👎 with its line, and for a 👎 the text
// the report opened with, so the reviewer can read what was disliked. Read only: no order link (the order id is the
// buyer's key: it opens the report, its feedback form and its sign-in bonus), no birth data, and the names in the
// text masked (○○ the reader, △△ the other). `ref` matches the same row on the owner's admin page by its member
// number and date. Nothing is written.
const MAX_LIMIT = 200;
const SCAN = 2000;

const ref = (order: string) => createHash("sha256").update(order).digest("base64url").slice(0, 10);
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function mask(text: string, names: [string | undefined, string | undefined]): string {
  // Longer name first, so "지수엄마" is not left as "○○엄마"; a one-letter name only where it stands as a name.
  const pairs = names
    .map((n, i) => [n?.trim() ?? "", i === 0 ? "○○" : "△△"] as const)
    .filter(([n]) => n)
    .sort((x, y) => y[0].length - x[0].length);
  let out = text;
  for (const [n, to] of pairs) out = out.replace(new RegExp(n.length >= 2 ? esc(n) : `${esc(n)}(?=\\s*(?:님|씨))`, "g"), to);
  return out;
}

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
    // Filtered over the whole list first, then cut to `limit`, so "the last 50 👎" are 50 👎.
    const list = (await listFeedback(SCAN))
      .filter((f) => f.at >= since && (only !== "down" || !f.up) && (only !== "up" || f.up) && (!product || f.product === product))
      .slice(0, limit);
    const feedback = await Promise.all(
      list.map(async (f) => {
        const order = await getOrder(f.order).catch(() => null);
        const names: [string | undefined, string | undefined] = [
          decodePerson(order?.req.a ?? order?.req.p)?.name,
          decodePerson(order?.req.b)?.name,
        ];
        const key = order?.texts?.[f.product as ProductId];
        const report = !f.up && key ? await getReportText(key).catch(() => null) : null;
        return {
          ref: ref(f.order),
          at: new Date(f.at).toISOString(),
          product: f.product,
          title: productById(f.product)?.title ?? f.product,
          relation: order?.req.rel ?? null,
          up: f.up,
          text: mask(f.text, names),
          // Only a line with this tick may be quoted as a review (no name); the rest are for reading, not quoting.
          share: f.share,
          member: f.member ? memberNo(f.member) : null,
          paidAt: order ? new Date(order.paidAt ?? order.createdAt).toISOString() : null,
          refunded: order?.status === "canceled",
          report: report && mask(report, names),
        };
      }),
    );
    return Response.json({ feedback, generatedAt: new Date().toISOString() }, { headers: HEADERS });
  } catch {
    return Response.json({ error: "store unavailable" }, { status: 500, headers: HEADERS });
  }
}
