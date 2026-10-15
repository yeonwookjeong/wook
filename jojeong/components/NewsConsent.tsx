import { newsAction } from "@/app/ask/actions";
import { newsToAsk, type Member } from "@/lib/members";

// 소식 받기, for members: asked once as a plain choice (nothing ticked for them), then a quiet line to change it.
export default function NewsConsent({ member }: { member: Member }) {
  if (newsToAsk(member))
    return (
      <form action={newsAction} className="mt-4 rounded-xl border border-hanji/20 bg-hanji/5 px-3.5 py-3 text-center text-[13px] leading-relaxed">
        <b className="block font-myeongjo text-[14.5px]">훈도사주 소식을 받아 보시겠어요? (선택)</b>
        <span className="block text-[12px] text-hanji/70">새 보고서, 좋은 날 알림, 이벤트 같은 광고성 소식이에요. 언제든 끌 수 있어요.</span>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button name="on" value="1" className="rounded-lg bg-[#e2bc68] py-2.5 text-[13px] font-extrabold text-[#191919]">
            소식 받을게요
          </button>
          <button name="on" value="0" className="rounded-lg border border-hanji/30 py-2.5 text-[13px] font-bold">
            괜찮아요
          </button>
        </div>
      </form>
    );
  const on = member.news!.on;
  return (
    <form action={newsAction} className="mt-6 text-center text-[11.5px] text-hanji/60">
      소식 받기 {on ? "켜짐" : "꺼짐"} ·{" "}
      <button name="on" value={on ? "0" : "1"} className="underline">
        {on ? "그만 받기" : "받기"}
      </button>
    </form>
  );
}
