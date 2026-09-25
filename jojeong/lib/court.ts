import { matchPillars, type Match, type RoleKey } from "./saju";
import { ROLES } from "./roles";
import type { Court, Minister } from "./store";

export type Seat = { minister: Minister; match: Match; role: RoleKey };

const YEONG_MIN_SCORE = 75;

export function rankCourt(court: Court, ministers: Minister[]): Seat[] {
  const seats: Seat[] = ministers.map((minister) => {
    const match = matchPillars(court.king, minister.pillars);
    return { minister, match, role: match.role };
  });

  const eligible = seats.filter((s) => s.role !== "gansin" && s.role !== "yubae");
  const top = eligible.reduce<Seat | null>((best, s) => (!best || s.match.score > best.match.score ? s : best), null);
  if (top && top.match.score >= YEONG_MIN_SCORE) top.role = "yeong";

  return seats.sort((a, b) => ROLES[a.role].order - ROLES[b.role].order || b.match.score - a.match.score);
}
