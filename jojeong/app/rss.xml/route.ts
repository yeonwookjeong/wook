import { SITE_NAME, SITE_SUMMARY, siteUrl } from "@/lib/brand";
import { publishedColumns } from "@/lib/columns";

// RSS for 훈도의 사주 이야기, so search engines (Naver Search Advisor reads RSS) pick up each column the day it
// opens. Only published columns, newest first; refreshed hourly like the sitemap.
export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// A column opens at 0시 KST on its date.
const rfc822 = (date: string) => new Date(`${date}T00:00:00+09:00`).toUTCString();

export function GET() {
  const base = siteUrl();
  const cols = [...publishedColumns()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
  const items = cols
    .map((c) => {
      const url = `${base}/column/${c.slug}`;
      return `<item><title>${esc(c.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${esc(c.summary)}</description><pubDate>${rfc822(c.date)}</pubDate></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`${SITE_NAME}, 훈도의 사주 이야기`)}</title><link>${base}/column</link><atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/><description>${esc(SITE_SUMMARY)}</description><language>ko</language>${cols[0] ? `<lastBuildDate>${rfc822(cols[0].date)}</lastBuildDate>` : ""}${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
