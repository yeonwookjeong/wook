import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { getOrder, type Order } from "@/lib/pay";
import { OPEN_ALL, productById, SETS } from "@/lib/products";
import { paidOrderIds } from "@/lib/store";
import { adminSignOut } from "./actions";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "관리자", robots: { index: false } };

const day = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);
// Today in Korea, read per request (the page is dynamic: it reads the admin cookie).
const todayKst = () => day(Date.now());

// The owner's page: sign in once per browser (ADMIN_PASSWORD), then every report opens here without payment,
// and the paid orders and revenue are listed.
export default async function AdminPage() {
  if (!adminConfigured())
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm leading-relaxed">
        Vercel 환경변수에 <b>ADMIN_PASSWORD</b>(8자 이상)를 넣고 다시 배포하면 관리자 페이지가 열려요.
      </p>
    );
  if (!(await isAdmin()))
    return (
      <section className="doc-paper mt-6 px-5 py-6">
        <h1 className="mb-4 text-center font-myeongjo text-xl font-extrabold">관리자 로그인</h1>
        <SignInForm />
      </section>
    );

  const ids = (await paidOrderIds().catch(() => [])).slice(-200).reverse();
  const orders = (await Promise.all(ids.map((id) => getOrder(id)))).filter((o): o is Order => o !== null);
  const paid = orders.filter((o) => o.status === "paid");
  const today = todayKst();
  const sum = (list: Order[]) => list.reduce((a, o) => a + o.amount, 0);
  const todays = paid.filter((o) => day(o.paidAt ?? o.createdAt) === today);
  const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

  return (
    <>
      <section className="mt-6 text-center">
        <h1 className="font-myeongjo text-2xl font-extrabold">관리자</h1>
        <p className="mt-1 text-sm text-ink-soft">
          이 브라우저에서는 모든 보고서를 결제 없이 볼 수 있어요 · 지금 {OPEN_ALL ? "무료 공개 중" : "판매 중"}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2 text-center">
        {[
          ["오늘 결제", `${todays.length}건 · ${won(sum(todays))}`],
          ["전체 결제", `${paid.length}건 · ${won(sum(paid))}`],
        ].map(([k, v]) => (
          <div key={k} className="doc-paper px-3 py-4">
            <p className="text-xs text-ink-soft">{k}</p>
            <p className="mt-1 font-myeongjo text-lg font-extrabold">{v}</p>
          </div>
        ))}
      </section>
      <p className="mt-2 text-center text-[11px] text-ink-soft">
        최근 200건 기준 · 테스트 결제도 포함돼요 · 정확한 정산은 토스 상점관리자에서 확인하세요
      </p>

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="font-myeongjo font-extrabold">최근 결제</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">아직 결제가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-seal/10 text-[13px]">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-2 py-2">
                <span className="w-20 shrink-0 text-[11px] text-ink-soft">{day(o.paidAt ?? o.createdAt).slice(5)}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{o.set ? SETS[o.set].title : productById(o.product)?.title}</b>
                  <span className="block truncate text-[11px] text-ink-soft">{o.who}</span>
                </span>
                <span className={`shrink-0 font-bold ${o.status === "paid" ? "" : "text-ink-soft line-through"}`}>{won(o.amount)}</span>
                <Link href={`/r/${o.id}`} className="shrink-0 text-seal">
                  →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={adminSignOut} className="mt-6 text-center">
        <button className="text-xs text-ink-soft underline">관리자 로그아웃</button>
      </form>
    </>
  );
}
