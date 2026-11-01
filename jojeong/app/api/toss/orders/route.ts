import { CORS, tossOrdersOf } from "@/lib/tossApps";

// GET ?key=<the Toss anonymous key> → the reports that Toss account bought in the mini app.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  return Response.json({ orders: await tossOrdersOf(key).catch(() => []) }, { headers: { ...CORS, "cache-control": "no-store" } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
