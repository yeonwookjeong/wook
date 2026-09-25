import { kingStory } from "@/lib/og";
import { getCourt } from "@/lib/store";

export async function GET(_req: Request, { params }: RouteContext<"/court/[id]/king">) {
  const { id } = await params;
  const court = await getCourt(id);
  if (!court) return new Response("Not found", { status: 404 });
  return kingStory(court.kingName, court.king);
}
