import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import EightCells from "@/components/EightCells";
import { SITE_NAME, siteUrl } from "@/lib/brand";
import { COLUMNS, columnBySlug, columnDate, type ColumnBlock } from "@/lib/columns";

// One article of 훈도의 사주 이야기 (lib/columns.ts): readable as it is, with no birthday asked, then a way on to
// the reader's own chart.

export function generateStaticParams() {
  return COLUMNS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/column/[slug]">): Promise<Metadata> {
  const c = columnBySlug((await params).slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.summary,
    alternates: { canonical: `/column/${c.slug}` },
    openGraph: { type: "article", title: c.title, description: c.summary, publishedTime: c.date },
  };
}

function Block({ b }: { b: ColumnBlock }) {
  switch (b.t) {
    case "h2":
      return <h2 className="mt-8 font-myeongjo text-xl leading-snug font-extrabold">{b.text}</h2>;
    case "p":
      return <p className="mt-3 text-[16px] leading-[1.85]">{b.text}</p>;
    case "list":
      return (
        <ul className="mt-3 flex flex-col gap-2 text-[15.5px] leading-relaxed">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-seal/70" aria-hidden="true" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "qa":
      return (
        <div className="mt-4 border-l-2 border-seal/40 pl-3">
          <p className="font-bold">{b.q}</p>
          <p className="mt-1 text-[15.5px] leading-relaxed">{b.a}</p>
        </div>
      );
    case "eight":
      return <EightCells />;
  }
}

export default async function ColumnPage({ params }: PageProps<"/column/[slug]">) {
  const c = columnBySlug((await params).slug);
  if (!c) notFound();
  const others = COLUMNS.filter((o) => o.slug !== c.slug).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.summary,
    datePublished: c.date,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${siteUrl()}/column/${c.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="mt-6">
        <p className="text-[12px] font-extrabold text-seal">
          <Link href="/column">훈도의 사주 이야기</Link> · {c.level}
        </p>
        <h1 className="mt-2 font-myeongjo text-[26px] leading-tight font-extrabold">{c.title}</h1>
        <p className="mt-2 text-[12px] text-ink-soft">
          {columnDate(c.date)} · 정 훈도
        </p>
        <div className="mt-4 border-t border-seal/15 pt-1">
          {c.body.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </div>
      </article>

      <Link href="/reports/pyeongsaeng" className="mt-8 block rounded-2xl bg-seal px-5 py-4 text-center text-hanji">
        <b className="block font-myeongjo text-lg">내 여덟 글자 무료로 보기</b>
        <span className="mt-0.5 block text-[12.5px] opacity-90">생일만 넣으면 내 사주표와 칸마다의 풀이가 바로 나와요</span>
      </Link>

      <AdSlot />

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="font-myeongjo text-lg font-extrabold">다른 이야기</h2>
          <ul className="mt-2 flex flex-col divide-y divide-seal/10">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/column/${o.slug}`} className="block py-3">
                  <b className="block font-myeongjo">{o.title}</b>
                  <span className="mt-0.5 block text-[12.5px] text-ink-soft">{o.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
