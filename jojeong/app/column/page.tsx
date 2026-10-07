import type { Metadata } from "next";
import Link from "next/link";
import ColumnTitle from "@/components/ColumnTitle";
import { columnDate, publishedColumns } from "@/lib/columns";

export const metadata: Metadata = {
  title: "훈도의 사주 이야기",
  description: "사주표 읽는 법부터 칸마다의 뜻, 절기와 띠, 궁합까지. 생일을 넣지 않아도 읽을 수 있는 사주 이야기를 모았어요.",
  alternates: { canonical: "/column" },
};

// Refreshed hourly so an article dated today appears without a deploy.
export const revalidate = 3600;

// The list of 훈도의 사주 이야기, newest first.
export default function ColumnListPage() {
  const list = publishedColumns();
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
      <ul className="mt-6 flex flex-col gap-3">
        {list.map((c) => (
          <li key={c.slug}>
            <Link href={`/column/${c.slug}`} className="doc-paper block px-5 py-4">
              <span className="text-[11px] font-extrabold text-seal">
                {c.level} · {columnDate(c.date)}
              </span>
              <b className="mt-1 block font-myeongjo text-[17px] leading-snug">
                <ColumnTitle title={c.title} />
              </b>
              <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{c.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
