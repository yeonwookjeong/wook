import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { listInquiries } from "@/lib/store";
import { threadsReplies } from "@/lib/threads";

export const dynamic = "force-dynamic";

// Read-only inbox for the team (2026-10-21 결재): the contact-page questions and the replies under my Threads posts,
// as JSON, opened with TEAM_READ_TOKEN. Unset token: the address does not exist. Nothing here writes or deletes,
// and nothing (token, contact, words) is logged.
const HEADERS = { "cache-control": "no-store", "x-robots-tag": "noindex" };
const MAX_LIMIT = 200;

function allowed(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
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
    const [inquiries, th] = await Promise.all([listInquiries(limit), threadsReplies().catch(() => ({ replies: [], status: null }))]);
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
