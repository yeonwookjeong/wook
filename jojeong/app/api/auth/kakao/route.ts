import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_REDIRECT, MEMBER_COOKIE, memberCookieValue, membersEnabled, signInMember } from "@/lib/members";
import { browserOrderIds } from "@/lib/pay";

// Kakao comes back here (the Redirect URI registered for the app) with ?code&state. The code is traded for a token,
// the token for the user's id and nickname; nothing else is asked for or kept. The member cookie is then set and
// the reader goes back where they started.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const home = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  if (!membersEnabled()) return home("/");
  const [state, next = "/ask"] = (request.cookies.get("jj_kstate")?.value ?? "").split("|");
  if (!state || q.get("state") !== state) return home("/ask?login=again");
  const code = q.get("code");
  if (!code) return home(next); // the reader said no on Kakao's page

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_KEY!.trim(),
      client_secret: process.env.KAKAO_CLIENT_SECRET!.trim(),
      redirect_uri: KAKAO_REDIRECT,
      code,
    }),
    cache: "no-store",
  }).catch(() => null);
  const token = (await tokenRes?.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!token?.access_token) {
    console.error("kakao token", token?.error_description);
    return home("/ask?login=fail");
  }
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" }).catch(() => null);
  const me = (await meRes?.json().catch(() => null)) as { id?: number; properties?: { nickname?: string }; kakao_account?: { profile?: { nickname?: string } } } | null;
  if (!me?.id) return home("/ask?login=fail");
  const nick = me.kakao_account?.profile?.nickname ?? me.properties?.nickname ?? "";

  const { member, joined, added } = await signInMember(String(me.id), nick, await browserOrderIds());
  const to = new URL(next, request.url);
  if (joined) to.searchParams.set("joined", "1");
  if (added) to.searchParams.set("moved", String(added));
  const res = NextResponse.redirect(to, 303);
  res.cookies.set(MEMBER_COOKIE, memberCookieValue(member.id), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  res.cookies.delete("jj_kstate");
  return res;
}
