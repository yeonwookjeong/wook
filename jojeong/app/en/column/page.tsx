import type { Metadata } from "next";
import { IntlColumnList } from "@/components/IntlColumnView";
import { UI } from "@/lib/intl/columns";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: UI.en.guides,
  description: UI.en.guidesLine,
  alternates: { canonical: "/en/column", languages: { en: "/en/column", ja: "/ja/column", ko: "/column" } },
};

export default function EnColumnList() {
  return <IntlColumnList lang="en" />;
}
