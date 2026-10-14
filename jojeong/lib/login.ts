import "server-only";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { GIFT_COOKIE, giveChannelGift, MEMBER_COOKIE, memberCookieValue, signInMember, VIA_COOKIE, type Via } from "./members";
import { browserOrderIds, getOrder, giveBonus } from "./pay";

// The way in and back for every login (app/login/[via], app/api/auth/*): a one-time state in a cookie, the page to
// return to (only paths on this site), and on return the member cookie, the gift-once-per-browser mark and the way
// last used.

export const REDIRECT: Record<Via, string> = {
  kakao: "https://www.hundosaju.com/api/auth/kakao",
  naver: "https://www.hundosaju.com/api/auth/naver",
  google: "https://www.hundosaju.com/api/auth/google",
};
const STATE_COOKIE = "jj_kstate";

export function startLogin(request: NextRequest, authorize: (state: string) => URL) {
  const next = request.nextUrl.searchParams.get("next") ?? "/ask";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 200) : "/ask";
  const state = randomBytes(16).toString("base64url");
  const res = NextResponse.redirect(authorize(state), 303);
  res.cookies.set(STATE_COOKIE, `${state}|${safeNext}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}

// The state checked: the page to go back to, or null when the return is not ours (or too late).
export function returnedTo(request: NextRequest): string | null {
  const [state, next = "/ask"] = (request.cookies.get(STATE_COOKIE)?.value ?? "").split("|");
  return state && request.nextUrl.searchParams.get("state") === state ? next : null;
}

export const backTo = (request: NextRequest, path: string) => NextResponse.redirect(new URL(path, request.url), 303);

export async function finishLogin(
  request: NextRequest,
  via: Via,
  accountId: string,
  nick: string,
  email: string | null,
  next: string,
  extra: { channel?: boolean } = {},
) {
  // The report link the buyer came back from (?order=…) counts as theirs too, so a report bought without
  // signing in brings its questions even when the sign-in is on another phone or browser.
  const linked = new URL(next, request.url).searchParams.get("order") ?? "";
  const ids = await browserOrderIds();
  const browserOrders = /^[\w-]{6,64}$/.test(linked) && !ids.includes(linked) ? [linked, ...ids] : ids;
  const { member, joined, added, gifted } = await signInMember(via, accountId, nick, email, {
    orders: browserOrders,
    gifted: Boolean(request.cookies.get(GIFT_COOKIE)?.value),
  });
  // Questions that came with reports bought here before signing in (A안), added once.
  let bonus = 0;
  for (const id of browserOrders) {
    const o = await getOrder(id);
    if (o) bonus += await giveBonus(o, member.id);
  }
  const to = new URL(next, request.url);
  if (joined) to.searchParams.set("joined", "1");
  if (added) to.searchParams.set("moved", String(added));
  if (bonus) to.searchParams.set("bonus", String(bonus));
  if (extra.channel && (await giveChannelGift(member.id))) to.searchParams.set("channel", "1");
  const res = NextResponse.redirect(to, 303);
  const year = 60 * 60 * 24 * 365;
  const secure = request.nextUrl.protocol === "https:";
  res.cookies.set(MEMBER_COOKIE, memberCookieValue(member.id), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: year });
  res.cookies.set(VIA_COOKIE, via, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: year });
  if (gifted) res.cookies.set(GIFT_COOKIE, "1", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: year });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
