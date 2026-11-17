import Link from "next/link";
import { SITE_NAME, siteUrl } from "@/lib/brand";
import { intlColumns, UI, type IntlBlock, type IntlColumn, type Lang } from "@/lib/intl/columns";

// One English or Japanese column (lib/intl/columns.ts), laid out like the Korean ones: the points box, the
// sections, then a way on. Plain server-rendered prose so search engines read it whole.

function Block({ b, lang }: { b: IntlBlock; lang: Lang }) {
  switch (b.t) {
    case "h2":
      return <h2 className="mt-9 font-myeongjo text-[21px] leading-snug font-extrabold">{b.text}</h2>;
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
    case "term":
      return (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-jjok/5 px-4 py-3">
          <span className="shrink-0 rounded-md bg-jjok/80 px-2 py-0.5 text-[11px] font-extrabold text-hanji">{UI[lang].inShort}</span>
          <p className="text-[14.5px] leading-relaxed">
            <b>{b.k}</b> {b.v}
          </p>
        </div>
      );
  }
}

export default function IntlColumnView({ c, lang }: { c: IntlColumn; lang: Lang }) {
  const ui = UI[lang];
  const others = intlColumns(lang)
    .filter((o) => o.slug !== c.slug)
    .slice(0, 3);
  const base = siteUrl();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.summary,
    datePublished: c.date,
    inLanguage: lang,
    mainEntityOfPage: `${base}/${lang}/column/${c.slug}`,
    author: { "@type": "Organization", name: SITE_NAME, url: base },
    publisher: { "@type": "Organization", name: SITE_NAME, url: base, logo: { "@type": "ImageObject", url: `${base}/hundo-face.png` } },
  };
  return (
    <article className="pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="text-[12px] font-bold tracking-[0.15em] text-seal">{ui.guides.toUpperCase()}</p>
      <h1 className="mt-2 font-myeongjo text-[27px] leading-snug font-extrabold">{c.title}</h1>
      <p className="mt-2 text-[13px] text-ink-soft">{c.date}</p>

      <section className="mt-5 rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
        <p className="font-myeongjo text-[14px] font-extrabold text-seal">{ui.youWill}</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[15px] leading-relaxed">
          {c.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-seal">◆</span>
              {p}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        {c.body.map((b, i) => (
          <Block key={i} b={b} lang={lang} />
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-[#0f2236] px-5 pt-5 pb-6 text-hanji">
        <p className="font-myeongjo text-[12px] font-bold tracking-[0.15em] text-[#d9b465]">{ui.next.toUpperCase()}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-hanji/85">{ui.nextLine}</p>
        <Link
          href={lang === "en" ? "/en/name" : "/ja"}
          className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#d9b465] font-myeongjo text-[16px] font-extrabold text-[#0f2236]"
        >
          {ui.nextCta}
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="font-myeongjo text-[18px] font-extrabold">{ui.more}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/${lang}/column/${o.slug}`} className="block rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.08)]">
                  <p className="font-myeongjo text-[15.5px] leading-snug font-extrabold">{o.title}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{o.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-center text-[14px]">
        <Link href={`/${lang}/column`} className="font-bold text-seal underline-offset-2 hover:underline">
          {ui.all}
        </Link>
      </p>
    </article>
  );
}

export function IntlColumnList({ lang }: { lang: Lang }) {
  const ui = UI[lang];
  const list = intlColumns(lang);
  return (
    <>
      <header className="pt-6">
        <h1 className="font-myeongjo text-[28px] font-extrabold">{ui.guides}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{ui.guidesLine}</p>
      </header>
      <ul className="mt-5 flex flex-col gap-3">
        {list.map((c) => (
          <li key={c.slug}>
            <Link href={`/${lang}/column/${c.slug}`} className="block rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
              <p className="font-myeongjo text-[17px] leading-snug font-extrabold">{c.title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
