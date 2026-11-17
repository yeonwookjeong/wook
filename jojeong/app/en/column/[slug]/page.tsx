import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IntlColumnView from "@/components/IntlColumnView";
import { SITE_NAME } from "@/lib/brand";
import { intlColumn, isLive, sibling, UI } from "@/lib/intl/columns";

// Columns open on their date, so the page is decided per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/en/column/[slug]">): Promise<Metadata> {
  const c = intlColumn("en", (await params).slug);
  if (!c || !isLive(c)) return {};
  const other = sibling("en", c.slug, "ja");
  return {
    title: c.title,
    description: c.summary,
    alternates: {
      canonical: `/en/column/${c.slug}`,
      languages: { en: `/en/column/${c.slug}`, ...(!c.noKo && { ko: `/column/${c.ko}` }), ...(other && { ja: `/ja/column/${other.slug}` }) },
    },
    openGraph: { type: "article", url: `/en/column/${c.slug}`, siteName: SITE_NAME, locale: UI.en.locale, title: c.title, description: c.summary, publishedTime: c.date },
  };
}

export default async function EnColumnPage({ params }: PageProps<"/en/column/[slug]">) {
  const c = intlColumn("en", (await params).slug);
  if (!c || !isLive(c)) notFound();
  return <IntlColumnView c={c} lang="en" />;
}
