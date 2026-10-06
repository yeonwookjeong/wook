import { NextResponse } from "next/server";
import { ORDERS_COOKIE } from "@/lib/cookies";
import { getOrder, ownedOrderIds, withOrder } from "@/lib/pay";
import { putTransfer, takeTransfer } from "@/lib/store";

// Moving "내 보고서" to another browser without an account (an iPhone home-screen app has its own cookies):
//   POST {}            → this browser's paid orders under a one-time code (10 minutes)
//   POST { code }      → the orders behind that code join this browser's list
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (!body.code) {
    const ids = await ownedOrderIds();
    if (!ids.length) return NextResponse.json({ error: "옮길 보고서가 없어요." }, { status: 400 });
    return NextResponse.json({ code: await putTransfer(ids) });
  }
  const ids = await takeTransfer(body.code);
  if (!ids) return NextResponse.json({ error: "코드가 맞지 않거나 시간이 지났어요. 새 코드를 만들어 주세요." }, { status: 400 });
  const paid = (await Promise.all(ids.map((id) => getOrder(id)))).filter((o) => o?.status === "paid").map((o) => o!.id);
  let list = await ownedOrderIds();
  for (const id of [...paid].reverse()) list = withOrder(list, id).split(".");
  const res = NextResponse.json({ moved: paid.length });
  res.cookies.set(ORDERS_COOKIE, list.join("."), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
