import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IntlColumnView from "@/components/IntlColumnView";
import { SITE_NAME } from "@/lib/brand";
import { intlColumn, isLive, sibling, UI } from "@/lib/intl/columns";

// Columns open on their date, so the page is decided per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/ja/column/[slug]">): Promise<Metadata> {
  const c = intlColumn("ja", (await params).slug);
  if (!c || !isLive(c)) return {};
  const other = sibling("ja", c.slug, "en");
  return {
    title: c.title,
    description: c.summary,
    alternates: {
      canonical: `/ja/column/${c.slug}`,
      languages: { ja: `/ja/column/${c.slug}`, ko: `/column/${c.ko}`, ...(other && { en: `/en/column/${other.slug}` }) },
    },
    openGraph: { type: "article", url: `/ja/column/${c.slug}`, siteName: SITE_NAME, locale: UI.ja.locale, title: c.title, description: c.summary, publishedTime: c.date },
  };
}

export default async function JaColumnPage({ params }: PageProps<"/ja/column/[slug]">) {
  const c = intlColumn("ja", (await params).slug);
  if (!c || !isLive(c)) notFound();
  return <IntlColumnView c={c} lang="ja" />;
}
