import type { NextRequest } from "next/server";
import { backTo, finishLogin, REDIRECT, returnedTo } from "@/lib/login";
import { viaEnabled } from "@/lib/members";

// Google comes back here (the redirect URI registered for the client) with ?code&state: traded for a token, the
// token for the account id and email (scope "openid email": no name). The nickname is the email's first part.
export async function GET(request: NextRequest) {
  if (!viaEnabled("google")) return backTo(request, "/");
  const next = returnedTo(request);
  if (!next) return backTo(request, "/login?login=again");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return backTo(request, next);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: REDIRECT.google,
      code,
    }),
    cache: "no-store",
  }).catch(() => null);
  const token = (await tokenRes?.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!token?.access_token) {
    console.error("google token", token?.error_description);
    return backTo(request, "/login?login=fail");
  }
  const meRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  }).catch(() => null);
  const me = (await meRes?.json().catch(() => null)) as { sub?: string; email?: string; email_verified?: boolean } | null;
  if (!me?.sub || !/^[\w-]{1,64}$/.test(me.sub)) return backTo(request, "/login?login=fail");
  const email = me.email && me.email_verified ? me.email : null;
  return finishLogin(request, "google", me.sub, email?.split("@")[0] ?? "", email, next);
}
