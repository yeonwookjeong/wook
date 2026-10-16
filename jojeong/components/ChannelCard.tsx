import { CHANNEL_GIFT, CHANNEL_GIFT_ON, currentMember, KAKAO_CHANNEL, membersEnabled } from "@/lib/members";
import type { ChFrom } from "@/lib/stats";
import ChannelLink from "./ChannelLink";

// 훈도사주's KakaoTalk channel, for everyone (no sign-in needed): good days and new reports by KakaoTalk. A Kakao
// member who has not had the channel gift is sent to it (/ask#channel); one who has, sees nothing.
export default async function ChannelCard({ from }: { from: ChFrom }) {
  const member = membersEnabled() ? await currentMember().catch(() => null) : null;
  if (member?.channel) return null;
  const gift = CHANNEL_GIFT_ON && member?.id.startsWith("k");
  return (
    <ChannelLink
      from={from}
      href={gift ? "/ask#channel" : `https://pf.kakao.com/${KAKAO_CHANNEL}/friend`}
      className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FEE500] px-4 py-3.5 text-[#191919]"
    >
      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#191919] text-[18px] text-[#FEE500]">
        💬
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-snug">{gift ? `카카오톡 채널 추가하고 질문 ${CHANNEL_GIFT}개 더 받기` : "카카오톡 채널 추가하기"}</b>
        <span className="mt-0.5 block text-[12px] opacity-75">좋은 날 알림과 새 보고서 소식을 카톡으로 받아요</span>
      </span>
      <span className="shrink-0 text-[15px] font-extrabold">+</span>
    </ChannelLink>
  );
}
