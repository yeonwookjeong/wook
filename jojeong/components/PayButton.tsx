"use client";

import { useState } from "react";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

// Makes the order on our side, then opens the Toss payment window (카드·간편결제). Toss returns the buyer to
// /pay/success or /pay/fail. With PAY_MOCK the window is skipped and the success page is opened directly.
export default function PayButton({ request, label }: { request: Record<string, string>; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
      const order = (await res.json()) as { orderId?: string; amount?: number; orderName?: string; clientKey?: string; mock?: boolean; error?: string };
      if (!res.ok || !order.orderId || !order.amount || !order.clientKey) throw new Error(order.error ?? "주문을 만들지 못했어요.");
      const origin = window.location.origin;
      if (order.mock) {
        // /pay/success is a route handler that sets a cookie and redirects: a full navigation, like Toss does.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `${origin}/pay/success?paymentKey=mock_${order.orderId}&orderId=${order.orderId}&amount=${order.amount}`;
        return;
      }
      const toss = await loadTossPayments(order.clientKey);
      await toss.payment({ customerKey: ANONYMOUS }).requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: order.amount },
        orderId: order.orderId,
        orderName: order.orderName ?? "훈도사주 보고서",
        successUrl: `${origin}/pay/success`,
        failUrl: `${origin}/pay/fail`,
      });
    } catch (e) {
      // Closing the window is not an error worth a message.
      const code = (e as { code?: string }).code;
      if (code !== "USER_CANCEL" && code !== "PAY_PROCESS_CANCELED") setError(e instanceof Error ? e.message : "결제창을 열지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="mt-4 w-full rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14] disabled:opacity-60"
      >
        {busy ? "결제창을 여는 중이에요…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
          {error}
        </p>
      )}
    </>
  );
}
