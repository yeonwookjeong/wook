"use server";

import { searchCelebs, type Hit } from "@/lib/celebs";

// The name search on /star (유명인 궁합): the list stays on the server, only a dozen names come back.
export async function searchStarAction(q: string): Promise<Hit[]> {
  return searchCelebs(String(q ?? "").slice(0, 20));
}
