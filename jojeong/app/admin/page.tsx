import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { getOrder, type Order } from "@/lib/pay";
import { productById, SETS } from "@/lib/products";
import { listInquiries, paidOrderIds, readingCount } from "@/lib/store";
import { adminSignOut, inquiryDeleteAction, inquiryDoneAction } from "./actions";
import SignInForm from "./SignInForm";
import { isPreview, newYearOf } from "@/lib/yeonun";

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
  const ny = newYearOf();
  const inquiries = await listInquiries().catch(() => []);
  const open = inquiries.filter((q) => !q.done);
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");

  return (
    <>
      <section className="mt-6 text-center">
        <h1 className="font-myeongjo text-2xl font-extrabold">관리자</h1>
        <p className="mt-1 text-sm text-ink-soft">
          이 브라우저에서는 모든 보고서를 결제 없이 볼 수 있어요 · 무료 보고서는 AI 없이 계산만 보여 줘요
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
      <p className="mt-3 text-center text-[13px]">
        지금까지 풀어 드린 사주 <b className="font-myeongjo text-seal">{(await readingCount()).toLocaleString("ko-KR")}</b>건
        <span className="block text-[11px] text-ink-soft">무료 분석 + 즉위 · 100건부터 홈에 표시돼요</span>
      </p>

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="flex items-baseline justify-between font-myeongjo font-extrabold">
          문의함
          <span className={`text-sm ${open.length ? "text-seal" : "text-ink-soft"}`}>새 문의 {open.length}건</span>
        </h2>
        {inquiries.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">아직 문의가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {inquiries.map((q) => (
              <li key={q.id} className={`rounded-xl border px-3 py-3 text-[13px] ${q.done ? "border-ink/10 opacity-60" : "border-seal/30 bg-white/60"}`}>
                <p className="flex items-baseline gap-2">
                  <b className={q.done ? "" : "text-seal"}>{q.topic}</b>
                  <span className="text-[11px] text-ink-soft">{when(q.at)}</span>
                  {q.done && <span className="ml-auto text-[11px] text-ink-soft">처리함</span>}
                </p>
                <p className="mt-1.5 text-left whitespace-pre-wrap">{q.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                  {q.email ? (
                    <a
                      href={`mailto:${q.email}?subject=${encodeURIComponent(`[훈도사주] ${q.topic} 문의 답변`)}`}
                      className="rounded-full bg-seal px-3 py-1 font-bold text-hanji"
                    >
                      답장하기 · {q.email}
                    </a>
                  ) : (
                    <span className="text-ink-soft">이메일 없음</span>
                  )}
                  <form action={inquiryDoneAction} className="ml-auto">
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="done" value={q.done ? "0" : "1"} />
                    <button className="rounded-full border border-ink/20 px-3 py-1">{q.done ? "다시 열기" : "처리 완료"}</button>
                  </form>
                  <form action={inquiryDeleteAction}>
                    <input type="hidden" name="id" value={q.id} />
                    <button className="rounded-full border border-ink/20 px-3 py-1 text-ink-soft">삭제</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="font-myeongjo font-extrabold">보고서 바로 확인</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          결제 없이 열려요. 이 브라우저에 저장된 사주(없으면 입력)로 보여 주고, 유료 보고서는 실제 AI가 써요(한 편에 수십~수백 원). 한 번 쓴 보고서는 같은
          사주·같은 조건이면 저장돼서 다시 쓰지 않아요.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[13px]">
          {[
            ...(ny ? [[`/reports/yeonun?y=${ny}`, isPreview(ny) ? `미리 보는 ${ny} 신년운세` : `${ny} 신년운세`]] : []),
            ["/reports/yeonun", "연운 (연도 목록)"],
            ["/reports/pyeongsaeng", "평생 사주"],
            ["/reports/jaemul", "재물운"],
            ["/reports/yeonae", "연애·결혼"],
            ["/reports/jikup", "직업·적성"],
            ["/reports/gunghap", "궁합"],
            ["/reports/taekil", "택일"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block rounded-lg border border-seal/20 bg-white/60 px-3 py-2 font-bold">
                {label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
