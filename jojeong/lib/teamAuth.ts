import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

// The team's read-only addresses (app/api/team/*) open with TEAM_READ_TOKEN as a bearer token.
export const TEAM_HEADERS = { "cache-control": "no-store", "x-robots-tag": "noindex" };

// null: the token is unset, so the address does not exist (404). false: wrong or missing token (401).
export function teamAllowed(request: NextRequest): boolean | null {
  const secret = process.env.TEAM_READ_TOKEN?.trim();
  if (!secret) return null;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  // Both sides hashed first, so the comparison is always 32 bytes and says nothing about the token's length.
  const hash = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(hash(header.slice(7)), hash(secret));
}
