import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";
import { publishedColumns } from "@/lib/columns";
import { SHELF } from "@/lib/products";

// Refreshed hourly: columns open on their dates.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${base}${path}`, changeFrequency: "weekly", priority });
  return [
    page("/", 1),
    page("/reports", 0.8),
    ...SHELF.filter((p) => p.modern || p.free).map((p) => page(`/reports/${p.id}`, 0.8)),
    page("/king", 0.7),
    page("/samjae", 0.6),
    page("/ranking", 0.7),
    page("/column", 0.7),
    // Each column with its day, so a crawler knows which ones are new.
    ...publishedColumns().map((c) => ({ ...page(`/column/${c.slug}`, 0.6), lastModified: new Date(`${c.date}T00:00:00+09:00`) })),
    page("/about", 0.5),
    page("/terms", 0.2),
    page("/refund", 0.2),
    page("/privacy", 0.2),
    page("/contact", 0.2),
  ];
}
