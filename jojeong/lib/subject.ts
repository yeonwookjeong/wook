import "server-only";
import { cookies } from "next/headers";
import { MINISTER_COOKIE, OWNER_COOKIE } from "./cookies";
import { ownedCourts } from "./load";
import type { Product } from "./products";
import type { Pillars } from "./saju";
import { getCourt, listMinisters, type Court, type Minister } from "./store";

export type Subject = { name: string; pillars: Pillars; king: boolean; courtId: string; who: string; self: boolean };

// Whose chart a report is read from: a court (and minister) named in the link if this browser belongs to it,
// otherwise the first court this browser enthroned. `self` marks the reader's own chart: only then are the
// private extras (대운, palace chart) used and offered.
export async function subjectFor(product: Product, courtId?: string, ministerId?: string): Promise<Subject | null> {
  const jar = await cookies();
  if (courtId) {
    const court = await getCourt(courtId);
    if (court) {
      const myMinister = jar.get(MINISTER_COOKIE(court.id))?.value;
      const mid = ministerId ?? myMinister;
      if (product.for !== "king" && mid) {
        const minister = (await listMinisters(court.id)).find((m) => m.id === mid);
        if (minister)
          return { name: minister.name, pillars: minister.pillars as Pillars, king: false, courtId: court.id, who: minister.id, self: myMinister === minister.id };
      }
      if (product.for !== "minister" && jar.get(OWNER_COOKIE(court.id))?.value === court.ownerToken)
        return { name: court.kingName, pillars: court.king, king: true, courtId: court.id, who: "king", self: true };
    }
  }
  if (product.for === "minister") return null;
  const [court] = await ownedCourts(1);
  return court ? { name: court.kingName, pillars: court.king, king: true, courtId: court.id, who: "king", self: true } : null;
}

// The court a reader belongs to (as its king or one of its ministers), with everyone in it.
export async function courtOfReader(courtId: string): Promise<{ court: Court; ministers: Minister[]; isKing: boolean; me: string | null } | null> {
  const court = await getCourt(courtId);
  if (!court) return null;
  const jar = await cookies();
  const isKing = jar.get(OWNER_COOKIE(court.id))?.value === court.ownerToken;
  const me = jar.get(MINISTER_COOKIE(court.id))?.value ?? null;
  const ministers = await listMinisters(court.id);
  if (!isKing && !ministers.some((m) => m.id === me)) return null;
  return { court, ministers, isKing, me };
}
