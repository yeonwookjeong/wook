import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { covers, getOrder, giftOrders, paidOrders, type Order } from "@/lib/pay";
import CopyButton from "@/components/CopyButton";
import { GIFTABLE, originNow } from "@/lib/gift";
import { SALE_KEYS, saleKey, saleLabel } from "@/lib/sales";
import { productById, SETS, type ProductId } from "@/lib/products";
import { lastReportError, listInquiries, memberViews, readingCount } from "@/lib/store";
import { listFeedback } from "@/lib/feedback";
import { memberFixAction } from "./actions";
import { allMembers, memberNo, VIA_LABEL, viaOf, type Member } from "@/lib/members";
import { adminSignOut, creditEventCreateAction, creditEventToggleAction, giftRevokeAction, inquiryDeleteAction, inquiryDoneAction, rewriteReportAction, testOrderAction } from "./actions";
import Dashboard, { rangeOf } from "./Dashboard";
import { threadsPosts } from "@/lib/threads";
import GiftForm from "./GiftForm";
import SignInForm from "./SignInForm";
import { isPreview, newYearOf, thisYear } from "@/lib/yeonun";
import { ASK_FROM, ASK_FROM_LABEL, CH_FROM, CH_FROM_LABEL, inPeriods, PERIODS, readStats, type Period } from "@/lib/stats";
import { SHARE_FROM, STEP_FROM, STEP_LABEL } from "@/lib/nextStep";
import { COLUMNS, publishedColumns, titleLines } from "@/lib/columns";
import { SOURCE_LABEL, SOURCES } from "@/lib/source";
import { DailyTable, SourceTable } from "./Insights";
import { CREDIT_KINDS, ledgerOf, waitingBonus } from "@/lib/creditLedger";
import { closedWhy, listCreditEvents } from "@/lib/creditEvents";

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
  const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
  const ny = newYearOf();
  const inquiries = await listInquiries().catch(() => []);
  const writeError = await lastReportError();
  const writeRisk = await lastReportError("risk");
  const open = inquiries.filter((q) => !q.done);
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
  const stats = await readStats([
    ...["uv", "pv", "reading", "me_try", "me_err", "me_same", "king", "join", "appoint", "share_court", "share_result", "save_image", "own_court", "to_saju", "ask_pop", "to_ask", "to_channel", "sinsal_pop", "sinsal_open", "sinsal_view", "askflow_join", "askflow_sent", "askflow_buy"],
    ...CH_FROM.map((f) => `ch:${f}`),
    ...ASK_FROM.map((f) => `ask:${f}`),
    ...STEP_FROM.map((f) => `to:${f}`),
    ...SHARE_FROM.flatMap((f) => [`sh:${f}`, `sv:${f}`]),
    ...["reading", "sinbun", "sinsal"].map((k) => `sl:${k}`),
    ...SOURCES.map((s) => `src:${s}`),
    ...SALE_KEYS.flatMap((k) => [`view:${k}`, `co:${k}`]),
    ...COLUMNS.map((c) => `cv:${c.slug}`),
  ]);
  // All columns read, the sum of each one's count.
  const readsIn = (p: Period) => COLUMNS.reduce((a, c) => a + (stats[`cv:${c.slug}`]?.[p] ?? 0), 0);
  stats.cv = Object.fromEntries(PERIODS.map(({ key }) => [key, readsIn(key)])) as Record<Period, number>;
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
          SNS 카드 · 콘텐츠 데스크 →
        </Link>
        <Link href="/admin/ask" className="mt-3 ml-2 inline-block rounded-full border-2 border-seal px-5 py-1.5 text-sm font-bold text-seal">
          정 훈도에게 묻기 시험방 →
        </Link>
        <Link href="/admin/threads" className="mt-3 ml-2 inline-block rounded-full border-2 border-seal px-5 py-1.5 text-sm font-bold text-seal">
          스레드 성적표 →
        </Link>
        <Link href="/admin/columns" className="mt-3 ml-2 inline-block rounded-full border-2 border-seal px-5 py-1.5 text-sm font-bold text-seal">
          칼럼 미리보기 →
        </Link>
        <Link href="/admin/free-preview" className="mt-3 ml-2 inline-block rounded-full border-2 border-seal px-5 py-1.5 text-sm font-bold text-seal">
          무료 화면 시안 →
        </Link>
      </section>

      <Dashboard range={rangeOf(q.r)} orders={orders} {...await threadsPosts().then((t) => ({ threads: t.posts, synced: t.synced })).catch(() => ({ threads: [], synced: null }))} />

      {writeError && (
        <section className="mt-4 rounded-xl border-2 border-seal bg-seal/10 px-4 py-3">
          <p className="text-sm font-extrabold text-seal">보고서 쓰기 실패 · {when(writeError.at)}</p>
          <p className="mt-1 text-[12px] leading-relaxed break-all">{writeError.message}</p>
          <p className="mt-1 text-[11px] text-ink-soft">최근 이틀 안의 마지막 실패만 보여요. 고친 뒤 보고서를 다시 열면 새로 써요.</p>
        </section>
      )}
      {writeRisk && (
        <section className="mt-4 rounded-xl border-2 border-seal bg-seal/10 px-4 py-3">
          <p className="text-sm font-extrabold text-seal">보고서 위험 문구 · {when(writeRisk.at)}</p>
          <p className="mt-1 text-[12px] leading-relaxed break-all">{writeRisk.message}</p>
          <p className="mt-1 text-[11px] text-ink-soft">손님에게 이미 보인 글이에요. 최근 이틀 안의 마지막 한 건만 보여요.</p>
        </section>
      )}

      <p className="mt-3 text-center text-[13px]">
        지금까지 풀어 드린 사주 <b className="font-myeongjo text-seal">{(await readingCount()).toLocaleString("ko-KR")}</b>건
        <span className="block text-[11px] text-ink-soft">무료 분석 + 즉위 · 100건부터 홈에 표시돼요</span>
      </p>

      <details className="mt-4">
        <summary className="doc-paper cursor-pointer px-4 py-3 font-myeongjo font-extrabold">
          자세한 표 (왕이 될 사주 · 페이지별 다음 걸음 · 기간별 표)
        </summary>
        <StatsTable stats={stats} paidBy={paidBy} />
        <SourceTable stats={stats} paid={paid} />
        <DailyTable from={df} to={dt} paid={paid} />
      <SalesTable
        period={period}
        stats={stats}
        paid={paid.filter((o) => inPeriods(o.paidAt ?? o.createdAt).includes(period))}
        refunds={orders.filter((o) => o.status === "canceled" && inPeriods(o.paidAt ?? o.createdAt).includes(period)).length}
      />
      </details>

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
                      href={
                        q.email.includes("@")
                          ? `mailto:${q.email}?subject=${encodeURIComponent(`[훈도사주] ${q.topic} 문의 답변`)}`
                          : `sms:${q.email.replace(/-/g, "")}`
                      }
                      className="rounded-full bg-seal px-3 py-1 font-bold text-hanji"
                    >
                      {q.email.includes("@") ? "답장하기" : "문자 보내기"} · {q.email}
                    </a>
                  ) : (
                    <span className="text-ink-soft">연락처 없음</span>
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

      <CreditsSection period={period} orders={orders} origin={origin} />

      <MembersSection find={typeof q.mq === "string" ? q.mq : ""} orders={orders} />

      <FeedbackSection />

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="font-myeongjo font-extrabold">최근 결제</h2>
        <p className="mt-0.5 text-[11px] text-ink-soft">
          내가 해 본 결제는 &lsquo;테스트?&rsquo;를 눌러 표시해 두면 위 통계에서 빠져요. 관리자로 로그인한 채 한 결제는 저절로 테스트로 남아요.
        </p>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">아직 결제가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-seal/10 text-[13px]">
            {orders.slice(0, 100).map((o) => (
              <li key={o.id} className="flex items-center gap-2 py-2">
                <span className="w-20 shrink-0 text-[11px] text-ink-soft">{day(o.paidAt ?? o.createdAt).slice(5)}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{o.set ? SETS[o.set].title : productById(o.product)?.title}</b>
                  <span className="block truncate text-[11px] text-ink-soft">
                    {o.who}
                    {(o.bonus ?? 0) > 0 && ` · 질문 ${o.bonus} ${o.bonusGiven ? "지급됨" : "로그인 대기"}`}
                    {(o.credits ?? 0) > 0 && ` · 질문권 ${o.credits}${o.credited === false ? " 미지급" : ""}`}
                  </span>
                </span>
                <span className={`shrink-0 font-bold ${o.status === "paid" && !o.test ? "" : "text-ink-soft line-through"}`}>{won(o.amount)}</span>
                <form action={testOrderAction} className="shrink-0">
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="test" value={o.test ? "0" : "1"} />
                  <button className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${o.test ? "bg-ink/70 text-hanji" : "border border-ink/20 text-ink-soft"}`}>
                    {o.test ? "테스트" : "테스트?"}
                  </button>
                </form>
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
  { key: "ask_pop", label: "오픈 안내 팝업이 뜬 수 (10/23 신살 도감 팝업으로 교체)", group: "정 훈도에게 묻기" },
  { key: "to_ask", label: "묻기로 이동 (전체)" },
  ...ASK_FROM.map((f) => ({ key: `ask:${f}`, label: `　└ ${ASK_FROM_LABEL[f]}` })),
  // 2026-10-25: from a chapter's button on, one step after another (counted once each per visit, in this browser).
  { key: "askflow_join", label: "　　보고서 장 → 새로 가입" },
  { key: "askflow_sent", label: "　　보고서 장 → 질문 보냄" },
  { key: "askflow_buy", label: "　　보고서 장 → 질문 채움(결제)" },
  { key: "to_channel", label: "카카오톡 채널 추가 누름 (전체)", group: "카카오톡 채널" },
  ...CH_FROM.map((f) => ({ key: `ch:${f}`, label: `　└ ${CH_FROM_LABEL[f]}` })),
  { key: "sl:reading", label: "친구가 보낸 링크로 도착: 무료 사주 분석" },
  { key: "sl:sinbun", label: "친구가 보낸 링크로 도착: 조선 신분 감정" },
  { key: "sl:sinsal", label: "친구가 보낸 링크로 도착: 신살 도감" },
  { key: "sinsal_pop", label: "신살 도감 팝업이 뜬 수", group: "신살 도감" },
  { key: "sinsal_open", label: "신살 도감: 생일 넣기 전 첫 화면" },
  { key: "sinsal_view", label: "신살 도감: 결과(내 카드) 본 수" },
  { key: "reading", label: "무료 사주 분석" },
  { key: "me_try", label: "　└ 생일 입력 보냄 (전체)" },
  { key: "me_err", label: "　└ 입력 오류로 되돌아감" },
  { key: "me_same", label: "　└ 이미 본 사주를 다시 넣음" },
];

// 훈도의 사주 이야기: reads of every column and of each one open now (newest first); its button on to the
// free reading is the `to:column` row above.
function columnRows(): { key: string; label: string; group?: string }[] {
  return [
    { key: "cv", label: "글 조회 (전체)", group: "사주 이야기 (칼럼)" },
    ...publishedColumns().map((c) => ({ key: `cv:${c.slug}`, label: `　└ ${titleLines(c.title)[0]}` })),
  ];
}

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
            {[...ROWS, ...columnRows()].map((r) => (
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
  // Where the sets were bought: the report page the buyer was on.
  const setFrom = Object.entries(
    paid.filter((o) => o.set).reduce<Record<string, number>>((a, o) => {
      const k = o.from ? (productById(o.from)?.title ?? o.from) : "기록 전";
      return (a[k] = (a[k] ?? 0) + 1), a;
    }, {}),
  ).sort((a, b) => (a[0] === "기록 전" ? 1 : b[0] === "기록 전" ? -1 : b[1] - a[1]));
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
      {setFrom.length > 0 && (
        <p className="mt-1 px-1 text-[11.5px] text-ink-soft">세트를 산 화면 · {setFrom.map(([k, c]) => `${k} ${c}건`).join(" · ")}</p>
      )}
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        조회는 결제 전 보고서 화면을 본 수, 결제창은 결제 버튼을 누른 수예요(오늘부터 집계). 결제와 매출은 첫 결제부터 모두 반영돼요. 전환 = 결제 ÷ 조회. 연운은
        지난해·올해·내년으로 나눴고, 내년 연운이 신년운세예요. CSV에는 이름 없이 날짜·상품·금액·결제 수단만 담겨요.
      </p>
    </section>
  );
}

// Members: how many, the questions they hold, a search (회원 번호, 별명, 이메일) with the one found in full, and a
// fix for one (an order onto their account, questions).
async function MembersSection({ find, orders }: { find: string; orders: Order[] }) {
  const members = await allMembers().catch(() => []);
  // What each member paid for (not the owner's tests, not refunded), from the orders on their account.
  const byId = new Map(orders.map((o) => [o.id, o]));
  const bought = (m: Member) => m.orders.flatMap((id) => byId.get(id) ?? []).filter((o) => o.status === "paid" && !o.test && !o.gift);
  const spent = (m: Member) => bought(m).reduce((a, o) => a + o.amount, 0);
  const payers = members.filter((m) => bought(m).length > 0);
  const tally = (vals: string[]) =>
    Object.entries(vals.reduce<Record<string, number>>((a, v) => ((a[v] = (a[v] ?? 0) + 1), a), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ");
  const srcShort = (m: Member) => (m.src ? SOURCE_LABEL[m.src].split(" ")[0] : "");
  const held = members.reduce((a, m) => a + m.credits, 0);
  const byVia = (["kakao", "naver", "google"] as const).map((v) => `${VIA_LABEL[v]} ${members.filter((m) => viaOf(m.id) === v).length}`).join(" · ");
  // "K-123456" as the member reads it out, or any part of the id, nickname or email.
  const needle = find.trim().toLowerCase().replace(/^([kng])-/, "$1");
  // ":channel": the members who added the KakaoTalk channel (and had its question).
  const found =
    needle === ":channel"
      ? [...members].reverse().filter((m) => m.channel)
      : needle
    ? members.filter((m) => {
        const no = memberNo(m.id).toLowerCase().replace("-", "");
        return no === needle || m.id.toLowerCase().includes(needle) || m.nick.toLowerCase().includes(needle) || (m.email ?? "").toLowerCase().includes(needle);
      })
    : [...members].reverse();
  const one = needle && needle !== ":channel" && found.length === 1 ? found[0] : null;
  const day = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 16).replace("T", " ");
  return (
    <section id="members" className="doc-paper mt-4 scroll-mt-4 px-4 py-4">
      <h2 className="flex items-baseline justify-between font-myeongjo font-extrabold">
        회원
        <span className="text-sm text-ink-soft">
          {members.length}명 · 남은 질문 합 {held}개
        </span>
      </h2>
      <p className="mt-0.5 text-[11px] text-ink-soft">
        {byVia} · 채널 추가 {members.filter((m) => m.channel).length}명 (
        <a href="/admin?mq=%3Achannel#members" className="underline">
          명단
        </a>
        ) · 소식 받기 동의 {members.filter((m) => m.news?.on).length}명 (이메일 있음 {members.filter((m) => m.news?.on && m.email).length})
      </p>
      <dl className="mt-1.5 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 rounded-lg bg-white/40 px-2.5 py-2 text-[11.5px]">
        <dt className="font-bold">결제</dt>
        <dd>
          결제한 회원 {payers.length}명 · 두 번 이상 {payers.filter((m) => bought(m).length > 1).length}명 · 회원 결제 합{" "}
          {payers.reduce((a, m) => a + spent(m), 0).toLocaleString("ko-KR")}원
        </dd>
        <dt className="font-bold">들어온 길</dt>
        <dd>{tally(members.map((m) => (m.src ? SOURCE_LABEL[m.src] : "기록 전")))}</dd>
        <dt className="font-bold">성별</dt>
        <dd>{tally(members.map((m) => (m.gender === "m" ? "남" : m.gender === "f" ? "여" : "모름")))}</dd>
        <dt className="font-bold">연령대</dt>
        <dd>{tally(members.map((m) => m.age ?? "모름"))}</dd>
      </dl>
      <form action="/admin#members" className="mt-2 flex gap-1.5 text-[12px]">
        <input name="mq" defaultValue={find} placeholder="회원 번호(K-123456) · 별명 · 이메일" className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5" />
        <button className="shrink-0 rounded-full bg-ink px-3 font-bold text-hanji">찾기</button>
        {find && (
          <a href="/admin#members" className="shrink-0 self-center text-ink-soft underline">
            전체
          </a>
        )}
      </form>
      {needle && <p className="mt-1 text-[11px] text-ink-soft">{found.length}명 찾음</p>}
      {one ? (
        <div className="mt-2 rounded-xl border border-seal/20 bg-white/50 px-3 py-2.5 text-[12px] leading-relaxed">
          <p>
            <b className="text-[14px]">{one.nick}</b> · {VIA_LABEL[viaOf(one.id)]} · {memberNo(one.id)} · 가입 {day(one.createdAt)}
          </p>
          <p className="text-ink-soft">
            {one.email ?? "이메일 없음"} · <span className="font-mono text-[10.5px]">{one.id}</span>
          </p>
          <p className="mt-1">
            남은 질문 <b>{one.credits}</b> · 사랑방 {one.rooms.length} · 가입 선물 {one.gift ? "받음" : "없음"} · 채널 {one.channel ? "추가 ✔" : "아직"} · 소식 {one.news ? `${one.news.on ? "동의" : "거부"} ${day(one.news.at)}` : "묻기 전"}
          </p>
          <p className="mt-1">
            들어온 길 <b>{one.src ? SOURCE_LABEL[one.src] : "기록 전"}</b> · {one.gender === "m" ? "남" : one.gender === "f" ? "여" : "성별 모름"} · {one.age ?? "연령대 모름"}
          </p>
          <p className="mt-1">
            결제 <b>{bought(one).length}회 · {spent(one).toLocaleString("ko-KR")}원</b>
            {bought(one).length > 0 && ` (${bought(one).map((o) => saleLabel(saleKey(o.product, o.set, o.req.y, o.paidAt ?? o.createdAt)) ?? o.product).join(", ")})`}
          </p>
          <Interest id={one.id} />
          <p className="mt-1 font-bold">질문권 내역</p>
          <ul className="text-[11.5px]">
            {[...one.log].reverse().slice(0, 20).map((l, i) => (
              <li key={i}>
                {day(l.at)} · {l.d > 0 ? `+${l.d}` : l.d} · {l.why}
              </li>
            ))}
          </ul>
          <p className="mt-1 font-bold">주문 ({one.orders.length})</p>
          <p className="font-mono text-[10.5px] break-all text-ink-soft">{one.orders.join(" · ") || "없음"}</p>
        </div>
      ) : (
        found.length > 0 && (
          <ul className="mt-2 flex max-h-60 flex-col divide-y divide-seal/10 overflow-y-auto text-[12px]">
            {found.slice(0, 100).map((m) => (
              <li key={m.id}>
                <a href={`/admin?mq=${encodeURIComponent(m.id)}#members`} className="flex items-center gap-2 py-1.5">
                  <span className="w-12 shrink-0 text-ink-soft">{day(m.createdAt).slice(5, 10)}</span>
                  <b className="min-w-0 flex-1 truncate">
                    {m.nick}
                    {m.channel && <span className="ml-1 text-[10px] text-[#9a7424]">채널</span>}
                  </b>
                  <span className="shrink-0 text-ink-soft">
                    {srcShort(m) && `${srcShort(m)} · `}
                    {spent(m) > 0 ? `${spent(m).toLocaleString("ko-KR")}원` : "결제 0"} · 질문 {m.credits} · 방 {m.rooms.length}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-soft">{memberNo(m.id)}</span>
                </a>
              </li>
            ))}
          </ul>
        )
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] font-bold">문의 처리: 주문을 회원에게 붙이기 · 질문 넣고 빼기</summary>
        <form action={memberFixAction} className="mt-2 grid grid-cols-2 gap-1.5 text-[12px]">
          <input name="member" defaultValue={one?.id ?? ""} placeholder="회원 id (위 찾기 결과의 k·n·g로 시작하는 값)" className="col-span-2 rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5" />
          <input name="order" placeholder="주문번호 (선택)" className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5" />
          <input name="credits" type="number" placeholder="질문 +/- (선택)" className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5" />
          <button className="col-span-2 rounded-full bg-ink py-1.5 font-bold text-hanji">적용</button>
        </form>
      </details>
    </section>
  );
}

// What one member looked at most among the paid reports' pages (counted only while signed in).
async function Interest({ id }: { id: string }) {
  const counts = await memberViews(id, SALE_KEYS).catch(() => []);
  const top = SALE_KEYS.map((k, i) => [k, counts[i] ?? 0] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return (
    <p className="mt-1">
      관심 (본 보고서 화면) {top.length ? top.map(([k, n]) => `${saleLabel(k) ?? k} ${n}`).join(" · ") : "아직 없음"}
    </p>
  );
}

// How the bought reports were liked (components/ReportFeedback.tsx), newest first; a review only with its tick.
async function FeedbackSection() {
  const list = await listFeedback().catch(() => []);
  const up = list.filter((f) => f.up).length;
  return (
    <section className="doc-paper mt-4 px-4 py-4">
      <h2 className="flex items-baseline justify-between font-myeongjo font-extrabold">
        보고서 만족도
        <span className="text-sm text-ink-soft">
          👍 {up} · 👎 {list.length - up} · 후기 동의 {list.filter((f) => f.share).length}
        </span>
      </h2>
      <p className="mt-0.5 text-[11px] text-ink-soft">결제한 보고서 맨 아래에서 받아요. 후기로 쓸 수 있는 건 &lsquo;후기 동의&rsquo; 표시가 있는 것만이에요 (이름 없이).</p>
      {list.length === 0 ? (
        <p className="mt-2 text-[12px] text-ink-soft">아직 없어요.</p>
      ) : (
        <ul className="mt-2 flex max-h-72 flex-col divide-y divide-seal/10 overflow-y-auto text-[12px]">
          {list.map((f) => (
            <li key={`${f.order}:${f.product}`} className="py-1.5">
              <span className="text-ink-soft">{day(f.at).slice(5)}</span> {f.up ? "👍" : "👎"} <b>{productById(f.product)?.title ?? f.product}</b>
              {f.share && <span className="ml-1 rounded bg-gold/20 px-1 text-[10.5px] font-bold">후기 동의</span>}
              {f.member && <span className="ml-1 font-mono text-[10px] text-ink-soft">{memberNo(f.member)}</span>}
              {f.text && <span className="block text-ink-soft">{f.text}</span>}
              {!f.up && <RewriteBox order={f.order} product={f.product} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Under a 👎: have the report written again under today's reading (same link for the buyer), and say when it was.
async function RewriteBox({ order, product }: { order: string; product: ProductId }) {
  const o = await getOrder(order).catch(() => null);
  // Only a paid order that holds this report can have it written again (lib/pay.ts rewriteReport).
  if (!o || o.status !== "paid" || !covers(o, product)) return null;
  const at = o.rewritten?.[product];
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
  return (
    <form action={rewriteReportAction} className="mt-1 flex items-center gap-2 text-[11px]">
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="product" value={product} />
      {at && <span className="text-ink-soft">다시 씀 {when(at)}{o.texts?.[product] ? " · 새 글 열림" : " · 아직 안 열림"}</span>}
      <label className="flex items-center gap-1 text-ink-soft">
        <input type="checkbox" name="sure" value="1" /> 확인
      </label>
      <button className="rounded-full border border-seal/40 px-2 py-0.5 font-bold text-seal">새 기준으로 다시 쓰기</button>
      <Link href={`/reports/${product}?order=${order}`} className="text-seal underline">
        열기
      </Link>
    </form>
  );
}

// 질문권: what was given and used in a period, by where it came from (lib/creditLedger.ts), the questions still
// waiting for a buyer to sign in, and the events that give questions away by a link (lib/creditEvents.ts).
const CLOSED_LABEL = { none: "없음", off: "멈춤", ended: "기간 끝", full: "마감" } as const;
async function CreditsSection({ period, orders, origin }: { period: Period; orders: Order[]; origin: string }) {
  const [members, events] = await Promise.all([allMembers().catch(() => []), listCreditEvents().catch(() => [])]);
  const ledger = ledgerOf(members, period);
  const given = CREDIT_KINDS.filter((k) => k.give).reduce((a, k) => a + Math.max(0, ledger[k.key].credits), 0);
  const used = -ledger.use.credits;
  const held = members.reduce((a, m) => a + m.credits, 0);
  const sold = orders.filter((o) => o.status === "paid" && !o.test && o.product === "jilmun" && inPeriods(o.paidAt ?? o.createdAt).includes(period));
  const waiting = waitingBonus(orders);
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
  return (
    <section id="credits" className="doc-paper mt-4 px-4 py-4">
      <h2 className="flex items-baseline justify-between font-myeongjo font-extrabold">
        질문권
        <span className="text-sm text-ink-soft">회원이 가진 질문 {held}개</span>
      </h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <a
            key={p.key}
            href={`/admin?sp=${p.key}#credits`}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${p.key === period ? "border-ink bg-ink text-hanji" : "border-ink/20 text-ink-soft"}`}
          >
            {p.label}
          </a>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["나간 질문", given],
          ["쓴 질문", used],
          ["질문권 매출", `${sold.reduce((a, o) => a + o.amount, 0).toLocaleString("ko-KR")}원`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white/50 px-2 py-2">
            <p className="text-[11px] text-ink-soft">{k}</p>
            <b className="font-myeongjo text-[17px]">{v}</b>
          </div>
        ))}
      </div>
      <table className="mt-3 w-full text-[12.5px]">
        <thead className="text-[11px] text-ink-soft">
          <tr>
            <th className="text-left font-normal">어디서</th>
            <th className="text-right font-normal">건</th>
            <th className="text-right font-normal">질문</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-seal/10">
          {CREDIT_KINDS.map((k) => (
            <tr key={k.key} className={k.give ? "" : "text-ink-soft"}>
              <td className="py-1">{k.label}</td>
              <td className="py-1 text-right tabular-nums">{ledger[k.key].times}</td>
              <td className="py-1 text-right tabular-nums">{ledger[k.key].credits > 0 ? `+${ledger[k.key].credits}` : ledger[k.key].credits}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {waiting.length > 0 && (
        <div className="mt-3 rounded-lg border border-seal/40 bg-seal/5 px-3 py-2 text-[12px]">
          <b className="text-seal">로그인 대기 {waiting.length}건 · 질문 {waiting.reduce((a, o) => a + (o.bonus ?? 0), 0)}개</b>
          <p className="text-[11px] text-ink-soft">로그인 없이 산 손님이에요. 같은 브라우저에서 로그인하면 들어가요. 다른 기기로 문의하면 아래 회원 칸에서 주문을 붙이고 질문을 넣어 주세요.</p>
          <ul className="mt-1">
            {waiting.slice(0, 20).map((o) => (
              <li key={o.id} className="font-mono text-[11px]">
                {when(o.paidAt ?? o.createdAt)} · 질문 {o.bonus} · {o.id}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="mt-5 font-myeongjo font-extrabold">이벤트로 질문 주기</h3>
      <p className="mt-0.5 text-[11px] text-ink-soft">링크를 연 카카오 회원에게 한 번씩 질문을 넣어 드려요. 인원이 차거나 기간이 끝나면 저절로 닫혀요.</p>
      <form action={creditEventCreateAction} className="mt-2 grid grid-cols-3 gap-1.5 text-[12px]">
        <input name="name" required placeholder="이벤트 이름 (예: 스레드 댓글 이벤트)" className="col-span-3 rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5" />
        <label className="flex flex-col text-[10.5px] text-ink-soft">
          질문 수
          <input name="credits" type="number" min={1} max={5} defaultValue={1} className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5 text-[12px] text-ink" />
        </label>
        <label className="flex flex-col text-[10.5px] text-ink-soft">
          선착순 인원
          <input name="max" type="number" min={1} max={10000} defaultValue={30} className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5 text-[12px] text-ink" />
        </label>
        <label className="flex flex-col text-[10.5px] text-ink-soft">
          기간(일)
          <input name="days" type="number" min={1} max={365} defaultValue={7} className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1.5 text-[12px] text-ink" />
        </label>
        <button className="col-span-3 rounded-full bg-ink py-1.5 font-bold text-hanji">이벤트 링크 만들기</button>
      </form>
      {events.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-seal/10 text-[12px]">
          {events.map((e) => {
            const closed = closedWhy(e, e.taken);
            const link = `${origin}/e/${e.code}`;
            return (
              <li key={e.code} className="py-2">
                <div className="flex items-center gap-2">
                  <b className="min-w-0 flex-1 truncate">{e.name}</b>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${closed ? "bg-ink/10 text-ink-soft" : "bg-seal text-white"}`}>
                    {closed ? CLOSED_LABEL[closed] : "진행 중"}
                  </span>
                  <form action={creditEventToggleAction} className="shrink-0">
                    <input type="hidden" name="code" value={e.code} />
                    <input type="hidden" name="on" value={e.on ? "0" : "1"} />
                    <button className="rounded-full border border-ink/20 px-2 py-0.5 text-[10.5px] text-ink-soft">{e.on ? "멈추기" : "다시 열기"}</button>
                  </form>
                </div>
                <p className="text-[11px] text-ink-soft">
                  질문 {e.credits}개 · {e.taken}/{e.max}명 받음 · {when(e.until)}까지
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{link}</span>
                  <CopyButton text={link} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
