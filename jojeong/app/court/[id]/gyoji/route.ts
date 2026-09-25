import { rankCourt } from "@/lib/court";
import { courtStory } from "@/lib/og";
import { getCourt, listMinisters } from "@/lib/store";

export async function GET(_req: Request, { params }: RouteContext<"/court/[id]/gyoji">) {
  const { id } = await params;
  const court = await getCourt(id);
  if (!court) return new Response("Not found", { status: 404 });
  return courtStory(court.kingName, rankCourt(court, await listMinisters(court.id)));
}
