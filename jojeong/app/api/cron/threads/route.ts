import { syncThreads } from "@/lib/threads";

export const maxDuration = 60;

// Once a day (vercel.json): the Threads posts and their numbers (lib/threads.ts). Only Vercel's scheduler calls it,
// checked the same way as the IndexNow cron.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const ok = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (!ok) return new Response(null, { status: 401 });
  if (!process.env.THREADS_TOKEN) return Response.json({ skipped: "THREADS_TOKEN 없음" });
  try {
    return Response.json(await syncThreads());
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
