import type { Metadata } from "next";
import Link from "next/link";
import RoyalDoc from "@/components/RoyalDoc";
import { getOrder } from "@/lib/pay";

export const metadata: Metadata = { title: "결제가 끝나지 않았어요", robots: { index: false } };

// Toss sends a failed or cancelled payment here (?code&message&orderId); so does /pay/success when it cannot
// confirm. Nothing was charged unless the message says otherwise.
export default async function PayFailPage({ searchParams }: PageProps<"/pay/fail">) {
  const q = await searchParams;
  const message = typeof q.message === "string" ? q.message.slice(0, 200) : "결제가 취소됐어요.";
  const order = await getOrder(typeof q.orderId === "string" ? q.orderId : null);
  const back = order ? `/reports/${order.product}` : "/reports";
  return (
    <RoyalDoc className="mt-6" paperClassName="px-5 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">未 完</p>
      <h1 className="mt-2 font-myeongjo text-2xl font-extrabold">결제가 끝나지 않았어요</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{message}</p>
      <Link href={back} className="mt-6 block rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]">
        다시 시도하기
      </Link>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        카드에서 돈이 빠져나갔는데 보고서가 열리지 않으면{" "}
        <Link href="/contact" className="underline">
          문의하기
        </Link>
        로 알려 주세요.
      </p>
    </RoyalDoc>
  );
}
