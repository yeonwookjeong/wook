import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { COLUMNS, columnDate, isPublished, kstToday } from "@/lib/columns";

export const metadata: Metadata = { title: "칼럼 미리보기 · 관리자", robots: { index: false } };
export const dynamic = "force-dynamic";

// Days from today (KST) to a YYYY-MM-DD date.
const daysUntil = (d: string) => Math.round((Date.parse(d) - Date.parse(kstToday())) / 86400000);

// Every column in lib/columns.ts, the ones written ahead included: when each opens, and a link that shows it
// before its day (/column/[slug]?preview=1), so the owner checks them in one place.
export default async function ColumnsPage() {
  if (!(await isAdmin()))
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm">
        <Link href="/admin" className="underline">
          관리자로 로그인
        </Link>
        한 뒤에 열 수 있어요.
      </p>
    );
  // The next to open first, then the open ones newest first.
  const waiting = COLUMNS.filter((c) => !isPublished(c)).sort((a, b) => a.date.localeCompare(b.date));
  const open = COLUMNS.filter(isPublished).sort((a, b) => b.date.localeCompare(a.date));
  const row = (c: (typeof COLUMNS)[number]) => {
    const d = daysUntil(c.date);
    return (
      <li key={c.slug}>
        <Link href={`/column/${c.slug}${isPublished(c) ? "" : "?preview=1"}`} className="block py-3">
          <span className="flex items-center gap-2 text-[12px]">
            <span className={`rounded-full px-2 py-0.5 font-bold ${d > 0 ? "bg-gold/15 text-ink" : "bg-jjok/10 text-jjok"}`}>
              {d > 0 ? `예약 · D-${d}` : "공개 중"}
            </span>
            <span className="text-ink-soft">
              {columnDate(c.date)} · {c.level}
            </span>
          </span>
          <b className="mt-1 block font-myeongjo leading-snug">{c.title}</b>
          <span className="mt-0.5 block text-[12.5px] text-ink-soft">{c.summary}</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin" className="text-ink-soft underline">
          ← 관리자
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-5">
        <h1 className="font-myeongjo text-xl font-extrabold">칼럼 미리보기</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          써 둔 칼럼은 날짜가 되면 0시에 저절로 열려요. 예약된 글은 눌러서 손님과 같은 화면으로 미리 볼 수 있어요. 미리보기는 검색에 잡히지 않고 조회수에도
          세지 않아요.
        </p>
      </section>
      <section className="doc-paper mt-4 px-5 py-3">
        <h2 className="pt-2 font-myeongjo text-lg font-extrabold">예약 {waiting.length}편</h2>
        {waiting.length ? (
          <ul className="flex flex-col divide-y divide-seal/10">{waiting.map(row)}</ul>
        ) : (
          <p className="py-3 text-[13px] text-ink-soft">예약된 칼럼이 없어요. 모두 공개됐어요.</p>
        )}
      </section>
      <section className="doc-paper mt-4 px-5 py-3">
        <h2 className="pt-2 font-myeongjo text-lg font-extrabold">공개 {open.length}편</h2>
        <ul className="flex flex-col divide-y divide-seal/10">{open.map(row)}</ul>
      </section>
    </>
  );
}
