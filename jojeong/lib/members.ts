import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getMemberRaw, memberIds, noteMember, setMemberRaw } from "./store";

// Members, by Kakao login (app/login, app/api/auth/kakao): what a browser cannot keep alone — the reports bought
// (so they open on any device) and the questions bought for 정 훈도에게 묻기. Only the Kakao id and nickname are
// kept, never a birth date or anything else from Kakao.

export type Member = {
  id: string; // "k" + the Kakao user id
  nick: string;
  createdAt: number;
  orders: string[]; // paid order ids, newest first
  credits: number; // questions left
  gift: boolean; // the free question for joining was given
  rooms: string[]; // their 정 훈도에게 묻기 rooms, newest first
  // Every change to the credits, newest last (kept short): why, how many, when.
  log: { at: number; d: number; why: string }[];
};

export const MEMBER_COOKIE = "jj_member";
// The Redirect URI registered for the Kakao app (only the live site; previews cannot sign in).
export const KAKAO_REDIRECT = "https://www.hundosaju.com/api/auth/kakao";
export const JOIN_GIFT = 1;

// The cookie is the id with an HMAC, so it cannot be made for someone else without the secret.
const secret = () => process.env.KAKAO_CLIENT_SECRET?.trim() ?? "";
export const membersEnabled = () => Boolean(process.env.KAKAO_REST_KEY?.trim() && secret());
const sign = (id: string) => createHmac("sha256", secret()).update(`member:${id}`).digest("base64url");
export const memberCookieValue = (id: string) => `${id}.${sign(id)}`;

function idFromCookie(value: string | undefined): string | null {
  if (!value || !membersEnabled()) return null;
  const [id, sig] = value.split(".");
  if (!id || !sig || !/^k\d{1,20}$/.test(id)) return null;
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
  const id = idFromCookie((await cookies()).get(MEMBER_COOKIE)?.value);
  return id ? getMember(id) : null;
}

// First sign-in makes the record (with the gift question); later ones find it. Orders this browser already
// holds join it either way.
export async function signInMember(kakaoId: string, nick: string, browserOrders: string[]): Promise<{ member: Member; joined: boolean; added: number }> {
  const id = `k${kakaoId}`;
  let member = await getMember(id);
  const joined = !member;
  if (!member) {
    member = { id, nick: nick.slice(0, 20) || "손님", createdAt: Date.now(), orders: [], credits: JOIN_GIFT, gift: true, rooms: [], log: [{ at: Date.now(), d: JOIN_GIFT, why: "가입 선물" }] };
    await noteMember(id);
  }
  const before = member.orders.length;
  member.orders = [...new Set([...member.orders, ...browserOrders])].slice(0, 200);
  await saveMember(member);
  return { member, joined, added: member.orders.length - before };
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

export async function allMembers(): Promise<Member[]> {
  const ids = [...new Set(await memberIds())].slice(-500);
  const ms = await Promise.all(ids.map(getMember));
  return ms.filter((m): m is Member => Boolean(m));
}
