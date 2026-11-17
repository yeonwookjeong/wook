import type { Metadata } from "next";
import { IntlColumnList } from "@/components/IntlColumnView";
import { UI } from "@/lib/intl/columns";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: UI.ja.guides,
  description: UI.ja.guidesLine,
  alternates: { canonical: "/ja/column", languages: { en: "/en/column", ja: "/ja/column", ko: "/column" } },
};

export default function JaColumnList() {
  return <IntlColumnList lang="ja" />;
}
