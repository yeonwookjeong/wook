import { NextResponse, type NextRequest } from "next/server";

// The short link for Threads (hundosaju.com/t, or /t/column/... for a page): a plain address on the profile and
// in posts, that marks the visit as coming from Threads (lib/source.ts reads utm_source on the first visit) and
// goes on to the page. Catches readers Threads sends without a trace: opened in Safari or Chrome, or copied.
export async function GET(request: NextRequest, ctx: RouteContext<"/t/[[...path]]">) {
  const { path = [] } = await ctx.params;
  const origin = new URL(request.url).origin;
  // Each segment encoded, so nothing in the path can lead off the site.
  const to = new URL("/" + path.map(encodeURIComponent).join("/"), origin);
  if (to.origin !== origin) return NextResponse.redirect(new URL("/", origin), 307);
  new URL(request.url).searchParams.forEach((v, k) => to.searchParams.set(k, v));
  to.searchParams.set("utm_source", "threads");
  return NextResponse.redirect(to, 307);
}
