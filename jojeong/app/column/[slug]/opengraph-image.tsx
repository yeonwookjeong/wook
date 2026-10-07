import { columnBySlug, titleLines } from "@/lib/columns";
import { columnImage, storeImage } from "@/lib/og";

// Each column's card when it is shared or shown as a search thumbnail: its own title, not the site's.
export const alt = "훈도의 사주 이야기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = columnBySlug((await params).slug);
  if (!c) return storeImage();
  const [head, sub] = titleLines(c.title);
  return columnImage({ level: c.level, head, sub });
}
