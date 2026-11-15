import { getCollection } from "astro:content";

export async function publishedGuides() {
  const all = await getCollection("guides", (g) => import.meta.env.DEV || !g.data.draft);
  return all.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
