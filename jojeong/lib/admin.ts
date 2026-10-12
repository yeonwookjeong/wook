import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The owner's view: with ADMIN_PASSWORD set, /admin signs this browser in, and every report then opens
// without payment here. The cookie holds an HMAC of the password, so it cannot be made without knowing it.
const COOKIE = "jj_admin";
const password = () => process.env.ADMIN_PASSWORD?.trim() ?? "";
const tokenOf = (pw: string) => createHmac("sha256", pw).update("hundosaju-admin").digest("base64url");

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const adminConfigured = () => password().length >= 8;

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const got = (await cookies()).get(COOKIE)?.value ?? "";
  return same(got, tokenOf(password()));
}

export async function signIn(typed: string): Promise<boolean> {
  if (!adminConfigured() || !same(typed, password())) return false;
  (await cookies()).set(COOKIE, tokenOf(password()), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

// 시안 모드: the owner walks the public pages as a customer would (nothing opens without payment), with the
// free screen being readied (app/admin/free-preview). Only for a signed-in owner; everyone else sees no change.
const PREVIEW = "jj_preview";

export async function isPreview(): Promise<boolean> {
  return (await cookies()).get(PREVIEW)?.value === "1" && (await isAdmin());
}

export async function setPreview(on: boolean) {
  if (on) (await cookies()).set(PREVIEW, "1", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  else (await cookies()).delete(PREVIEW);
}
