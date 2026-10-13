import type { Metadata } from "next";
import Link from "next/link";
import ColumnTitle from "@/components/ColumnTitle";
import { catLabel, COLUMN_CATS, columnDate, publishedColumns, type ColumnCat } from "@/lib/columns";

export const metadata: Metadata = {
  title: "훈도의 사주 이야기",
  description: "사주표 읽는 법부터 칸마다의 뜻, 절기와 띠, 궁합까지. 생일을 넣지 않아도 읽을 수 있는 사주 이야기를 모았어요.",
  alternates: { canonical: "/column" },
};

// The list of 훈도의 사주 이야기, newest first, on one shelf (?c=) or all of them. Read per request (the shelf), so
// an article dated today appears at midnight without a deploy.
export default async function ColumnListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const c = String((await searchParams).c ?? "");
  const all = publishedColumns();
  // Only the shelves that hold something yet.
  const cats = COLUMN_CATS.filter((k) => all.some((x) => x.cat === k.key));
  const cat = cats.some((k) => k.key === c) ? (c as ColumnCat) : null;
  const list = cat ? all.filter((x) => x.cat === cat) : all;
  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${on ? "border-ink bg-ink text-hanji" : "border-ink/15 bg-white/50 text-ink-soft"}`;
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">讀 命</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">훈도의 사주 이야기</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
          사주를 처음 보는 분도 읽을 수 있게,
          <br />칸 하나, 글자 하나씩 풀어 드려요.
        </p>
      </section>
      <nav aria-label="주제" className="-mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Link href="/column" className={chip(!cat)}>
          전체 {all.length}
        </Link>
        {cats.map((k) => (
          <Link key={k.key} href={`/column?c=${k.key}`} className={chip(cat === k.key)}>
            {k.label} {all.filter((x) => x.cat === k.key).length}
          </Link>
        ))}
      </nav>
      <ul className="mt-4 flex flex-col gap-3">
        {list.map((x) => (
          <li key={x.slug}>
            <Link href={`/column/${x.slug}`} className="doc-paper block px-5 py-4">
              <span className="text-[11px] font-extrabold text-seal">
                {catLabel(x.cat)} · {columnDate(x.date)}
              </span>
              <b className="mt-1 block font-myeongjo text-[17px] leading-snug">
                <ColumnTitle title={x.title} />
              </b>
              <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{x.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
