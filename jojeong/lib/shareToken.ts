import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { decodePerson, encodePerson, type Person } from "./pairToken";

// "친구에게 보내기": the whole free result goes in the address, so the friend opens it as the sender saw it. What it
// carries is what a 궁합 link already carries (lib/pairToken.ts): a name, the eight characters, gender, birth
// year and the ten-year cycles, never the birth date. It is signed, so nobody can make a page say something we
// did not compute from a chart.
//   /s/reading/<token>   the free 사주 분석 (the year reading with the whole chart analysis)
//   /s/sinbun/<token>    the 조선 신분 감정
export type ShareKind = "reading" | "sinbun";
export const isShareKind = (v: unknown): v is ShareKind => v === "reading" || v === "sinbun";

const secret = () => `hundosaju-share:${process.env.ADMIN_PASSWORD?.trim() || "dev"}`;
const sign = (kind: string, body: string) => createHmac("sha256", secret()).update(`${kind}.${body}`).digest("base64url").slice(0, 16);

export function sealPerson(kind: ShareKind, person: Person): string {
  const body = encodePerson(person);
  return `${body}.${sign(kind, body)}`;
}

export function openPerson(kind: ShareKind, token: string): Person | null {
  const [body, sig, ...rest] = token.split(".");
  if (!body || !sig || rest.length) return null;
  const want = sign(kind, body);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  return decodePerson(body);
}
