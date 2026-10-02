import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Rank } from "./sinbun";

// What a friend's link carries: the sender's RESULT (a name, a day pillar, the five powers, a verdict), never a
// birth date or the eight characters. It rides in the address, signed, so the page can show the sender's card
// without storing anything, and nobody can make a card say something we did not compute.
//   /s/reading/<token>   the free 사주 분석 card
//   /s/sinbun/<token>    the 조선 신분 감정 card
export type ReadingShare = {
  n: string; // the name as typed
  s: number; // day stem
  b: number; // day branch
  p: [group: string, name: string, pct: number][]; // the five powers
  k: [label: string, type: string][]; // 돈 · 사랑 · 일
  r: string; // "같은 신묘일주 중 약 3%만 이 구조", or ""
};
export type SinbunShare = { n: string; r: Rank; j: string; l: string; w: number; y: number };
export type ShareKind = "reading" | "sinbun";
export type ShareOf<K extends ShareKind> = K extends "reading" ? ReadingShare : SinbunShare;
export const isShareKind = (v: unknown): v is ShareKind => v === "reading" || v === "sinbun";

const secret = () => `hundosaju-share:${process.env.ADMIN_PASSWORD?.trim() || "dev"}`;
const sign = (kind: string, body: string) => createHmac("sha256", secret()).update(`${kind}.${body}`).digest("base64url").slice(0, 16);

export function sealShare<K extends ShareKind>(kind: K, data: ShareOf<K>): string {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(kind, body)}`;
}

export function openShare<K extends ShareKind>(kind: K, token: string): ShareOf<K> | null {
  const [body, sig, ...rest] = token.split(".");
  if (!body || !sig || rest.length || body.length > 2000) return null;
  const want = sign(kind, body);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as ShareOf<K>;
  } catch {
    return null;
  }
}
