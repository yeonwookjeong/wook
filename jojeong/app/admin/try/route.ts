import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { ME_COOKIE } from "@/lib/cookies";
import { rememberMe } from "@/lib/me";
import { personOf } from "@/lib/personForm";

export const dynamic = "force-dynamic";

// The owner opening a report as a test chart (2026-10-26 상품 점검): /admin/try?name=…&birth=YYYYMMDD&hour=…&gender=m|f
// &next=/reports/… puts that chart in this browser, as the birth form would, and goes on to the report, where the
// owner's look writes it. The owner's own chart is kept aside and comes back with /admin/try?restore=1. Owner only.
const KEPT = "jj_me_kept";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new Response(null, { status: 404 });
  const q = request.nextUrl.searchParams;
  const jar = await cookies();
  if (q.get("restore") === "1") {
    const kept = jar.get(KEPT)?.value;
    if (kept) jar.set(ME_COOKIE, kept, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    else jar.delete(ME_COOKIE);
    jar.delete(KEPT);
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }
  const next = q.get("next") ?? "";
  if (!/^\/(reports|ask)(\/|\?|$)/.test(next)) return new Response("next must be a /reports or /ask path", { status: 400 });
  const form = new FormData();
  for (const k of ["name", "birth", "calendar", "time", "hour", "city", "gender", "yaja"]) {
    const v = q.get(k);
    if (v !== null) form.set(k, v);
  }
  try {
    const person = await personOf(form, "", "시험");
    const own = jar.get(ME_COOKIE)?.value;
    if (own && !jar.get(KEPT)) jar.set(KEPT, own, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    await rememberMe(person);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "bad chart", { status: 400 });
  }
  return NextResponse.redirect(new URL(next, request.url), 303);
}
