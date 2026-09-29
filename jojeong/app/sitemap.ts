import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";
import { SHELF } from "@/lib/products";

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
    page("/terms", 0.2),
    page("/refund", 0.2),
    page("/privacy", 0.2),
    page("/contact", 0.2),
  ];
}
