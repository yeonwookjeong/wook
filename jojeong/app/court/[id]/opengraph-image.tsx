import { inviteImage } from "@/lib/og";
import { loadCourt } from "@/lib/load";

export const alt = "전하께서 그대를 부르셨사옵니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { court, seats } = await loadCourt(id);
  return inviteImage(court.kingName, court.king, seats.length);
}
