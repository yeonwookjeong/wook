import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

// Courts and bought reports carry people's names: kept out of search. Everything sold or free stays in.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/court/", "/pay/", "/r/", "/my"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
