import Link from "next/link";
import type { Order } from "@/lib/pay";
import { SALE_KEYS, saleKey, saleLabel } from "@/lib/sales";
import { SOURCE_LABEL, SOURCES, type Source } from "@/lib/source";
import { daysBetween, readDays, readStats } from "@/lib/stats";
import type { ThreadsPost } from "@/lib/threads";

// The owner's one-screen look back (/admin, top): one span of days for everything, the leak from a visit to a
// payment, where the buyers came from (with the Threads views behind them), which reports sell, and the days.
// Built from the raw counters (lib/stats.ts, per Korean day) and the paid orders; test payments are left out.

// The day the site opened (추석, 2026-09-25). Visits are counted from 9/29, the roads from 10/1.
export const LAUNCH = "2026-09-25";
const COUNTED_FROM = "2026-09-29";
const KST = 9 * 3600000;
const kday = (t: number) => new Date(t + KST).toISOString().slice(0, 10);
// Today in Korea, read per request (the page is dynamic: it reads the admin cookie).
const todayKst = () => kday(Date.now());
const shift = (d: string, k: number) => kday(Date.parse(`${d}T12:00:00+09:00`) + k * 86400000);

export const RANGES = [
  { key: "today", label: "오늘", days: 1 },
  { key: "7", label: "7일", days: 7 },
  { key: "30", label: "30일", days: 30 },
  { key: "all", label: "전체", days: 0 },
] as const;
export type RangeKey = (typeof RANGES)[number]["key"];
export const rangeOf = (v: unknown): RangeKey => (RANGES.some((r) => r.key === v) ? (v as RangeKey) : "7");

const n = (v: number) => Math.round(v).toLocaleString("ko-KR");
const won = (v: number) => `${n(v)}원`;
const man = (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}만` : n(v));
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const pctText = (a: number, b: number, digits = 0) => (b > 0 ? `${pct(a, b).toFixed(digits)}%` : "–");

type Road = Source | "none";
const ROAD_LABEL = (s: Road) => (s === "none" ? "기록 전" : SOURCE_LABEL[s]);

export default async function Dashboard({ range, orders, threads }: { range: RangeKey; orders: Order[]; threads: ThreadsPost[] }) {
  const today = todayKst();
  const span = RANGES.find((r) => r.key === range)!;
  const from = span.days ? shift(today, -(span.days - 1)) : LAUNCH;
  const days = daysBetween(from, today);
  // The same number of days just before, to compare with (none for 전체).
  const prevDays = span.days ? daysBetween(shift(from, -span.days), shift(from, -1)) : [];

  const events = ["uv", "pv", "reading", ...SOURCES.map((s) => `src:${s}`), ...SALE_KEYS.flatMap((k) => [`view:${k}`, `co:${k}`])];
  const [cur, prev, ever] = await Promise.all([
    readDays(events, days),
    prevDays.length ? readDays(["uv", "reading"], prevDays) : Promise.resolve({} as Record<string, number[]>),
    range === "all" ? readStats(["uv"]) : Promise.resolve(null),
  ]);
  const sum = (e: string, src = cur) => (src[e] ?? []).reduce((a, v) => a + v, 0);

  // Orders: paid ones in the span, test payments apart (lib/pay.ts Order.test).
  const inSpan = (o: Order, list: string[]) => list.includes(kday(o.paidAt ?? o.createdAt));
  const real = orders.filter((o) => !o.test);
  const paid = real.filter((o) => o.status === "paid" && inSpan(o, days));
  const refunds = real.filter((o) => o.status === "canceled" && inSpan(o, days)).length;
  const tests = orders.filter((o) => o.test && inSpan(o, days)).length;
  const prevPaid = real.filter((o) => o.status === "paid" && inSpan(o, prevDays));
  const revenue = paid.reduce((a, o) => a + o.amount, 0);
  const prevRevenue = prevPaid.reduce((a, o) => a + o.amount, 0);

  // Distinct visitors for 전체; for a span of days, each day's visitors added up (one who came twice counts twice).
  const visitors = ever ? ever.uv.all : sum("uv");
  const readings = sum("reading");
  const windows = SALE_KEYS.reduce((a, k) => a + sum(`co:${k}`), 0);

  // Threads: the views of the posts put up in the span (as counted now).
  const posts = threads.filter((p) => days.includes(kday(p.ts)));
  const threadViews = posts.reduce((a, p) => a + (p.latest?.views ?? 0), 0);

  // Roads: new visitors on each, and the buyers who first came by it.
  const roads = ([...SOURCES, "none"] as Road[])
    .map((s) => {
      const mine = paid.filter((o) => (o.src ?? "none") === s);
      const v = s === "none" ? 0 : sum(`src:${s}`);
      const w = mine.reduce((a, o) => a + o.amount, 0);
      return { s, visitors: v, n: mine.length, won: w };
    })
    .filter((r) => r.visitors > 0 || r.n > 0)
    .sort((a, b) => b.won - a.won);

  // Reports: shoppers on the page, payment windows opened, paid.
  const products = SALE_KEYS.map((k) => {
    const mine = paid.filter((o) => saleKey(o.product, o.set, o.req.y, o.paidAt ?? o.createdAt) === k);
    return { k, label: saleLabel(k) ?? k, views: sum(`view:${k}`), windows: sum(`co:${k}`), n: mine.length, won: mine.reduce((a, o) => a + o.amount, 0) };
  })
    .filter((p) => p.views > 0 || p.n > 0)
    .sort((a, b) => b.won - a.won);

  // Day by day, newest first.
  const daily = days
    .map((d, i) => {
      const mine = paid.filter((o) => kday(o.paidAt ?? o.createdAt) === d);
      return {
        d,
        uv: cur.uv?.[i] ?? 0,
        reading: cur.reading?.[i] ?? 0,
        n: mine.length,
        won: mine.reduce((a, o) => a + o.amount, 0),
        th: threads.filter((p) => kday(p.ts) === d).reduce((a, p) => a + (p.latest?.views ?? 0), 0),
      };
    })
    .reverse();
  const maxUv = Math.max(1, ...daily.map((r) => r.uv));
  const maxN = Math.max(1, ...daily.map((r) => r.n));

  // What the numbers say, by fixed rules (no AI): the biggest drop, the roads and reports that stand out.
  const notes: string[] = [];
  const steps = [
    { label: "방문 → 무료 분석", a: readings, b: visitors },
    { label: "무료 분석 → 결제창", a: windows, b: readings },
    { label: "결제창 → 결제", a: paid.filter((o) => kday(o.paidAt ?? o.createdAt) >= COUNTED_FROM).length, b: windows },
  ].filter((s) => s.b > 0);
  const worst = steps.sort((x, y) => pct(x.a, x.b) - pct(y.a, y.b))[0];
  if (worst) notes.push(`가장 많이 새는 곳: ${worst.label} (${pctText(worst.a, worst.b)}만 넘어감)`);
  const th = roads.find((r) => r.s === "threads");
  if (threadViews > 0 && th) notes.push(`스레드 조회 ${man(threadViews)} → 사이트 ${n(th.visitors)}명 (${pctText(th.visitors, threadViews, 2)})`);
  const rated = roads.filter((r) => r.s !== "none" && r.visitors >= 20);
  if (rated.length > 1) {
    const best = [...rated].sort((a, b) => b.n / b.visitors - a.n / a.visitors)[0];
    notes.push(`결제율이 가장 높은 길: ${ROAD_LABEL(best.s)} ${pctText(best.n, best.visitors)}`);
  }
  const weak = products.filter((p) => p.views >= 100 && pct(p.n, p.views) < 3).map((p) => p.label);
  if (weak.length) notes.push(`많이 보고 안 사는 보고서: ${weak.join(", ")}`);
  if (prevDays.length && prevPaid.length + prevRevenue > 0)
    notes.push(`앞선 ${span.days}일보다 결제 ${delta(paid.length, prevPaid.length)}, 매출 ${delta(revenue, prevRevenue)}`);

  const kpis = [
    { k: "방문자", v: n(visitors), d: prevDays.length ? delta(visitors, sum("uv", prev)) : null },
    { k: "무료 분석", v: n(readings), d: prevDays.length ? delta(readings, sum("reading", prev)) : null },
    { k: "결제", v: `${n(paid.length)}건`, d: prevDays.length ? delta(paid.length, prevPaid.length) : null },
    { k: "매출", v: won(revenue), d: prevDays.length ? delta(revenue, prevRevenue) : null },
  ];
  // The steps only over the days they were all counted (payments began four days before the counters).
  const counted = paid.filter((o) => kday(o.paidAt ?? o.createdAt) >= COUNTED_FROM).length;
  const funnel = [
    { k: "방문", v: visitors },
    { k: "무료 분석", v: readings },
    { k: "결제창", v: windows },
    { k: "결제", v: counted },
  ];

  return (
    <section className="mt-5">
      <nav className="flex gap-1.5" aria-label="기간">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin?r=${r.key}`}
            className={`flex-1 rounded-full py-1.5 text-center text-[13px] font-bold ${r.key === range ? "bg-seal text-hanji" : "border border-seal/40 text-seal"}`}
          >
            {r.label}
          </Link>
        ))}
      </nav>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft">
        {from.slice(5).replace("-", "/")} ~ {today.slice(5).replace("-", "/")}
        {tests > 0 && ` · 테스트 결제 ${tests}건 뺌`}
        {refunds > 0 && ` · 환불 ${refunds}건`}
      </p>

      {/* ① 핵심 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {kpis.map((x) => (
          <div key={x.k} className="doc-paper px-3 py-3 text-center">
            <p className="text-[11px] text-ink-soft">{x.k}</p>
            <p className="mt-0.5 font-myeongjo text-lg font-extrabold tabular-nums">{x.v}</p>
            {x.d && <p className={`text-[11px] font-bold ${x.d.startsWith("▲") ? "text-seal" : "text-ink-soft"}`}>{x.d}</p>}
          </div>
        ))}
      </div>

      {/* 한 줄 진단 */}
      {notes.length > 0 && (
        <div className="doc-paper mt-3 px-4 py-3">
          <h2 className="font-myeongjo text-[15px] font-extrabold">이 기간 한눈에</h2>
          <ul className="mt-1.5 flex flex-col gap-1 text-[13px] leading-relaxed">
            {notes.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ② 새는 곳 */}
      <div className="doc-paper mt-3 px-4 py-4">
        <h2 className="font-myeongjo text-[15px] font-extrabold">방문에서 결제까지</h2>
        <ol className="mt-2 flex flex-col gap-1.5">
          {funnel.map((f, i) => (
            <li key={f.k} className="text-[12px]">
              <span className="flex justify-between">
                <b>{f.k}</b>
                <span className="tabular-nums">
                  {n(f.v)}
                  {i > 0 && <span className="ml-1.5 text-ink-soft">앞 단계의 {pctText(f.v, funnel[i - 1].v)}</span>}
                </span>
              </span>
              <span className="mt-0.5 block h-2 rounded-full bg-ink/5">
                <span className="block h-full rounded-full bg-seal" style={{ width: `${Math.max(1.5, pct(f.v, visitors))}%` }} />
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[10.5px] leading-relaxed text-ink-soft">
          결제창은 결제 버튼을 누른 수, 결제는 실제로 낸 수예요. 이 흐름은 다 같이 세기 시작한 9/29부터예요.
        </p>
      </div>

      {/* ③ 들어온 길 */}
      <div className="doc-paper mt-3 px-4 py-4">
        <h2 className="font-myeongjo text-[15px] font-extrabold">들어온 길</h2>
        <table className="mt-2 w-full text-right text-[12px] tabular-nums">
          <thead className="text-[10.5px] text-ink-soft">
            <tr>
              <th className="py-1 text-left font-normal">길</th>
              <th className="font-normal">새 방문</th>
              <th className="font-normal">결제</th>
              <th className="font-normal">결제율</th>
              <th className="font-normal">1명당</th>
            </tr>
          </thead>
          <tbody>
            {roads.map((r) => (
              <tr key={r.s} className="border-t border-seal/10">
                <td className="py-1.5 text-left">
                  <b>{ROAD_LABEL(r.s)}</b>
                  {r.s === "threads" && threadViews > 0 && (
                    <span className="block text-[10.5px] text-ink-soft">
                      조회 {man(threadViews)} → {pctText(r.visitors, threadViews, 2)}
                    </span>
                  )}
                </td>
                <td>{r.s === "none" ? "–" : n(r.visitors)}</td>
                <td>
                  {n(r.n)}
                  <span className="block text-[10.5px] text-ink-soft">{man(r.won)}</span>
                </td>
                <td className="font-bold">{r.s === "none" ? "–" : pctText(r.n, r.visitors)}</td>
                <td>{r.s === "none" || !r.visitors ? "–" : `${n(r.won / r.visitors)}원`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10.5px] leading-relaxed text-ink-soft">
          새 방문은 그 길로 처음 온 브라우저(10/1부터), 결제는 처음 온 길 기준이에요. 스레드 조회는 이 기간에 올린 글의 지금 조회수예요.
        </p>
      </div>

      {/* ④ 보고서 */}
      <div className="doc-paper mt-3 px-4 py-4">
        <h2 className="font-myeongjo text-[15px] font-extrabold">보고서별</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {products.map((p) => {
            const rate = p.views ? pct(p.n, p.views) : null;
            return (
              <li key={p.k} className="text-[12px]">
                <span className="flex items-baseline justify-between gap-2">
                  <b className="truncate">{p.label}</b>
                  <span className="shrink-0 tabular-nums">
                    {n(p.n)}건 · {won(p.won)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[10.5px] text-ink-soft">
                  <span className="h-1.5 flex-1 rounded-full bg-ink/5">
                    <span className={`block h-full rounded-full ${rate !== null && rate < 3 && p.views >= 100 ? "bg-ink/40" : "bg-gold"}`} style={{ width: `${Math.min(100, (rate ?? 0) * 4)}%` }} />
                  </span>
                  <span className="w-36 shrink-0 text-right tabular-nums">
                    조회 {n(p.views)} · 결제창 {n(p.windows)} · {rate === null ? "세트" : `${rate.toFixed(0)}%`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10.5px] text-ink-soft">비율은 보고서 화면을 본 수 대비 결제예요. 세트는 따로 보는 화면이 없어요.</p>
      </div>

      {/* ⑤ 날짜별 */}
      <div className="doc-paper mt-3 px-4 py-4">
        <h2 className="font-myeongjo text-[15px] font-extrabold">날짜별</h2>
        <ul className="mt-2 flex flex-col">
          {daily.map((r) => (
            <li key={r.d} className="grid grid-cols-[2.6rem_1fr_1fr] items-center gap-2 border-t border-seal/10 py-1.5 text-[11.5px] tabular-nums first:border-t-0">
              <span className="font-bold">{r.d.slice(5).replace("-", "/")}</span>
              <span>
                <span className="block h-1.5 rounded-full bg-ink/40" style={{ width: `${pct(r.uv, maxUv)}%` }} />
                <span className="text-ink-soft">
                  방문 {n(r.uv)} · 분석 {n(r.reading)}
                  {r.th > 0 && ` · 스레드 ${man(r.th)}`}
                </span>
              </span>
              <span>
                <span className="block h-1.5 rounded-full bg-seal" style={{ width: `${pct(r.n, maxN)}%` }} />
                <span className="text-ink-soft">
                  결제 {n(r.n)} · {man(r.won)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10.5px] text-ink-soft">
          스레드는 그날 올린 글의 지금 조회수 합이에요. 원본은{" "}
          <a href={`/admin/daily.csv?from=${from}&to=${today}`} className="underline">
            날짜별 CSV
          </a>
          ·{" "}
          <a href="/admin/orders.csv" className="underline">
            주문 CSV
          </a>
          로 받을 수 있어요.
        </p>
      </div>
    </section>
  );
}

// "▲ 12%" against the span before (or "새로" when there was nothing).
function delta(now: number, before: number): string {
  if (before <= 0) return now > 0 ? "▲ 새로" : "–";
  const d = ((now - before) / before) * 100;
  return `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(0)}%`;
}
