import { NextResponse, type NextRequest } from "next/server";
import { MEMBER_COOKIE } from "@/lib/members";

// Signs the member out of this browser (the account and what it holds stay).
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/", request.url), 303);
  res.cookies.delete(MEMBER_COOKIE);
  return res;
}
