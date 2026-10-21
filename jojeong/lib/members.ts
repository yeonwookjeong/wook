import "server-only";
import { OPEN } from "./open";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isPreview } from "./admin";
import type { Source } from "./source";
import { SALE_KEYS } from "./sales";
import { clearMemberViews, countGiftToday, deleteAskRoom, deleteMemberRaw, getMemberRaw, giftGiven, memberIds, noteGiftGiven, noteMember, setMemberRaw } from "./store";

// Members, by Kakao, Naver or Google login (app/login, app/api/auth/*): what a browser cannot keep alone — the
// reports bought (so they open on any device) and the questions bought for 정 훈도에게 묻기. Only the account id, a
// nickname and the email are kept (the email to find someone who writes in about a refund), never a birth date.

export type Via = "kakao" | "naver" | "google";
export const VIA_PREFIX: Record<Via, string> = { kakao: "k", naver: "n", google: "g" };
export const viaOf = (id: string): Via => (id[0] === "n" ? "naver" : id[0] === "g" ? "google" : "kakao");
export const VIA_LABEL: Record<Via, string> = { kakao: "카카오", naver: "네이버", google: "구글" };

export type Member = {
  id: string; // "k" + the Kakao user id, "n" + the Naver id, "g" + the Google id
  nick: string;
  email?: string;
  createdAt: number;
  orders: string[]; // paid order ids, newest first
  credits: number; // questions left
  gift: boolean; // the free question for joining was given
  channel?: boolean; // the question for adding the Kakao channel was given (lib/kakaoChannel.ts)
  rooms: string[]; // their 정 훈도에게 묻기 rooms, newest first
  events?: string[]; // the 질문권 events they took (lib/creditEvents.ts), by code
  // Consent to news and offers (광고성 정보 수신, optional, never ticked for them): yes or no, and when it was given or
  // taken back. Asked again after NEWS_RECHECK, as the law asks of a standing consent every two years.
  news?: { on: boolean; at: number };
  // Every change to the credits, newest last (kept short): why, how many, when.
  log: { at: number; d: number; why: string }[];
  // The road this browser first came by (lib/source.ts), kept at joining (or the first sign-in after it was kept).
  src?: Source;
  // From Kakao, only when the member agreed to share them (선택 동의): "m" or "f", and the age band ("20~29").
  gender?: "m" | "f";
  age?: string;
};
// What Kakao may hand over at sign-in beyond the id and nickname, each only with the member's consent.
export type SignInProfile = { channel?: boolean; gender?: "m" | "f"; age?: string; src?: Source };

export const MEMBER_COOKIE = "jj_member";
export const JOIN_GIFT = 1;
// The joining gift is for Kakao accounts only (one per phone number, unlike a Google account), once per browser,
// and at most this many a day across the site, so making accounts cannot farm questions.
export const GIFT_DAILY_CAP = 200;
// 훈도사주's KakaoTalk channel (public id) and the question given once for adding it, to a Kakao member.
export const KAKAO_CHANNEL = "_xjxfkFX";
export const CHANNEL_GIFT = 1;
// On once the Kakao app asks "카카오톡 채널 추가 상태 및 내역" (developers.kakao.com → 동의항목); before that, asking
// for it at login would end on Kakao's error page.
export const CHANNEL_GIFT_ON = true;
export const GIFT_COOKIE = "jj_gifted";
// The way this browser last signed in, for the "최근에 이 방식으로" note on the login page.
export const VIA_COOKIE = "jj_via";
// What the member reads out when they write in: the kind of account and the end of its id.
export const memberNo = (id: string) => `${id[0].toUpperCase()}-${id.slice(1).slice(-6)}`;
// The opening of 정 훈도에게 묻기 to everyone: the sheet, the header button, the home tile, the cards at the end of
// a reading, /ask in search and the sitemap, the news. Off, only the owner's 시안 모드 shows them.
export const ASK_OPEN = OPEN;
export const askShown = async () => ASK_OPEN || (await isPreview());

// The cookie is the id with an HMAC, so it cannot be made for someone else without the secret.
const secret = () => process.env.KAKAO_CLIENT_SECRET?.trim() ?? "";
export const membersEnabled = () => Boolean(process.env.KAKAO_REST_KEY?.trim() && secret());
// Naver and Google turn on with their keys in Vercel; without them their buttons are not shown.
export const viaEnabled = (via: Via) =>
  membersEnabled() &&
  (via === "kakao" ||
    (via === "naver" && Boolean(process.env.NAVER_CLIENT_ID?.trim() && process.env.NAVER_CLIENT_SECRET?.trim())) ||
    (via === "google" && Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())));
const sign = (id: string) => createHmac("sha256", secret()).update(`member:${id}`).digest("base64url");
export const memberCookieValue = (id: string) => `${id}.${sign(id)}`;

function idFromCookie(value: string | undefined): string | null {
  if (!value || !membersEnabled()) return null;
  const [id, sig] = value.split(".");
  if (!id || !sig || !/^(k\d{1,20}|[ng][\w-]{1,64})$/.test(id)) return null;
  const want = sign(id);
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want)) ? id : null;
}

export async function getMember(id: string): Promise<Member | null> {
  const raw = await getMemberRaw(id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Member;
  } catch {
    return null;
  }
}
export async function saveMember(m: Member) {
  await setMemberRaw(m.id, JSON.stringify({ ...m, log: m.log.slice(-50) }));
}

// The member signed in on this browser, if any.
export async function currentMember(): Promise<Member | null> {
  const id = await currentMemberId();
  return id ? getMember(id) : null;
}
// Only the id, without reading the record (for counting what a member looks at).
export const currentMemberId = async () => idFromCookie((await cookies()).get(MEMBER_COOKIE)?.value);

// A short keyed hash of a member id for the owner's order CSV: it ties one buyer's orders together without the id
// itself (a Kakao id is a number short enough to guess back from a plain hash). It changes if the secret does.
// "M" first, so a spreadsheet keeps it as text (never a number or a formula).
export const buyerTag = (id: string) => `M${createHmac("sha256", secret()).update(`buyer:${id}`).digest("hex").slice(0, 10)}`;

const giftMark = (id: string) => createHmac("sha256", secret()).update(`gift:${id}`).digest("base64url");

// The channel question, once per Kakao account: kept as a mark like the joining gift, so leaving and joining
// again (or blocking and adding the channel again) does not bring it back.
const channelMark = (id: string) => createHmac("sha256", secret()).update(`channel:${id}`).digest("base64url");
export async function giveChannelGift(id: string): Promise<number> {
  const m = await getMember(id);
  if (!CHANNEL_GIFT_ON || !m || m.channel || !id.startsWith("k")) return 0;
  m.channel = true;
  const given = await giftGiven(channelMark(id));
  if (!given) {
    m.credits += CHANNEL_GIFT;
    m.log.push({ at: Date.now(), d: CHANNEL_GIFT, why: "채널 추가 선물" });
  }
  await saveMember(m);
  if (given) return 0;
  await noteGiftGiven(channelMark(id));
  return CHANNEL_GIFT;
}

export const NEWS_RECHECK = 2 * 365 * 24 * 3600 * 1000;
// Whether to ask the member about news: never asked, or a yes older than two years.
export const newsToAsk = (m: Member, now = Date.now()) => !m.news || (m.news.on && now - m.news.at > NEWS_RECHECK);
export async function setNews(id: string, on: boolean) {
  const m = await getMember(id);
  if (!m) return;
  m.news = { on, at: Date.now() };
  await saveMember(m);
}

// First sign-in makes the record (with the gift question, on the terms above); later ones find it. Orders this
// browser already holds join it either way, and a newly given email is kept.
export async function signInMember(
  via: Via,
  accountId: string,
  nick: string,
  email: string | null,
  browser: { orders: string[]; gifted: boolean },
  profile: SignInProfile = {},
): Promise<{ member: Member; joined: boolean; added: number; gifted: boolean }> {
  const id = `${VIA_PREFIX[via]}${accountId}`;
  let member = await getMember(id);
  const joined = !member;
  let gifted = false;
  if (!member) {
    // The gift once per Kakao account: leaving and joining again does not bring it back.
    gifted = via === "kakao" && !browser.gifted && !(await giftGiven(giftMark(id))) && (await countGiftToday()) <= GIFT_DAILY_CAP;
    member = {
      id,
      nick: nick.slice(0, 20) || "손님",
      createdAt: Date.now(),
      orders: [],
      credits: gifted ? JOIN_GIFT : 0,
      gift: gifted,
      rooms: [],
      log: gifted ? [{ at: Date.now(), d: JOIN_GIFT, why: "가입 선물" }] : [],
    };
    if (gifted) await noteGiftGiven(giftMark(id));
    await noteMember(id);
  }
  if (email) member.email = email.slice(0, 120);
  // The first road stays the first; gender and age follow what Kakao gives now (dropped when consent is taken back).
  if (!member.src && profile.src) member.src = profile.src;
  if (via === "kakao") {
    member.gender = profile.gender;
    member.age = profile.age;
  }
  const before = member.orders.length;
  member.orders = [...new Set([...member.orders, ...browser.orders])].slice(0, 200);
  await saveMember(member);
  return { member, joined, added: member.orders.length - before, gifted };
}

export async function addOrderToMember(id: string, orderId: string) {
  const m = await getMember(id);
  if (!m || m.orders.includes(orderId)) return;
  m.orders = [orderId, ...m.orders].slice(0, 200);
  await saveMember(m);
}

// Questions added (bought, given) or taken away (one asked, a refund); never below zero.
export async function changeCredits(id: string, d: number, why: string): Promise<number | null> {
  const m = await getMember(id);
  if (!m) return null;
  m.credits = Math.max(0, m.credits + d);
  m.log.push({ at: Date.now(), d, why });
  await saveMember(m);
  return m.credits;
}

export async function addRoomToMember(id: string, roomId: string) {
  const m = await getMember(id);
  if (!m) return;
  m.rooms = [roomId, ...m.rooms.filter((r) => r !== roomId)].slice(0, 50);
  await saveMember(m);
}

// The latest `limit` members (the admin list); the owner's CSVs ask for all of them.
export async function allMembers(limit = 500): Promise<Member[]> {
  const ids = [...new Set(await memberIds())].slice(-limit);
  const ms = await Promise.all(ids.map(getMember));
  return ms.filter((m): m is Member => Boolean(m));
}

// Leaving: the member record and their consultation rooms go at once (lib/privacy: 회원 탈퇴 시 지체 없이 삭제).
// Payment records stay with the orders, as the law keeps them. With the app's admin key the Kakao link is cut
// too, so the next Kakao login starts fresh.
export async function deleteMember(id: string, unlinkKakao = true) {
  const m = await getMember(id);
  if (m) await Promise.all(m.rooms.map((r) => deleteAskRoom(r)));
  // Members from before the mark was kept: noted now, so joining again brings no second gift.
  if (m?.gift) await noteGiftGiven(giftMark(id));
  await deleteMemberRaw(id);
  await clearMemberViews(id, SALE_KEYS);
  // Naver and Google links can only be cut with the person's own token, which is not kept: they cut it from their
  // account settings (the leave page says so).
  const admin = process.env.KAKAO_ADMIN_KEY?.trim();
  if (unlinkKakao && admin && viaOf(id) === "kakao")
    await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: { Authorization: `KakaoAK ${admin}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target_id_type: "user_id", target_id: id.slice(1) }),
    }).catch(() => null);
}

// Kakao's call when someone cuts the link from their Kakao settings: it carries the app's admin key.
export const isKakaoCall = (authorization: string | null) => {
  const admin = process.env.KAKAO_ADMIN_KEY?.trim();
  return Boolean(admin && authorization === `KakaoAK ${admin}`);
};
