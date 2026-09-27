import { payEnabled, syncPayment } from "@/lib/pay";

// Toss webhook (register https://www.hundosaju.com/api/pay/webhook for 결제 상태 변경 in the Toss developer
// center). Always answers 200 so Toss does not retry forever; the payment is re-read from Toss before acting.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ ok: true });
  const body = (await request.json().catch(() => ({}))) as { data?: { paymentKey?: string }; paymentKey?: string };
  const paymentKey = body.data?.paymentKey ?? body.paymentKey;
  if (paymentKey) await syncPayment(paymentKey).catch((e) => console.error("toss webhook", e));
  return Response.json({ ok: true });
}
