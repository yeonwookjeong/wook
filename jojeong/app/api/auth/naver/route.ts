import type { NextRequest } from "next/server";
import { backTo, finishLogin, returnedTo } from "@/lib/login";
import { viaEnabled } from "@/lib/members";

// Naver comes back here (the Callback URL registered for the app) with ?code&state: traded for a token, the token
// for the account id, nickname and email (the only items the app asks for).
export async function GET(request: NextRequest) {
  if (!viaEnabled("naver")) return backTo(request, "/");
  const next = returnedTo(request);
  if (!next) return backTo(request, "/login?login=again");
  const q = request.nextUrl.searchParams;
  const code = q.get("code");
  if (!code) return backTo(request, next);

  const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID!.trim(),
      client_secret: process.env.NAVER_CLIENT_SECRET!.trim(),
      code,
      state: q.get("state") ?? "",
    }),
    cache: "no-store",
  }).catch(() => null);
  const token = (await tokenRes?.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!token?.access_token) {
    console.error("naver token", token?.error_description);
    return backTo(request, "/login?login=fail");
  }
  const meRes = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" }).catch(
    () => null,
  );
  const me = (await meRes?.json().catch(() => null)) as { resultcode?: string; response?: { id?: string; nickname?: string; email?: string } } | null;
  const id = me?.response?.id;
  if (me?.resultcode !== "00" || !id || !/^[\w-]{1,64}$/.test(id)) return backTo(request, "/login?login=fail");
  return finishLogin(request, "naver", id, me.response?.nickname ?? "", me.response?.email ?? null, next);
}
