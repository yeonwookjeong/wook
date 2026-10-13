import type { NextRequest } from "next/server";
import { backTo, finishLogin, REDIRECT, returnedTo } from "@/lib/login";
import { membersEnabled } from "@/lib/members";
import { channelAdded } from "@/lib/kakaoChannel";

// Kakao comes back here (the Redirect URI registered for the app) with ?code&state. The code is traded for a token,
// the token for the user's id, nickname and (once the app may ask for it) email; nothing else is asked for or kept.
export async function GET(request: NextRequest) {
  if (!membersEnabled()) return backTo(request, "/");
  const next = returnedTo(request);
  if (!next) return backTo(request, "/login?login=again");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return backTo(request, next); // the reader said no on Kakao's page

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_KEY!.trim(),
      client_secret: process.env.KAKAO_CLIENT_SECRET!.trim(),
      redirect_uri: REDIRECT.kakao,
      code,
    }),
    cache: "no-store",
  }).catch(() => null);
  const token = (await tokenRes?.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!token?.access_token) {
    console.error("kakao token", token?.error_description);
    return backTo(request, "/login?login=fail");
  }
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" }).catch(
    () => null,
  );
  const me = (await meRes?.json().catch(() => null)) as {
    id?: number;
    properties?: { nickname?: string };
    kakao_account?: { profile?: { nickname?: string }; email?: string; is_email_valid?: boolean; is_email_verified?: boolean };
  } | null;
  if (!me?.id) return backTo(request, "/login?login=fail");
  const account = me.kakao_account;
  const email = account?.email && account.is_email_valid && account.is_email_verified ? account.email : null;
  // Added 훈도사주's channel: one more question, once (lib/members.ts giveChannelGift).
  const channel = (await channelAdded(token.access_token)) === true;
  return finishLogin(request, "kakao", String(me.id), account?.profile?.nickname ?? me.properties?.nickname ?? "", email, next, { channel });
}
