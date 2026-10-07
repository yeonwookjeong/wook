import { siteUrl } from "@/lib/brand";
import { COLUMNS, kstToday } from "@/lib/columns";
import { pingIndexNow } from "@/lib/indexNow";

// Run once a day just after midnight in Korea (vercel.json): the columns that open today, and the list that now
// shows them, are sent to IndexNow. Only Vercel's scheduler calls it: with CRON_SECRET set, Vercel sends it as a
// bearer token; without one, its user agent is the check.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const ok = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (!ok) return new Response(null, { status: 401 });
  const today = kstToday();
  const fresh = COLUMNS.filter((c) => c.date === today);
  if (fresh.length === 0) return Response.json({ today, sent: [] });
  const base = siteUrl();
  const urls = [...fresh.map((c) => `${base}/column/${c.slug}`), `${base}/column`];
  const status = await pingIndexNow(urls).catch(() => 0);
  return Response.json({ today, sent: urls, status });
}
