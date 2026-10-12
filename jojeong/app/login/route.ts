import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_REDIRECT, membersEnabled } from "@/lib/members";

// "카카오로 시작하기": off to Kakao's login, with a one-time state (kept in a cookie for the way back) and the page to
// return to. Only paths on this site are returned to.

export async function GET(request: NextRequest) {
  if (!membersEnabled()) return NextResponse.redirect(new URL("/", request.url), 303);
  const next = request.nextUrl.searchParams.get("next") ?? "/ask";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 200) : "/ask";
  const state = randomBytes(16).toString("base64url");
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.KAKAO_REST_KEY!.trim());
  url.searchParams.set("redirect_uri", KAKAO_REDIRECT);
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url, 303);
  res.cookies.set("jj_kstate", `${state}|${safeNext}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
