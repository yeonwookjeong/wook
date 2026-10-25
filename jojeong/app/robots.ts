import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

// Crawlers that gather pages to train AI models: kept out entirely. Search engines and AI search (answers that link
// back here) are not on this list, so the site still shows up and can be found.
const AI_TRAINING = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
  "FacebookBot",
  "Diffbot",
  "cohere-training-data-crawler",
  "omgili",
  "Timpibot",
];

// Courts and bought reports carry people's names: kept out of search. Everything sold or free stays in.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_TRAINING, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/court/", "/pay/", "/r/", "/my", "/admin", "/ask/go"] },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
