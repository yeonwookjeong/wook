import { NextResponse, type NextRequest } from "next/server";
import { MEMBER_COOKIE, memberCookieValue, membersEnabled, signInMember } from "@/lib/members";
import { browserOrderIds, payMock } from "@/lib/pay";

// Local trials only (PAY_MOCK=1 on a machine, never on Vercel): sign in as a made-up Kakao id, as the Kakao
// return would.
export async function GET(request: NextRequest) {
  if (process.env.VERCEL || !payMock() || !membersEnabled()) return new Response("not here", { status: 404 });
  const id = (request.nextUrl.searchParams.get("id") ?? "1").replace(/\D/g, "").slice(0, 12) || "1";
  const { member, joined, added } = await signInMember(id, "시험손님", await browserOrderIds());
  const to = new URL("/ask", request.url);
  if (joined) to.searchParams.set("joined", "1");
  if (added) to.searchParams.set("moved", String(added));
  const res = NextResponse.redirect(to, 303);
  res.cookies.set(MEMBER_COOKIE, memberCookieValue(member.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 });
  return res;
}
