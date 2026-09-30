import Link from "next/link";
import { isOpen, productById, type ProductId } from "@/lib/products";
import Keep from "./Keep";
import TrackLink from "./TrackLink";

// A short shelf of reports under a free result. `query` carries whose chart the report page should read;
// `highlights` swaps a report's tagline for a line read from that chart.
export default function ReportShelf({ ids, query, highlights = {} }: { ids: ProductId[]; query: string; highlights?: Partial<Record<ProductId, string>> }) {
  return (
    <section className="mt-8">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">秘 密 報 告</p>
      <h2 className="mt-1 text-center font-myeongjo text-xl font-extrabold">정 훈도의 비밀 보고서</h2>
      <p className="mt-1 text-center text-xs text-ink-soft">
        <>신분 감정·2026 운세는 무료, 나머지는 사주 풀이를 먼저 보시고 여시옵소서</>
      </p>
      {/* The free ones first, then the ones on sale: free → deeper, the order of the funnel, and never the two
          kinds interleaved. */}
      {[ids.filter((id) => isOpen(productById(id)!)), ids.filter((id) => !isOpen(productById(id)!))].map(
        (group, g) =>
          group.length > 0 && (
            <ul key={g} className={`${g === 0 ? "mt-3" : "mt-4"} flex flex-col gap-2`}>
              {group.map((id) => {
                const p = productById(id)!;
                // The modern reports read the chart remembered in this browser (saved when the game was played),
                // never a court's, so their links carry no court.
                // Paid in 쪽빛, free on paper, as everywhere on the site.
                const free = isOpen(p);
                return (
                  <li key={id}>
                    <TrackLink event="to_saju" href={p.modern ? `/reports/${id}` : `/reports/${id}?${query}`} className={`${free ? "doc-paper" : "jjok-box"} flex items-center gap-3 px-4 py-4`}>
                      <span
                        className={`flex h-11 min-w-11 shrink-0 items-center justify-center border-2 px-1 font-myeongjo font-extrabold ${free ? "border-seal/60 text-seal" : "border-gold/60 text-gold"} ${p.hanja.length > 2 ? "text-xs" : "text-sm"}`}
                      >
                        {p.hanja}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-myeongjo font-extrabold">{p.title}</span>
                        <span className={`block text-xs leading-snug ${free ? "text-ink-soft" : "text-hanji/75"}`}>
                          {highlights[id] ? <b className={free ? "text-seal" : "text-gold"}>{highlights[id]}</b> : <Keep clauses>{p.tagline}</Keep>}
                        </span>
                      </span>
                      <span className={`shrink-0 text-sm font-bold ${free ? "text-seal" : "text-gold"}`}>
                        {free ? "무료 →" : "보기 →"}
                      </span>
                    </TrackLink>
                  </li>
                );
              })}
            </ul>
          ),
      )}
      <Link href="/reports" className="mt-3 block text-center text-sm font-bold text-ink-soft underline">
        보고서 전체 보기
      </Link>
    </section>
  );
}
