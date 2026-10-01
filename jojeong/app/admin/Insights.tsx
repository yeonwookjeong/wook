import Link from "next/link";
import type { Order } from "@/lib/pay";
import { SOURCE_LABEL, SOURCES, type Source } from "@/lib/source";
import { daysBetween, inPeriods, PERIODS, readDays, type Period } from "@/lib/stats";

const n = (v: number) => v.toLocaleString("ko-KR");
const KST = 9 * 3600000;
const kday = (t: number) => new Date(t + KST).toISOString().slice(0, 10);
// Today in Korea and the days before it, read per request.
const daysAgo = (k = 0) => kday(Date.now() - k * 86400000);
const srcOf = (o: Order): Source | "none" => o.src ?? "none";
const ROWS: (Source | "none")[] = [...SOURCES, "none"];
const label = (s: Source | "none") => (s === "none" ? "기록 전 주문" : SOURCE_LABEL[s]);

// Paying readers by the road they first came (lib/source.ts), per period, with the new visitors on each road
// beside them. Orders from before the road was kept are listed apart.
export function SourceTable({ stats, paid }: { stats: Record<string, Record<Period, number>>; paid: Order[] }) {
  const by: Record<string, Record<Period, { n: number; won: number }>> = {};
  for (const o of paid)
    for (const p of inPeriods(o.paidAt ?? o.createdAt)) {
      const cell = ((by[srcOf(o)] ??= {} as Record<Period, { n: number; won: number }>)[p] ??= { n: 0, won: 0 });
      cell.n += 1;
      cell.won += o.amount;
    }
  const rows = ROWS.filter((s) => s !== "none" || by.none);
  return (
    <section className="doc-paper mt-4 px-3 py-4">
      <h2 className="px-1 font-myeongjo font-extrabold">들어온 길별 결제</h2>
      <p className="mt-0.5 px-1 text-[11px] text-ink-soft">칸마다 위: 결제 건 · 매출, 아래: 그 길로 처음 온 방문자</p>
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
            {rows.map((s) => (
              <tr key={s} className="border-t border-seal/10 align-top">
                <td className="py-1.5 text-left text-[11.5px] leading-tight">{label(s)}</td>
                {PERIODS.map((p) => {
                  const c = by[s]?.[p.key];
                  return (
                    <td key={p.key} className="px-1 py-1.5 leading-tight">
                      <b className={c?.n ? "text-seal" : "text-ink-soft/50"}>{c?.n ?? 0}</b>
                      {c?.won ? <span className="block text-[10px] text-ink-soft">{n(c.won)}</span> : null}
                      {s !== "none" && <span className="block text-[10px] text-ink-soft/80">신규 {n(stats[`src:${s}`]?.[p.key] ?? 0)}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        처음 들어온 길을 브라우저에 1년 동안 기억해 두고, 결제할 때 주문에 함께 남겨요. 기록은 10월 1일 밤부터예요. 인스타·스레드 앱 안에서 연
        경우는 앱 이름으로 알아보고, 친구 초대(조정 링크)로 온 경우는 &lsquo;왕이 될 사주&rsquo;로 쳐요.
      </p>
    </section>
  );
}

const DAY_COLS = [
  { key: "uv", label: "방문자" },
  { key: "pv", label: "페이지뷰" },
  { key: "king", label: "즉위" },
  { key: "join", label: "입궐" },
  { key: "to_saju", label: "다음 걸음" },
  { key: "reading", label: "무료 분석" },
] as const;

// Any span of days, one row each: the funnel's main counts, the payments and the money, then the span's roads.
export async function DailyTable({ from, to, paid }: { from: string; to: string; paid: Order[] }) {
  const days = daysBetween(from, to);
  const events = [...DAY_COLS.map((c) => c.key), ...SOURCES.map((s) => `src:${s}`)];
  const counts = await readDays(events, days);
  const pay = days.map((d) => paid.filter((o) => kday(o.paidAt ?? o.createdAt) === d));
  const total = (e: string) => counts[e].reduce((a, v) => a + v, 0);
  const inSpan = pay.flat();
  const today = daysAgo();
  const back = daysAgo;
  const month = today.slice(0, 7);
  const prevMonthEnd = kday(Date.parse(`${month}-01T00:00:00+09:00`) - 86400000);
  const quick = [
    { name: "최근 7일", f: back(6), t: today },
    { name: "최근 30일", f: back(29), t: today },
    { name: "이번 달", f: `${month}-01`, t: today },
    { name: "지난달", f: `${prevMonthEnd.slice(0, 7)}-01`, t: prevMonthEnd },
  ];
  const rows = days.map((d, i) => ({ d, i })).reverse();
  return (
    <section id="days" className="doc-paper mt-4 scroll-mt-4 px-3 py-4">
      <h2 className="px-1 font-myeongjo font-extrabold">날짜별로 보기</h2>
      <form action="/admin#days" className="mt-2 flex flex-wrap items-center gap-1.5 px-1 text-[12px]">
        <input type="date" name="df" defaultValue={from} max={today} className="rounded-md border border-seal/30 bg-white/70 px-2 py-1" />
        <span>~</span>
        <input type="date" name="dt" defaultValue={to} max={today} className="rounded-md border border-seal/30 bg-white/70 px-2 py-1" />
        <button className="rounded-md bg-seal px-3 py-1 font-bold text-white">보기</button>
      </form>
      <p className="mt-2 flex flex-wrap gap-1.5 px-1 text-[11px]">
        {quick.map((q) => (
          <Link
            key={q.name}
            href={`/admin?df=${q.f}&dt=${q.t}#days`}
            className={`rounded-full border px-2.5 py-0.5 ${q.f === from && q.t === to ? "border-seal bg-seal text-white" : "border-seal/30"}`}
          >
            {q.name}
          </Link>
        ))}
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-right text-[12px] tabular-nums">
          <thead>
            <tr className="text-ink-soft">
              <th className="py-1 text-left font-normal">날짜</th>
              {DAY_COLS.map((c) => (
                <th key={c.key} className="px-1 py-1 font-normal">
                  {c.label}
                </th>
              ))}
              <th className="px-1 py-1 font-normal">결제</th>
              <th className="px-1 py-1 font-normal">매출</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-y border-seal/30 font-bold">
              <td className="py-1 text-left">합계</td>
              {DAY_COLS.map((c) => (
                <td key={c.key} className="px-1 py-1">
                  {n(total(c.key))}
                </td>
              ))}
              <td className="px-1 py-1 text-seal">{n(inSpan.length)}</td>
              <td className="px-1 py-1 text-seal">{n(inSpan.reduce((a, o) => a + o.amount, 0))}</td>
            </tr>
            {rows.map(({ d, i }) => {
              const wd = "일월화수목금토"[new Date(`${d}T12:00:00+09:00`).getUTCDay()];
              return (
                <tr key={d} className="border-b border-seal/10">
                  <td className={`py-1 text-left ${wd === "토" || wd === "일" ? "text-seal" : ""}`}>
                    {Number(d.slice(5, 7))}/{Number(d.slice(8))} {wd}
                  </td>
                  {DAY_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      {n(counts[c.key][i])}
                    </td>
                  ))}
                  <td className="px-1 py-1 font-bold">{n(pay[i].length)}</td>
                  <td className="px-1 py-1">{n(pay[i].reduce((a, o) => a + o.amount, 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h3 className="mt-4 px-1 text-[12.5px] font-extrabold">이 기간 들어온 길</h3>
      <ul className="mt-1 grid grid-cols-2 gap-1.5 px-1 text-[11.5px]">
        {ROWS.map((s) => {
          const list = inSpan.filter((o) => srcOf(o) === s);
          const visitors = s === "none" ? null : total(`src:${s}`);
          if (s === "none" && !list.length) return null;
          return (
            <li key={s} className="rounded-lg bg-white/60 px-2 py-1.5">
              <p className="text-ink-soft">{label(s)}</p>
              <p>
                <b className="text-seal">결제 {list.length}</b>
                {list.length > 0 && <span className="text-ink-soft"> · {n(list.reduce((a, o) => a + o.amount, 0))}원</span>}
                {visitors !== null && <span className="text-ink-soft"> · 신규 {n(visitors)}</span>}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        방문자는 하루 단위로 센 수를 더한 거라, 이틀 온 사람은 두 번 세져요. 숫자는 이 표를 만든 날부터 있어요.
      </p>
    </section>
  );
}
