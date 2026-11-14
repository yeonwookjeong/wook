import { readMe } from "@/lib/me";
import { goodDaysIcs, monthFor } from "@/lib/month";

// The month's remaining ◎ days for the phone's own calendar (app/calendar): dates and one line each, never the
// chart or the birth date. With no saved chart, back to the calendar page and its form.
export async function GET(req: Request) {
  const me = await readMe();
  if (!me) return Response.redirect(new URL("/calendar", req.url), 303);
  const m = monthFor(me.person);
  const name = `hundosaju-${m.year}-${String(m.month).padStart(2, "0")}.ics`;
  return new Response(goodDaysIcs(m), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
