import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { rankCourt } from "./court";
import { MINISTER_COOKIE, OWNER_COOKIE } from "./cookies";
import { getCourt, listMinisters } from "./store";

export const loadCourt = cache(async (courtId: string) => {
  const court = await getCourt(courtId);
  if (!court) notFound();
  const seats = rankCourt(court, await listMinisters(court.id));
  return { court, seats };
});

export async function viewerOf(courtId: string, ownerToken: string) {
  const jar = await cookies();
  return {
    isOwner: jar.get(OWNER_COOKIE(courtId))?.value === ownerToken,
    myMinisterId: jar.get(MINISTER_COOKIE(courtId))?.value ?? null,
  };
}
