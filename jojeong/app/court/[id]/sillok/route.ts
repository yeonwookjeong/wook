import { rankCourt } from "@/lib/court";
import { sillokStory } from "@/lib/og";
import { castOf } from "@/lib/sillok";
import { getCourt, listMinisters } from "@/lib/store";

export async function GET(_req: Request, { params }: RouteContext<"/court/[id]/sillok">) {
  const { id } = await params;
  const court = await getCourt(id);
  if (!court) return new Response("Not found", { status: 404 });
  return sillokStory(court.kingName, court.king, castOf(rankCourt(court, await listMinisters(court.id))));
}
