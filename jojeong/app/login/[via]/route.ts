import type { NextRequest } from "next/server";
import { backTo, REDIRECT, startLogin } from "@/lib/login";
import { viaEnabled, type Via } from "@/lib/members";

// "카카오로 / 네이버로 / 구글로 시작하기" (app/login): off to that account's login page.
export async function GET(request: NextRequest, { params }: RouteContext<"/login/[via]">) {
  const via = (await params).via as Via;
  if (!["kakao", "naver", "google"].includes(via) || !viaEnabled(via)) return backTo(request, "/login");
  return startLogin(request, (state) => {
    const url =
      via === "kakao"
        ? new URL("https://kauth.kakao.com/oauth/authorize")
        : via === "naver"
          ? new URL("https://nid.naver.com/oauth2.0/authorize")
          : new URL("https://accounts.google.com/o/oauth2/v2/auth");
    const id = via === "kakao" ? process.env.KAKAO_REST_KEY : via === "naver" ? process.env.NAVER_CLIENT_ID : process.env.GOOGLE_CLIENT_ID;
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", id!.trim());
    url.searchParams.set("redirect_uri", REDIRECT[via]);
    url.searchParams.set("state", state);
    // Google: only the account id and the email (no name), and a choice of account every time.
    if (via === "google") {
      url.searchParams.set("scope", "openid email");
      url.searchParams.set("prompt", "select_account");
    }
    return url;
  });
}
