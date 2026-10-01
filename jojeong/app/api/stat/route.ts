import { isAdmin } from "@/lib/admin";
import { saleLabel } from "@/lib/sales";
import { isStepFrom } from "@/lib/nextStep";
import { isSource } from "@/lib/source";
import { CLIENT_EVENTS, track, trackVisit, type ClientEvent } from "@/lib/stats";

// POST { v: { day, week, month, ever } } for a page view, or { e } for a button a page reports (lib/stats.ts),
// or `view:<sale>` for a paid report's page (lib/sales.ts).
// The owner's own browsing is not counted.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { v?: Record<string, unknown>; e?: string; from?: string; src?: string } | null;
  if (!body || (await isAdmin())) return new Response(null, { status: 204 });
  if (body.v) {
    const v = body.v;
    await trackVisit({ day: v.day === true, week: v.week === true, month: v.month === true, ever: v.ever === true });
    // A new browser, by the road it came: new visitors per source.
    if (v.ever === true && isSource(body.src)) await track(`src:${body.src}`);
  } else if (CLIENT_EVENTS.includes(body.e as ClientEvent)) {
    await track(body.e as ClientEvent);
    // A step out of a free page also counts for that page.
    if (body.e === "to_saju" && isStepFrom(body.from)) await track(`to:${body.from}`);
  } else if (typeof body.e === "string" && body.e.startsWith("view:") && saleLabel(body.e.slice(5))) {
    await track(body.e as `view:${string}`);
  }
  return new Response(null, { status: 204 });
}
