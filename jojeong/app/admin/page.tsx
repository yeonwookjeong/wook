import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { giftOrders, paidOrders, type Order } from "@/lib/pay";
import CopyButton from "@/components/CopyButton";
import { GIFTABLE, originNow } from "@/lib/gift";
import { SALE_KEYS, saleKey, saleLabel } from "@/lib/sales";
import { productById, SETS } from "@/lib/products";
import { listInquiries, readingCount } from "@/lib/store";
import { adminSignOut, giftRevokeAction, inquiryDeleteAction, inquiryDoneAction } from "./actions";
import GiftForm from "./GiftForm";
import SignInForm from "./SignInForm";
import { isPreview, newYearOf, thisYear } from "@/lib/yeonun";
import { inPeriods, PERIODS, readStats, type Period } from "@/lib/stats";
import { SHARE_FROM, STEP_FROM, STEP_LABEL } from "@/lib/nextStep";
import { SOURCES } from "@/lib/source";
import { DailyTable, SourceTable } from "./Insights";

export const metadata: Metadata = { title: "관리자", robots: { index: false } };

const day = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);
// Today in Korea, read per request (the page is dynamic: it reads the admin cookie).
const todayKst = () => day(Date.now());

// The owner's page: sign in once per browser (ADMIN_PASSWORD), then every report opens here without payment,
// and the paid orders and revenue are listed.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
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

  // Every paid order (refunds keep their record with status "canceled"), newest first.
  const orders = (await paidOrders()).reverse();
  // Reports given away: their own list, never among the paid orders above.
  const gifts = await giftOrders(50);
  const origin = await originNow();
  const paid = orders.filter((o) => o.status === "paid");
  const q = await searchParams;
  const sp = String(q.sp ?? "all");
  // The day-by-day span (?df=&dt=), the last seven days unless chosen.
  const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  const dt = isDay(q.dt) ? q.dt : todayKst();
  const df = isDay(q.df) && q.df <= dt ? q.df : day(Date.parse(`${dt}T12:00:00+09:00`) - 6 * 86400000);
  const period: Period = PERIODS.some((p) => p.key === sp) ? (sp as Period) : "all";
  const today = todayKst();
  const sum = (list: Order[]) => list.reduce((a, o) => a + o.amount, 0);
  const todays = paid.filter((o) => day(o.paidAt ?? o.createdAt) === today);
  const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
  const ny = newYearOf();
  const inquiries = await listInquiries().catch(() => []);
  const open = inquiries.filter((q) => !q.done);
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
  const stats = await readStats([
    ...["uv", "pv", "reading", "king", "join", "appoint", "share_court", "share_result", "save_image", "own_court", "to_saju"],
    ...STEP_FROM.map((f) => `to:${f}`),
    ...SHARE_FROM.flatMap((f) => [`sh:${f}`, `sv:${f}`]),
    ...SOURCES.map((s) => `src:${s}`),
    ...SALE_KEYS.flatMap((k) => [`view:${k}`, `co:${k}`]),
  ]);
  // Paid orders per period.
  const paidBy = Object.fromEntries(PERIODS.map(({ key }) => [key, { n: 0, won: 0 }])) as Record<Period, { n: number; won: number }>;
  for (const o of paid)
    for (const p of inPeriods(o.paidAt ?? o.createdAt)) {
      paidBy[p].n += 1;
      paidBy[p].won += o.amount;
    }

  return (
    <>
      <section className="mt-6 text-center">
        <h1 className="font-myeongjo text-2xl font-extrabold">관리자</h1>
        <p className="mt-1 text-sm text-ink-soft">
          이 브라우저에서는 모든 보고서를 결제 없이 볼 수 있어요 · 무료 보고서는 AI 없이 계산만 보여 줘요
        </p>
        <Link href="/admin/sns" className="mt-3 inline-block rounded-full bg-seal px-5 py-2 text-sm font-bold text-white">
          오늘 SNS 올릴 것 보기 →
        </Link>
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
        테스트 결제도 포함돼요 · 정확한 정산은 토스 상점관리자에서 확인하세요
      </p>
      <p className="mt-3 text-center text-[13px]">
        지금까지 풀어 드린 사주 <b className="font-myeongjo text-seal">{(await readingCount()).toLocaleString("ko-KR")}</b>건
        <span className="block text-[11px] text-ink-soft">무료 분석 + 즉위 · 100건부터 홈에 표시돼요</span>
      </p>

      <StatsTable stats={stats} paidBy={paidBy} />
      <SourceTable stats={stats} paid={paid} />
      <DailyTable from={df} to={dt} paid={paid} />
      <SalesTable
        period={period}
        stats={stats}
        paid={paid.filter((o) => inPeriods(o.paidAt ?? o.createdAt).includes(period))}
        refunds={orders.filter((o) => o.status === "canceled" && inPeriods(o.paidAt ?? o.createdAt).includes(period)).length}
      />

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
        <h2 className="font-myeongjo font-extrabold">보고서 선물 링크</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          친구의 생년월일과 열어 줄 보고서를 고르면 링크가 나와요. 받은 사람은 어느 기기에서든 결제 없이 열어요. <b>0원이라 매출에는 잡히지 않아요.</b> 유료
          보고서는 실제 AI가 써서 한 편에 수십~수백 원이 들어요. 생년월일은 저장하지 않고, 이름과 사주 글자만 링크에 담겨요. 친구에게 미리 알려 주세요.
        </p>
        <GiftForm
          products={GIFTABLE.map((id) => ({ id, title: productById(id)?.title ?? id }))}
          years={Array.from({ length: 6 }, (_, i) => thisYear() - 2 + i)}
          defaultYear={ny ?? thisYear()}
        />
        {gifts.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-bold">발급한 링크 ({gifts.length})</h3>
            <ul className="mt-2 flex flex-col divide-y divide-seal/10 text-[13px]">
              {gifts.map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-2">
                  <span className="w-12 shrink-0 text-[11px] text-ink-soft">{day(o.createdAt).slice(5)}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{productById(o.product)?.title}</b>
                    <span className="block truncate text-[11px] text-ink-soft">
                      {o.who}
                      {o.status !== "paid" && " · 회수됨"}
                    </span>
                  </span>
                  {o.status === "paid" ? (
                    <>
                      <CopyButton text={`${origin}/r/${o.id}`} label="복사" />
                      <form action={giftRevokeAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button className="shrink-0 rounded-lg border border-ink/15 px-2 py-1.5 text-[12px] text-ink-soft">회수</button>
                      </form>
                    </>
                  ) : (
                    <span className="shrink-0 text-[11px] text-ink-soft line-through">닫힘</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="font-myeongjo font-extrabold">최근 결제</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">아직 결제가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-seal/10 text-[13px]">
            {orders.slice(0, 100).map((o) => (
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

// Visits and the 왕이 될 사주 → 훈도사주 funnel, per period (lib/stats.ts). Counting started with this table,
// so "전체" means since then.
const ROWS: { key: string; label: string; group?: string }[] = [
  { key: "uv", label: "방문자", group: "방문" },
  { key: "pv", label: "페이지뷰" },
  { key: "king", label: "즉위", group: "왕이 될 사주" },
  { key: "share_court", label: "신하 부르기 공유" },
  { key: "join", label: "입궐 (친구)" },
  { key: "appoint", label: "직접 등용" },
  { key: "share_result", label: "결과 공유" },
  { key: "save_image", label: "이미지 저장" },
  { key: "own_court", label: "나도 조정 만들기" },
  { key: "to_saju", label: "무료 → 다음 걸음 (전체)", group: "훈도사주" },
  ...STEP_FROM.map((f) => ({ key: `to:${f}`, label: `　└ ${STEP_LABEL[f]}` })),
  // The pages that carry a card to send or save.
  ...SHARE_FROM.flatMap((f) => [
    { key: `sh:${f}`, label: `${STEP_LABEL[f]}: 친구에게 보내기`, ...(f === SHARE_FROM[0] && { group: "공유" }) },
    { key: `sv:${f}`, label: `${STEP_LABEL[f]}: 카드 저장` },
  ]),
  { key: "reading", label: "무료 사주 분석" },
];

function StatsTable({ stats, paidBy }: { stats: Record<string, Record<Period, number>>; paidBy: Record<Period, { n: number; won: number }> }) {
  const n = (v: number) => v.toLocaleString("ko-KR");
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  const m = (k: string) => stats[k]?.month ?? 0;
  return (
    <section className="doc-paper mt-4 px-3 py-4">
      <h2 className="px-1 font-myeongjo font-extrabold">방문과 전환</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-right text-[12px] tabular-nums">
          <thead>
            <tr className="text-ink-soft">
              <th className="py-1 text-left font-normal"></th>
              {PERIODS.map((p) => (
                <th key={p.key} className="px-1 py-1 font-normal">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key} className={r.group ? "border-t border-seal/20" : ""}>
                <td className="py-1 text-left">
                  {r.group && <span className="block pt-1 text-[10px] font-extrabold text-seal">{r.group}</span>}
                  {r.label}
                </td>
                {PERIODS.map((p) => (
                  <td key={p.key} className="px-1 py-1">
                    {n(stats[r.key]?.[p.key] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-seal/20 font-bold">
              <td className="py-1 text-left">결제</td>
              {PERIODS.map((p) => (
                <td key={p.key} className="px-1 py-1">
                  {n(paidBy[p.key].n)}
                </td>
              ))}
            </tr>
            <tr className="font-bold">
              <td className="py-1 text-left">매출</td>
              {PERIODS.map((p) => (
                <td key={p.key} className="px-1 py-1 text-[11px]">
                  {n(paidBy[p.key].won)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["왕 1명당 입궐", m("king") ? (m("join") / m("king")).toFixed(1) + "명" : "–"],
          ["친구 → 새 왕", pct(m("own_court"), m("join"))],
          ["방문 → 결제", pct(paidBy.month.n, m("uv"))],
        ].map(([k, v]) => (
          <li key={k} className="rounded-lg bg-white/60 px-1 py-2">
            <p className="text-[10px] text-ink-soft">{k} (이번 달)</p>
            <p className="font-myeongjo font-extrabold">{v}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        방문자는 기기(브라우저) 기준이고, 관리자로 로그인한 브라우저는 세지 않아요. 전체는 이 표를 만든 날부터 세요. 유입 경로(인스타·카톡 등)는
        Vercel 대시보드 Analytics에서 볼 수 있어요.
      </p>
    </section>
  );
}

// Sales per product for one period: shoppers who saw the page, opened the payment window, paid, and the money.
// Payments come from the orders themselves (so they go back to the first sale); views and payment windows are
// counted from when this table was added.
function SalesTable({ period, stats, paid, refunds }: { period: Period; stats: Record<string, Record<Period, number>>; paid: Order[]; refunds: number }) {
  const n = (v: number) => v.toLocaleString("ko-KR");
  const rows = SALE_KEYS.map((key) => {
    const mine = paid.filter((o) => saleKey(o.product, o.set, o.req.y, o.paidAt ?? o.createdAt) === key);
    return {
      key,
      label: saleLabel(key) ?? key,
      view: stats[`view:${key}`]?.[period] ?? 0,
      co: stats[`co:${key}`]?.[period] ?? 0,
      n: mine.length,
      won: mine.reduce((a, o) => a + o.amount, 0),
    };
  })
    .filter((r) => r.view || r.co || r.n)
    .sort((a, b) => b.won - a.won || b.n - a.n || b.view - a.view);
  const total = rows.reduce((a, r) => ({ view: a.view + r.view, co: a.co + r.co, n: a.n + r.n, won: a.won + r.won }), { view: 0, co: 0, n: 0, won: 0 });
  const methods = Object.entries(
    paid.reduce<Record<string, number>>((a, o) => ((a[o.method || "기타"] = (a[o.method || "기타"] ?? 0) + 1), a), {}),
  ).sort((a, b) => b[1] - a[1]);
  const sets = paid.filter((o) => o.set).length;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  return (
    <section className="doc-paper mt-4 px-3 py-4">
      <h2 className="flex items-baseline justify-between px-1 font-myeongjo font-extrabold">
        상품별 매출
        <a href="/admin/orders.csv" className="text-xs font-bold text-seal underline">
          CSV 받기
        </a>
      </h2>
      <nav className="mt-2 flex flex-wrap gap-1.5 px-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/admin?sp=${p.key}`}
            scroll={false}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${p.key === period ? "border-ink bg-ink text-hanji" : "border-ink/20 text-ink-soft"}`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="mt-3 px-1 text-sm text-ink-soft">이 기간에는 아직 기록이 없어요.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-right text-[12px] tabular-nums">
            <thead>
              <tr className="text-ink-soft">
                <th className="py-1 text-left font-normal">상품</th>
                <th className="px-1 font-normal">조회</th>
                <th className="px-1 font-normal">결제창</th>
                <th className="px-1 font-normal">결제</th>
                <th className="px-1 font-normal">전환</th>
                <th className="pl-1 font-normal">매출</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-seal/10">
                  <td className="py-1.5 text-left leading-tight">{r.label}</td>
                  <td className="px-1">{n(r.view)}</td>
                  <td className="px-1">{n(r.co)}</td>
                  <td className="px-1 font-bold">{n(r.n)}</td>
                  <td className="px-1 text-ink-soft">{pct(r.n, r.view)}</td>
                  <td className="pl-1 font-bold">{n(r.won)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-seal/30 font-bold">
                <td className="py-1.5 text-left">합계</td>
                <td className="px-1">{n(total.view)}</td>
                <td className="px-1">{n(total.co)}</td>
                <td className="px-1">{n(total.n)}</td>
                <td className="px-1 text-ink-soft">{pct(total.n, total.view)}</td>
                <td className="pl-1">{n(total.won)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <ul className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["객단가", total.n ? `${n(Math.round(total.won / total.n))}원` : "–"],
          ["세트 비중", pct(sets, total.n)],
          ["환불", `${refunds}건`],
        ].map(([k, v]) => (
          <li key={k} className="rounded-lg bg-white/60 px-1 py-2">
            <p className="text-[10px] text-ink-soft">{k}</p>
            <p className="font-myeongjo font-extrabold">{v}</p>
          </li>
        ))}
      </ul>
      {methods.length > 0 && (
        <p className="mt-2 px-1 text-[11.5px] text-ink-soft">
          결제 수단 · {methods.map(([m, c]) => `${m} ${c}건`).join(" · ")}
        </p>
      )}
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        조회는 결제 전 보고서 화면을 본 수, 결제창은 결제 버튼을 누른 수예요(오늘부터 집계). 결제와 매출은 첫 결제부터 모두 반영돼요. 전환 = 결제 ÷ 조회. 연운은
        지난해·올해·내년으로 나눴고, 내년 연운이 신년운세예요. CSV에는 이름 없이 날짜·상품·금액·결제 수단만 담겨요.
      </p>
    </section>
  );
}
