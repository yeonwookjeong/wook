import type { NextRequest } from "next/server";
import { finishLogin } from "@/lib/login";
import { membersEnabled, type Via } from "@/lib/members";
import { payMock } from "@/lib/pay";

// Local trials only (PAY_MOCK=1 on a machine, never on Vercel): sign in as a made-up account (?id=, ?via=kakao|
// naver|google), as the return from that login would.
export async function GET(request: NextRequest) {
  if (process.env.VERCEL || !payMock() || !membersEnabled()) return new Response("not here", { status: 404 });
  const q = request.nextUrl.searchParams;
  const id = (q.get("id") ?? "1").replace(/\D/g, "").slice(0, 12) || "1";
  const via = (["kakao", "naver", "google"].includes(q.get("via") ?? "") ? q.get("via") : "kakao") as Via;
  return finishLogin(request, via, id, "시험손님", via === "kakao" ? null : `test${id}@example.com`, "/ask");
}
