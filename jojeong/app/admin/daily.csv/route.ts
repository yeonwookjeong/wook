import { isAdmin } from "@/lib/admin";
import { COLUMNS } from "@/lib/columns";
import { allMembers } from "@/lib/members";
import { STEP_FROM } from "@/lib/nextStep";
import { paidOrders } from "@/lib/pay";
import { SALE_KEYS, saleLabel } from "@/lib/sales";
import { SOURCE_LABEL, SOURCES } from "@/lib/source";
import { daysBetween, readDays } from "@/lib/stats";
import { LAUNCH } from "../Dashboard";

// Every counter of every day, one row a day (owner only): the raw numbers behind the dashboard, for a look back
// in a spreadsheet. Paid orders are added up per day; test payments in a column of their own.
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("관리자만 받을 수 있어요.", { status: 403 });
  const kday = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);
  const q = new URL(request.url).searchParams;
  const isDay = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const to = isDay(q.get("to")) ? q.get("to")! : kday(Date.now());
  const from = isDay(q.get("from")) && q.get("from")! <= to ? q.get("from")! : LAUNCH;
  const days = daysBetween(from, to);

  const events = [
    ["uv", "방문자"],
    ["pv", "페이지뷰"],
    ["reading", "무료 분석"],
    ["to_saju", "무료→다음 걸음"],
    ...SOURCES.map((s) => [`src:${s}`, `새 방문:${SOURCE_LABEL[s]}`]),
    ...SALE_KEYS.flatMap((k) => [
      [`view:${k}`, `조회:${saleLabel(k) ?? k}`],
      [`co:${k}`, `결제창:${saleLabel(k) ?? k}`],
    ]),
    ...STEP_FROM.map((f) => [`to:${f}`, `다음 걸음:${f}`]),
    ...COLUMNS.map((c) => [`cv:${c.slug}`, `칼럼:${c.slug}`]),
    ...["king", "join"].map((e) => [e, e === "king" ? "즉위" : "입궐"]),
  ];
  const counts = await readDays(
    events.map(([e]) => e),
    days,
  );
  const orders = await paidOrders();
  // 가입: members joined that day (Kakao, Naver, Google), from each member's own `createdAt`, so the past is there
  // too. Members who left are deleted with their record, so a day's count is of those still members today.
  // If the members cannot be read, the CSV still comes, with 가입 blank.
  const members = await allMembers(Infinity).catch(() => null);
  const joined = new Map<string, number>();
  for (const m of members ?? []) joined.set(kday(m.createdAt), (joined.get(kday(m.createdAt)) ?? 0) + 1);
  const head = ["날짜", "요일", ...events.map(([, l]) => l), "결제", "매출", "환불", "테스트 결제", "가입"];
  const rows = days.map((d, i) => {
    const mine = orders.filter((o) => kday(o.paidAt ?? o.createdAt) === d);
    const real = mine.filter((o) => !o.test);
    const paid = real.filter((o) => o.status === "paid");
    return [
      d,
      "일월화수목금토"[new Date(`${d}T12:00:00+09:00`).getUTCDay()],
      ...events.map(([e]) => counts[e][i]),
      paid.length,
      paid.reduce((a, o) => a + o.amount, 0),
      real.filter((o) => o.status === "canceled").length,
      mine.filter((o) => o.test).length,
      members ? joined.get(d) ?? 0 : "",
    ];
  });
  // A BOM so Excel reads the Korean as UTF-8.
  const csv = "﻿" + [head, ...rows].map((r) => r.join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hundosaju-daily-${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
