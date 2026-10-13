import "server-only";
import { KAKAO_CHANNEL } from "./members";

// Whether the person signing in with Kakao has added 훈도사주's channel (needs the "카카오톡 채널 추가 상태 및 내역"
// consent, asked at login). Null when Kakao would not say (consent not given, or an error): no question then.
export async function channelAdded(accessToken: string): Promise<boolean | null> {
  const url = new URL("https://kapi.kakao.com/v2/api/talk/channels");
  url.searchParams.set("channel_public_ids", JSON.stringify([KAKAO_CHANNEL]));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as { channels?: { channel_public_id?: string; relation?: string }[] } | null;
  if (!data?.channels) return null;
  return data.channels.some((c) => c.channel_public_id === KAKAO_CHANNEL && c.relation === "ADDED");
}
