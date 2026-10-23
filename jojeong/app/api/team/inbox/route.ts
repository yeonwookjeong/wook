import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { listInquiries } from "@/lib/store";
import { refreshReplies, threadsReplies } from "@/lib/threads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read-only inbox for the team (2026-10-21 결재): the contact-page questions and the replies under my Threads posts,
// as JSON, opened with TEAM_READ_TOKEN. Unset token: the address does not exist. Nothing here deletes, and nothing
// (token, contact, words) is logged; the only writes are the replies fetched again when they are old (lib/threads.ts).
const HEADERS = { "cache-control": "no-store", "x-robots-tag": "noindex" };
const MAX_LIMIT = 200;
// The replies are fetched once a day by the cron; older than this when the team reads, they are fetched again first.
const REPLIES_STALE = 30 * 60000;
// How long the team waits for that fetch; past it, the kept replies come as they are (the status says when).
const REFRESH_WAIT = 25000;

function allowed(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  // Both sides hashed first, so the comparison is always 32 bytes and says nothing about the token's length.
  const hash = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(hash(header.slice(7)), hash(secret));
}

export async function GET(request: NextRequest) {
  const secret = process.env.TEAM_READ_TOKEN?.trim();
  if (!secret) return new Response(null, { status: 404, headers: HEADERS });
  if (!allowed(request, secret)) return new Response(null, { status: 401, headers: HEADERS });

  const q = request.nextUrl.searchParams;
  const sinceRaw = q.get("since");
  const since = sinceRaw ? Date.parse(sinceRaw) : 0;
  if (sinceRaw && Number.isNaN(since)) return Response.json({ error: "since must be an ISO date" }, { status: 400, headers: HEADERS });
  const n = Number(q.get("limit") ?? 50);
  const limit = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), MAX_LIMIT) : 50;

  try {
    // The newest `limit` first; `since` only drops older ones, so taking the newest then filtering is the same.
    const [inquiries, th] = await Promise.all([listInquiries(limit), freshReplies()]);
    return Response.json(
      {
        inquiries: inquiries.filter((i) => i.at >= since).map((i) => ({ ...i, atIso: new Date(i.at).toISOString() })),
        threadsReplies: th.replies.filter((r) => !since || Date.parse(r.timestamp) >= since).slice(0, limit),
        threadsRepliesStatus: th.status && { ...th.status, at: new Date(th.status.at).toISOString() },
        generatedAt: new Date().toISOString(),
      },
      { headers: HEADERS },
    );
  } catch {
    return Response.json({ error: "store unavailable" }, { status: 500, headers: HEADERS });
  }
}

async function freshReplies(): ReturnType<typeof threadsReplies> {
  const empty = { replies: [], status: null };
  const th = await threadsReplies().catch(() => empty);
  if (!process.env.THREADS_TOKEN || (th.status && Date.now() - th.status.at < REPLIES_STALE)) return th;
  const waited = await Promise.race([refreshReplies().then(() => true), new Promise<false>((r) => setTimeout(() => r(false), REFRESH_WAIT))]);
  return waited ? threadsReplies().catch(() => th) : th;
}
