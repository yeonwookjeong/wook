import type { Metadata } from "next";
import Link from "next/link";
import { ownedOrders } from "@/lib/pay";
import { productById, SETS } from "@/lib/products";
import MoveOrders from "@/components/MoveOrders";

export const metadata: Metadata = { title: "내 보고서", robots: { index: false } };

// Reports bought in this browser. Each keeps its own permanent link (/r/…) for other devices.
export default async function MyReportsPage() {
  const orders = await ownedOrders();
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">書 庫</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">내 보고서</h1>
        <p className="mt-2 text-sm text-ink-soft">이 브라우저에서 결제한 보고서예요</p>
      </section>
      {orders.length === 0 ? (
        <div className="doc-paper mt-6 px-5 py-8 text-center text-sm leading-relaxed">
          <p>아직 결제한 보고서가 없어요.</p>
          <p className="mt-1 text-xs text-ink-soft">
            다른 기기에서 결제했다면 보고서 화면의 링크로 열 수 있어요. 링크를 잃어버렸다면{" "}
            <Link href="/contact" className="underline">
              문의하기
            </Link>
            로 알려 주세요.
          </p>
          <Link href="/" className="mt-5 block bg-seal py-3 font-myeongjo font-extrabold text-hanji">
            보고서 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => {
            const p = productById(o.product);
            return (
              <li key={o.id}>
                <Link href={`/r/${o.id}`} className="doc-paper flex items-center gap-4 px-5 py-4">
                  <span className="flex size-12 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo text-sm font-extrabold text-seal">
                    {p?.hanja}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-myeongjo text-lg font-extrabold">{o.set ? SETS[o.set].title : p?.title}</span>
                    {o.bundle && <span className="block text-[12px] text-seal">{o.bundle.map((id) => productById(id)?.title).join(" · ")}</span>}
                    <span className="block text-[13px] text-ink-soft">
                      {o.who} · {new Date(o.paidAt ?? o.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </span>
                  </span>
                  <span className="text-seal">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <MoveOrders has={orders.length > 0} />
    </>
  );
}
