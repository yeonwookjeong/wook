import Link from "next/link";
import { productById, type ProductId } from "@/lib/products";

// A short shelf of paid reports under a free result. `query` carries whose chart the report page should read.
export default function ReportShelf({
  ids,
  query,
  highlight,
}: {
  ids: ProductId[];
  query: string;
  highlight?: { id: ProductId; text: string };
}) {
  return (
    <section className="mt-8">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">秘 密 報 告</p>
      <h2 className="mt-1 text-center font-myeongjo text-xl font-extrabold">정 훈도의 비밀 보고서</h2>
      <p className="mt-1 text-center text-xs text-ink-soft">첫 장은 무료로 먼저 읽어 보시옵소서</p>
      <ul className="mt-3 flex flex-col gap-2">
        {ids.map((id) => {
          const p = productById(id)!;
          return (
            <li key={id}>
              <Link href={`/reports/${id}?${query}`} className="doc-paper flex items-center gap-3 px-4 py-4">
                <span className={`flex h-11 min-w-11 shrink-0 items-center justify-center border-2 border-seal/60 px-1 font-myeongjo font-extrabold text-seal ${p.hanja.length > 2 ? "text-xs" : "text-sm"}`}>
                  {p.hanja}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-myeongjo font-extrabold">{p.title}</span>
                  <span className="block text-xs leading-snug text-ink-soft">
                    {highlight?.id === id ? <b className="text-seal">{highlight.text}</b> : p.tagline}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-seal">맛보기 →</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/reports" className="mt-3 block text-center text-sm font-bold text-ink-soft underline">
        보고서 전체 보기
      </Link>
    </section>
  );
}
