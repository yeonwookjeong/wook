import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { rankCourt } from "./court";
import { MINISTER_COOKIE, OWNER_COOKIE, OWNER_PREFIX } from "./cookies";
import { getCourt, listMinisters, type Court } from "./store";

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

// Courts this browser enthroned (owner cookies), the newest first.
export async function ownedCourts(limit = 3): Promise<Court[]> {
  const jar = await cookies();
  // Every court this browser enthroned is checked (up to 30), and the newest shown first: taking the first few
  // cookies before checking them hid a new court behind older or deleted ones once a browser had made several.
  const owned = jar
    .getAll()
    .filter((c) => c.name.startsWith(OWNER_PREFIX))
    .slice(0, 30);
  const courts = await Promise.all(owned.map((c) => getCourt(c.name.slice(OWNER_PREFIX.length))));
  return courts
    .filter((court, i): court is Court => !!court && court.ownerToken === owned[i].value)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
