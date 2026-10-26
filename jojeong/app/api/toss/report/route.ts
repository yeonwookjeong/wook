import { POST as writeReport } from "@/app/api/report/route";
import { CORS } from "@/lib/tossApps";

// The site's report route (app/api/report) for the mini app, which calls from Toss's origin: the same order checks
// and the same writing, with CORS headers on the answer. POST { order, product }.
export const maxDuration = 300;

export async function POST(request: Request) {
  const res = await writeReport(request);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
