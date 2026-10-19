import { isAdmin } from "@/lib/admin";
import { columnBySlug } from "@/lib/columns";
import { saleLabel } from "@/lib/sales";
import { isStepFrom } from "@/lib/nextStep";
import { isBotUa, isDirectKind, isSource } from "@/lib/source";
import { currentMemberId } from "@/lib/members";
import { noteMemberView } from "@/lib/store";
import { ASK_FROM, CH_FROM, CLIENT_EVENTS, track, trackVisit, type AskFrom, type ChFrom, type ClientEvent } from "@/lib/stats";

// POST { v: { day, week, month, ever } } for a page view, or { e } for a button a page reports (lib/stats.ts),
// or `view:<sale>` for a paid report's page (lib/sales.ts), or `cv:<slug>` for a column read (lib/columns.ts).
// The owner's own browsing is not counted.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { v?: Record<string, unknown>; e?: string; from?: string; src?: string; dx?: string } | null;
  if (!body || (await isAdmin()) || isBotUa(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  if (body.v) {
    const v = body.v;
    await trackVisit({ day: v.day === true, week: v.week === true, month: v.month === true, ever: v.ever === true });
    // A new browser, by the road it came: new visitors per source.
    if (v.ever === true && isSource(body.src)) await track(`src:${body.src}`);
    // A new browser counted as "direct": which kind of browser it was (lib/source.ts directKind).
    if (v.ever === true && body.src === "direct" && isDirectKind(body.dx)) await track(`dx:${body.dx}`);
  } else if (CLIENT_EVENTS.includes(body.e as ClientEvent)) {
    await track(body.e as ClientEvent);
    // A step out of a free page also counts for that page.
    if (body.e === "to_saju" && isStepFrom(body.from)) await track(`to:${body.from}`);
    // A share or a saved card also counts for the page it was made on.
    if (body.e === "share_result" && isStepFrom(body.from)) await track(`sh:${body.from}`);
    if (body.e === "save_image" && isStepFrom(body.from)) await track(`sv:${body.from}`);
    if (body.e === "to_ask" && ASK_FROM.includes(body.from as AskFrom)) await track(`ask:${body.from}`);
    if (body.e === "to_channel" && CH_FROM.includes(body.from as ChFrom)) await track(`ch:${body.from}`);
  } else if (typeof body.e === "string" && body.e.startsWith("view:") && saleLabel(body.e.slice(5))) {
    await track(body.e as `view:${string}`);
    // A signed-in member's interest, for the owner's member card.
    const member = await currentMemberId();
    if (member) await noteMemberView(member, body.e.slice(5));
  } else if (typeof body.e === "string" && body.e.startsWith("cv:") && columnBySlug(body.e.slice(3))) {
    await track(body.e as `cv:${string}`);
  }
  return new Response(null, { status: 204 });
}
