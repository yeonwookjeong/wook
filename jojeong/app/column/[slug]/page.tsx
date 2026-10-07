import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import EightCells from "@/components/EightCells";
import { SITE_NAME, siteUrl } from "@/lib/brand";
import { COLUMNS, columnBySlug, columnDate, type ColumnBlock } from "@/lib/columns";
import { hanjaNum } from "@/lib/hanjaNum";

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

type Design = "a" | "b" | "c";
type Section = { head: string | null; blocks: ColumnBlock[] };

// The blocks before the first heading are the lead; each heading opens a section.
function sectionsOf(body: ColumnBlock[]): Section[] {
  const out: Section[] = [{ head: null, blocks: [] }];
  for (const b of body) {
    if (b.t === "h2") out.push({ head: b.text, blocks: [] });
    else out.at(-1)!.blocks.push(b);
  }
  return out;
}

const SECTION_ICON = ["柱", "圖", "天", "色", "要", "問", "讀", "命"];

function Block({ b, design, lead }: { b: ColumnBlock; design: Design; lead?: boolean }) {
  switch (b.t) {
    case "h2":
      return null;
    case "p":
      return (
        <p
          className={`mt-3 text-[16px] leading-[1.85] first:mt-0 ${
            lead && design === "a"
              ? "first-letter:float-left first-letter:mt-1 first-letter:mr-1.5 first-letter:font-myeongjo first-letter:text-[44px] first-letter:leading-[0.9] first-letter:font-extrabold first-letter:text-seal"
              : ""
          }`}
        >
          {b.text}
        </p>
      );
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
      return design === "b" ? (
        <details className="group mt-3 rounded-xl border border-seal/20 bg-white/40 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
            <span>{b.q}</span>
            <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <p className="mt-2 text-[15.5px] leading-relaxed">{b.a}</p>
        </details>
      ) : (
        <div className="mt-4 border-l-2 border-seal/40 pl-3">
          <p className="font-bold">{b.q}</p>
          <p className="mt-1 text-[15.5px] leading-relaxed">{b.a}</p>
        </div>
      );
    case "term":
      return (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-jjok/5 px-4 py-3">
          <span className="shrink-0 rounded-md bg-jjok/80 px-2 py-0.5 text-[11px] font-extrabold text-hanji">한 줄 용어</span>
          <p className="text-[14.5px] leading-relaxed">
            <b>{b.k}</b> {b.v}
          </p>
        </div>
      );
    case "eight":
      return <EightCells />;
  }
}

export default async function ColumnPage({ params, searchParams }: PageProps<"/column/[slug]">) {
  const c = columnBySlug((await params).slug);
  if (!c) notFound();
  const d = (await searchParams).d;
  const design: Design = d === "b" || d === "c" ? d : "a";
  const others = COLUMNS.filter((o) => o.slug !== c.slug).slice(0, 3);
  const [lead, ...sections] = sectionsOf(c.body);
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

  const header = (
    <header>
      <p className="text-[12px] font-extrabold text-seal">
        <Link href="/column">훈도의 사주 이야기</Link> · {c.level}
      </p>
      <h1 className="mt-2 font-myeongjo text-[26px] leading-tight font-extrabold">{c.title}</h1>
      <p className="mt-2 text-[12px] text-ink-soft">{columnDate(c.date)} · 정 훈도</p>
    </header>
  );
  const points = (
    <div className="mt-4 rounded-xl border border-seal/25 bg-seal/5 px-4 py-3">
      <p className="text-[12px] font-extrabold text-seal">이 글에서 알 수 있는 것</p>
      <ol className="mt-1.5 flex flex-col gap-1 text-[14.5px] leading-snug">
        {c.points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <b className="text-seal">{i + 1}</b>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {design === "a" && (
        <article className="doc-paper mt-6 px-5 py-6">
          {header}
          {points}
          <div className="mt-5">
            {lead.blocks.map((b, i) => (
              <Block key={i} b={b} design={design} lead={i === 0} />
            ))}
          </div>
          {sections.map((s, i) => (
            <section key={i} className="mt-9">
              <h2 className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo text-[15px] font-extrabold text-seal">
                  {hanjaNum(i + 1)}
                </span>
                <span className="font-myeongjo text-xl leading-snug font-extrabold">{s.head}</span>
              </h2>
              <div className="mt-3">
                {s.blocks.map((b, j) => (
                  <Block key={j} b={b} design={design} />
                ))}
              </div>
            </section>
          ))}
          <div className="mt-10 flex items-center justify-end gap-3">
            <span className="font-myeongjo text-[13px] text-ink-soft">정 훈도 씀</span>
            <span className="flex size-12 rotate-[-4deg] items-center justify-center rounded-sm border-2 border-seal bg-seal/90 font-myeongjo text-[15px] leading-none font-extrabold text-hanji [writing-mode:vertical-rl]">
              訓導
            </span>
          </div>
        </article>
      )}

      {design === "b" && (
        <article className="mt-6">
          {header}
          <div className="mt-4">
            {lead.blocks.map((b, i) => (
              <Block key={i} b={b} design={design} />
            ))}
          </div>
          {sections.map((s, i) => (
            <section key={i} className="doc-paper mt-4 px-5 py-5">
              <h2 className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-seal font-myeongjo text-lg font-extrabold text-hanji">
                  {SECTION_ICON[i % SECTION_ICON.length]}
                </span>
                <span className="font-myeongjo text-[19px] leading-snug font-extrabold">{s.head}</span>
              </h2>
              <div className="mt-3">
                {s.blocks.map((b, j) => (
                  <Block key={j} b={b} design={design} />
                ))}
              </div>
            </section>
          ))}
        </article>
      )}

      {design === "c" && (
        <article className="mt-6">
          {header}
          {points}
          <nav className="mt-3 rounded-xl border border-ink/10 px-4 py-3" aria-label="목차">
            <p className="text-[12px] font-extrabold text-ink-soft">목차</p>
            <ol className="mt-1.5 flex flex-col gap-1 text-[14px]">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#s${i + 1}`} className="text-ink underline decoration-seal/30 underline-offset-4">
                    {i + 1}. {s.head}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-5">
            {lead.blocks.map((b, i) => (
              <Block key={i} b={b} design={design} />
            ))}
          </div>
          {sections.map((s, i) => (
            <section key={i} id={`s${i + 1}`} className="mt-8 scroll-mt-4">
              <h2 className="border-b border-seal/20 pb-2 font-myeongjo text-xl leading-snug font-extrabold">
                <span className="mr-1.5 text-seal">{i + 1}.</span>
                {s.head}
              </h2>
              <div className="mt-3">
                {s.blocks.map((b, j) => (
                  <Block key={j} b={b} design={design} />
                ))}
              </div>
            </section>
          ))}
        </article>
      )}

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
