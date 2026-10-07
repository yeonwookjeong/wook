import { CHARACTER } from "@/lib/brand";

// The English front page's hero, built like the Korean one (components/Hero.tsx): the Sun, Moon and Five Peaks
// folding screen that stood behind every Joseon throne (public/irworobongdo.svg), the name on a lacquered palace
// signboard (현판), and Hundo bowing from the corner. `compact` is the shorter strip for inner pages.
export default function EnHero({ compact = false, title = "HUNDO SAJU", line = "The Joseon court read its fate. Now read yours." }: { compact?: boolean; title?: string; line?: string }) {
  return (
    <header className="relative mt-4 overflow-hidden rounded-3xl shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <div className={`relative ${compact ? "h-[200px]" : "h-[340px]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irworobongdo.svg" alt="" width={390} height={340} className={`absolute inset-0 size-full object-cover ${compact ? "object-[center_52%]" : "object-bottom"}`} />
        <div className={`absolute inset-x-0 top-0 flex flex-col items-center text-center ${compact ? "pt-4" : "pt-6"}`}>
          <p className="text-[10.5px] font-bold tracking-[0.25em] text-[#f3ead0]/85">KOREAN FOUR PILLARS OF DESTINY</p>
          {/* 현판: black lacquer board, gold rim and gilded letters */}
          <div className="mt-2 rounded-[6px] border-[3px] border-[#b8862f] bg-[#1c1712] p-[3px] shadow-[0_6px_14px_rgb(0_0_0/0.45)]">
            <div className="rounded-[3px] border border-[#e2bc68]/70 px-5 py-1.5">
              <p className={`font-myeongjo leading-tight font-extrabold tracking-[0.14em] text-[#f1cf7a] ${compact ? "text-[20px]" : "text-[26px]"}`}>{title}</p>
            </div>
          </div>
          {line && <p className="mt-2 px-6 font-myeongjo text-[13.5px] font-bold text-[#f3ead0] drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">{line}</p>}
        </div>
        {!compact && (
          <>
            <a
              href="#read"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#e2bc68] bg-seal px-5 py-2.5 font-myeongjo text-[15px] font-extrabold whitespace-nowrap text-hanji shadow-[0_4px_0_#7d1a14]"
            >
              Read my four pillars ↓
            </a>
            {/* Hundo, bowing in the corner */}
            <div className="absolute right-3 bottom-16 size-14 overflow-hidden rounded-full border-2 border-[#d9ad52] bg-[#f7efd9] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CHARACTER.bow} alt="Hundo bowing in greeting" width={56} height={56} className="size-full origin-bottom scale-[1.18] object-cover" />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
