import { NextResponse, type NextRequest } from "next/server";
import { ORDERS_COOKIE } from "@/lib/cookies";
import { browserOrderIds, confirmOrder, covers, getOrder, setOrderRawPublic, withOrder } from "@/lib/pay";
import { addOrderToMember, changeCredits, currentMember } from "@/lib/members";
import { productById } from "@/lib/products";

// Toss returns here after the buyer pays: ?paymentKey&orderId&amount. The payment is confirmed only if the
// amount matches the order; then the order joins this browser's list and the report opens.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const fail = (message: string, orderId?: string) => {
    const url = new URL("/pay/fail", request.url);
    url.searchParams.set("message", message);
    if (orderId) url.searchParams.set("orderId", orderId);
    return NextResponse.redirect(url, 303);
  };

  const order = await getOrder(q.get("orderId"));
  const paymentKey = q.get("paymentKey") ?? "";
  if (!order || !paymentKey) return fail("주문을 찾지 못했어요.");
  const result = await confirmOrder(order, paymentKey, Number(q.get("amount")));
  if (!result.ok) return fail(result.message, order.id);

  const paid = (await getOrder(order.id))!;
  // 질문권: the questions go to the member who bought them, once (a reload of this page adds nothing).
  if (paid.credits && paid.member) {
    if (!paid.credited) {
      await setOrderRawPublic({ ...paid, credited: true });
      await changeCredits(paid.member, paid.credits, `구매 ${paid.id}`);
    }
    return NextResponse.redirect(new URL(`/ask?bought=${paid.credits}`, request.url), 303);
  }
  // A signed-in member keeps the report on their account too, so it opens on any device.
  const member = await currentMember().catch(() => null);
  if (member) await addOrderToMember(member.id, paid.id);
  const back = productById(q.get("back") ?? "");
  const to = back && covers(paid, back.id) ? `/reports/${back.id}?order=${order.id}` : `/r/${order.id}`;
  const res = NextResponse.redirect(new URL(to, request.url), 303);
  res.cookies.set(ORDERS_COOKIE, withOrder(await browserOrderIds(), order.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
