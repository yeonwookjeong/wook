import { rankCourt } from "@/lib/court";
import { ministerStory } from "@/lib/og";
import { getCourt, listMinisters } from "@/lib/store";

export async function GET(_req: Request, { params }: RouteContext<"/court/[id]/m/[mid]/card">) {
  const { id, mid } = await params;
  const court = await getCourt(id);
  const seat = court && rankCourt(court, await listMinisters(court.id)).find((s) => s.minister.id === mid);
  if (!court || !seat) return new Response("Not found", { status: 404 });
  return ministerStory(court.kingName, seat.minister.name, seat.role, seat.match.score);
}
