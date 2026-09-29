import { isAdmin } from "@/lib/admin";
import { CLIENT_EVENTS, track, trackVisit, type ClientEvent } from "@/lib/stats";

// POST { v: { day, week, month, ever } } for a page view, or { e } for a button a page reports (lib/stats.ts).
// The owner's own browsing is not counted.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { v?: Record<string, unknown>; e?: string } | null;
  if (!body || (await isAdmin())) return new Response(null, { status: 204 });
  if (body.v) {
    const v = body.v;
    await trackVisit({ day: v.day === true, week: v.week === true, month: v.month === true, ever: v.ever === true });
  } else if (CLIENT_EVENTS.includes(body.e as ClientEvent)) {
    await track(body.e as ClientEvent);
  }
  return new Response(null, { status: 204 });
}
