import { notFound } from "next/navigation";
import { ministerImage } from "@/lib/og";
import { loadCourt } from "@/lib/load";

export const alt = "왕이 될 사주 인사발령 교지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const { court, seats } = await loadCourt(id);
  const seat = seats.find((s) => s.minister.id === mid);
  if (!seat) notFound();
  return ministerImage(court.kingName, seat.minister.name, seat.role, seat.match.score);
}
