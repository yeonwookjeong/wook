import TrackLink from "./TrackLink";

// A step from the Joseon game into 훈도사주, set right where the game makes one curious ("태양형 군주라는데, 진짜
// 사주로는?"): always a free page (the free analysis, the year's verdict and months), whose paid report comes only
// after what is free. Counted as "게임 → 사주" on the owner's dashboard.
export default function GameBridge({ href, seal, kicker, title, line }: { href: string; seal: string; kicker: string; title: string; line: string }) {
  return (
    <TrackLink event="to_saju" href={href} className="doc-paper mt-4 flex items-center gap-4 px-5 py-4">
      <span
        className={`flex size-14 shrink-0 -rotate-3 items-center justify-center border-[3px] border-seal font-myeongjo font-extrabold text-seal ${seal.length > 2 ? "text-sm" : "text-xl"}`}
      >
        {seal}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-extrabold text-seal">{kicker}</span>
        <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{line}</span>
      </span>
      <span className="shrink-0 font-myeongjo text-sm font-extrabold text-seal">무료 →</span>
    </TrackLink>
  );
}
