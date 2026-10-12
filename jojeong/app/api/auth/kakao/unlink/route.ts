import { NextResponse, type NextRequest } from "next/server";
import { deleteMember, isKakaoCall } from "@/lib/members";

// Kakao's 연결 끊기 알림: someone cut hundosaju from their Kakao settings, so they leave as from the site's own
// button (lib/members.ts deleteMember). Kakao signs the call with the app's admin key; anything else is ignored.
// Kakao sends it as GET or POST, with user_id in the query or the form.
async function handle(request: NextRequest) {
  if (!isKakaoCall(request.headers.get("authorization"))) return new NextResponse(null, { status: 401 });
  let userId = request.nextUrl.searchParams.get("user_id");
  if (!userId && request.method === "POST") userId = String((await request.formData().catch(() => null))?.get("user_id") ?? "");
  if (userId && /^\d{1,20}$/.test(userId)) await deleteMember(`k${userId}`, false);
  return new NextResponse(null, { status: 200 });
}

export const GET = handle;
export const POST = handle;
