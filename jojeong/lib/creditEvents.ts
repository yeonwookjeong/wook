import "server-only";
import { randomInt } from "node:crypto";
import { getMember, saveMember } from "./members";
import { countCreditEventClaim, creditEventClaims, creditEventCodes, getCreditEventRaw, noteCreditEvent, setCreditEventRaw } from "./store";

// Questions given away by the owner (/admin): an event with a link (/e/CODE) that a member opens to take its
// questions, once per account, while it is on, before its end and until as many have taken it as it allows.
// Kakao accounts only, like the joining gift: one per phone number, so new accounts cannot farm it.

export type CreditEvent = { code: string; name: string; credits: number; max: number; until: number; on: boolean; createdAt: number };
export type CreditEventRow = CreditEvent & { taken: number };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export async function getCreditEvent(code: string): Promise<CreditEvent | null> {
  const raw = await getCreditEventRaw(code.toUpperCase());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreditEvent;
  } catch {
    return null;
  }
}

export async function createCreditEvent(name: string, credits: number, max: number, days: number): Promise<CreditEvent> {
  const e: CreditEvent = {
    code: newCode(),
    name: name.trim().slice(0, 40) || "이벤트",
    credits: Math.min(5, Math.max(1, Math.trunc(credits) || 1)),
    max: Math.min(10000, Math.max(1, Math.trunc(max) || 1)),
    until: Date.now() + Math.min(365, Math.max(1, Math.trunc(days) || 7)) * 86400000,
    on: true,
    createdAt: Date.now(),
  };
  await setCreditEventRaw(e.code, JSON.stringify(e));
  await noteCreditEvent(e.code);
  return e;
}

export async function setCreditEventOn(code: string, on: boolean) {
  const e = await getCreditEvent(code);
  if (e) await setCreditEventRaw(e.code, JSON.stringify({ ...e, on }));
}

export async function listCreditEvents(): Promise<CreditEventRow[]> {
  const codes = [...new Set(await creditEventCodes())].reverse().slice(0, 50);
  const [events, taken] = await Promise.all([Promise.all(codes.map(getCreditEvent)), creditEventClaims(codes)]);
  return events.flatMap((e, i) => (e ? [{ ...e, taken: Math.min(taken[i], e.max) }] : []));
}

export type ClaimResult = { ok: true; credits: number } | { ok: false; why: "none" | "off" | "ended" | "full" | "taken" | "kakao" };

// Why an event cannot be taken right now (by anyone), or null when it can.
export function closedWhy(e: CreditEvent | null, taken: number): "none" | "off" | "ended" | "full" | null {
  if (!e) return "none";
  if (!e.on) return "off";
  if (Date.now() > e.until) return "ended";
  if (taken >= e.max) return "full";
  return null;
}

export async function claimCreditEvent(code: string, memberId: string): Promise<ClaimResult> {
  const e = await getCreditEvent(code);
  const [taken] = await creditEventClaims(e ? [e.code] : []);
  const closed = closedWhy(e, taken ?? 0);
  if (closed || !e) return { ok: false, why: closed ?? "none" };
  const m = await getMember(memberId);
  if (!m) return { ok: false, why: "kakao" };
  if (!m.id.startsWith("k")) return { ok: false, why: "kakao" };
  if (m.events?.includes(e.code)) return { ok: false, why: "taken" };
  // The counter decides the last places when many come at once.
  if ((await countCreditEventClaim(e.code)) > e.max) return { ok: false, why: "full" };
  m.events = [...(m.events ?? []), e.code].slice(-100);
  m.credits += e.credits;
  m.log.push({ at: Date.now(), d: e.credits, why: `이벤트 ${e.name} (${e.code})` });
  await saveMember(m);
  return { ok: true, credits: e.credits };
}
