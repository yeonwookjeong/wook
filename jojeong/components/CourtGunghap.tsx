import type { StepFrom } from "@/lib/nextStep";
import TrackLink from "./TrackLink";

// The game's score, carried straight into the paid 궁합 report (2026-11-16, 대표님 "왕은 유료 상품이랑 연결된 게
// 없나?"): set right beside the score it continues, not only in the shelf at the bottom. The court keeps no birth
// dates, so the report asks for the other person's; the reader's own is offered from this browser if remembered.
export default function CourtGunghap({ from, title, line }: { from: StepFrom; title: string; line: string }) {
  return (
    <TrackLink
      event="to_saju"
      from={from}
      href="/reports/gunghap"
      className="mt-3 flex items-center gap-3 rounded-2xl bg-[#0f2236] px-4 py-3.5 text-left text-hanji shadow-[0_6px_16px_rgb(15_34_54/0.25),inset_0_0_0_1px_rgb(217_180_101/0.4)]"
    >
      <span className="flex size-11 shrink-0 -rotate-3 items-center justify-center border-[3px] border-[#d9b465] font-myeongjo text-lg font-extrabold text-[#d9b465]">合</span>
      <span className="min-w-0 flex-1">
        <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-hanji/70">{line}</span>
      </span>
      <span className="shrink-0 font-myeongjo text-sm font-extrabold text-[#d9b465]">보기 →</span>
    </TrackLink>
  );
}
