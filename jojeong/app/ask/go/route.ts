import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRoom, loadRoom } from "@/lib/ask";
import { addRoomToMember, currentMember, membersEnabled } from "@/lib/members";
import { CARRY_CHART } from "@/lib/askFlow";
import { decodePerson } from "@/lib/pairToken";

export const dynamic = "force-dynamic";

// "이 장, 정 훈도에게 더 묻기" under a chapter of a bought report (components/AiReport.tsx), and the way back after
// signing in from there: `c` is the report's chart (the token the order holds, name and eight characters, no birth
// date), `draft` the question to bring. A member goes straight into the room on that chart, opened for them if they
// have none yet, the question waiting in the box; a guest lands on /ask with the sign-up box on top (2026-10-25
// 대표님 지시). A plain link, not prefetched, since it may open a room.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const draft = (q.get("draft") ?? "").slice(0, 300);
  // The chart: in the address (from the chapter), or kept in a cookie through signing in (the way back keeps only
  // 200 characters, too few for a chart with its ten-year cycles).
  const c = q.get("c") ?? request.cookies.get(CARRY_CHART)?.value ?? "";
  const chart = c.length <= 600 ? decodePerson(c) : null;
  const to = (path: string, params: Record<string, string>) => {
    const url = new URL(path, request.url);
    for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
    const res = NextResponse.redirect(url, 303);
    res.cookies.delete(CARRY_CHART);
    return res;
  };
  const member = membersEnabled() ? await currentMember() : null;
  if (!member) {
    const res = to("/ask", { draft, from: chart ? "chapter" : "" });
    // Kept for ten minutes, for the sign-in to come back through here (app/ask/page.tsx). Name and eight characters.
    if (chart) res.cookies.set(CARRY_CHART, c, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 600 });
    return res;
  }
  const joined = q.get("joined") ?? "";
  // A chart without gender cannot open a room (the 10-year cycles and the spouse star need it): the member's page.
  if (!chart?.gender) return to("/ask", { draft, joined });
  const rooms = await Promise.all(member.rooms.map(loadRoom));
  const found = rooms.find((r) => r && r.member === member.id && r.me === c);
  if (found) return to(`/ask/${found.id}`, { draft, joined });
  if (member.rooms.length >= 20) return to("/ask", { draft, joined });
  const room = await createRoom(c, member.id);
  await addRoomToMember(member.id, room.id);
  return to(`/ask/${room.id}`, { draft, joined, opened: "1" });
}
