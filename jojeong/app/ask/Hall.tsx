import Image from "next/image";

// 청심당 (聽心堂), the hall where 정 훈도 hears the guest: the night-blue card with a faint paper-window lattice and a
// warm glow, headed by its 현판. Shared by the home's card (app/HomeV2.tsx) and the hall's own page (app/ask).

// The 현판: a wide dark board with the name carved in gold, held in a 단청 frame (red, green, gold).
export function Plaque({ caption = "청심당 · 마음을 듣는 정 훈도의 사랑방" }: { caption?: string }) {
  return (
    <div className="relative mx-auto w-fit">
      <div className="rounded-[3px] bg-[#7a2a1f] p-[3px] shadow-[0_8px_16px_rgb(0_0_0/0.35)]">
        <div className="rounded-[2px] bg-[#2f6b5a] p-[2px]">
          <div className="rounded-[1px] bg-[#d4af5f] p-px">
            <div className="bg-[linear-gradient(180deg,#2a2016,#1d160f)] [background-image:repeating-linear-gradient(90deg,rgb(255_255_255/0.025)_0_2px,transparent_2px_7px),linear-gradient(180deg,#2a2016,#1d160f)] px-7 pt-2 pb-1.5 text-center">
              <p className="font-myeongjo text-[26px] leading-none tracking-[0.35em] text-[#e2bc68] drop-shadow-[0_1px_0_rgb(0_0_0/0.6)] [padding-left:0.35em]">
                聽心堂
              </p>
            </div>
          </div>
        </div>
      </div>
      {caption && <p className="relative mt-2 text-center text-[10.5px] font-bold tracking-[0.12em] text-[#e2bc68]/75">{caption}</p>}
    </div>
  );
}

export function Hall({ children, className = "", glow = true }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#222d3b] to-[#1a232f] px-5 py-5 text-hanji shadow-[0_8px_22px_rgb(33_27_23/0.18),inset_0_0_0_1px_rgb(212_175_95/0.35)] ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#e2bc68_1px,transparent_1px),linear-gradient(90deg,#e2bc68_1px,transparent_1px)] [background-size:28px_28px]"
      />
      {glow && (
        <span aria-hidden className="absolute -top-12 -right-12 size-44 rounded-full bg-[radial-gradient(circle,rgb(226_188_104/0.25),transparent_65%)]" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// The gold button of the hall.
export const GOLD_BUTTON =
  "block w-full rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e] disabled:opacity-60";

// The room itself (app/ask/[id]): night-blue walls with the paper window's lattice glowing at the top, then the
// warm wooden floor the letters are laid on. Full width of the column; the question bar sits at its foot.
export function Room({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-4 min-h-[70vh] overflow-clip bg-[linear-gradient(180deg,#1b2430_0,#222c38_260px,#2c2219_460px,#231b14_100%)] px-4 pt-0 pb-0 text-hanji">
      {/* 창호: the lattice of the paper window behind the plaque, lit from outside */}
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-[300px] rounded-b-[40px] opacity-[0.12] [background-image:linear-gradient(#e2bc68_1.5px,transparent_1.5px),linear-gradient(90deg,#e2bc68_1.5px,transparent_1.5px)] [background-size:34px_44px]"
      />
      <span
        aria-hidden
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(226_188_104/0.22),transparent_65%)]"
      />
      {/* 마루: floor boards below */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-[440px] bottom-0 opacity-60 [background-image:repeating-linear-gradient(90deg,rgb(0_0_0/0.22)_0_1px,transparent_1px_72px),repeating-linear-gradient(180deg,rgb(255_255_255/0.025)_0_1px,transparent_1px_9px)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// The front of the hall (app/ask): a tiled roof with upturned eaves, the plaque under them, two red pillars and
// the paper doors between them lit from inside. Full width of the column; what is inside sits on the doors.
export function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-4 overflow-clip bg-[linear-gradient(180deg,#141a22_0,#1b2430_180px,#222c38_100%)] text-hanji">
      {/* the night sky and a moon behind the roof */}
      <span aria-hidden className="absolute top-6 right-10 size-10 rounded-full bg-[#f3e1b0]/80 shadow-[0_0_40px_10px_rgb(243_225_176/0.25)]" />
      <svg aria-hidden viewBox="0 0 400 130" className="relative block w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="giwa" width="9" height="20" patternUnits="userSpaceOnUse">
            <rect width="9" height="20" fill="#232a33" />
            <rect x="0" width="4.5" height="20" fill="#2c3540" />
          </pattern>
        </defs>
        {/* 용마루 (ridge) and the roof falling to upturned eaves */}
        <path d="M70 46 Q200 26 330 46 L330 52 Q200 33 70 52 Z" fill="#11161c" />
        <path d="M70 50 Q200 31 330 50 L392 92 Q398 80 400 72 L400 104 Q200 70 0 104 L0 72 Q2 80 8 92 Z" fill="url(#giwa)" />
        <path d="M0 104 Q200 70 400 104 L400 112 Q200 79 0 112 Z" fill="#7a2a1f" />
        <path d="M0 112 Q200 79 400 112 L400 116 Q200 84 0 116 Z" fill="#2f6b5a" />
        <path d="M0 116 Q200 84 400 116 L400 118 Q200 87 0 118 Z" fill="#d4af5f" opacity="0.8" />
      </svg>
      {/* 기둥 */}
      <span aria-hidden className="absolute top-[22%] bottom-0 left-3 w-3 bg-[linear-gradient(90deg,#5e1f17,#8a3326,#5e1f17)]" />
      <span aria-hidden className="absolute top-[22%] right-3 bottom-0 w-3 bg-[linear-gradient(90deg,#5e1f17,#8a3326,#5e1f17)]" />
      {/* 창호: paper doors lit from inside */}
      <span
        aria-hidden
        className="absolute inset-x-8 top-[30%] bottom-0 bg-[radial-gradient(ellipse_at_50%_30%,rgb(243_225_176/0.16),transparent_70%)] opacity-90 [background-image:linear-gradient(rgb(226_188_104/0.16)_1.5px,transparent_1.5px),linear-gradient(90deg,rgb(226_188_104/0.16)_1.5px,transparent_1.5px),radial-gradient(ellipse_at_50%_30%,rgb(243_225_176/0.16),transparent_70%)] [background-size:30px_40px,30px_40px,100%_100%]"
      />
      <div className="relative -mt-3 px-8 pb-7">{children}</div>
    </div>
  );
}

// A section of the hall's floor, below the gate: dark wood with board lines.
export function Floor({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative -mx-4 bg-[#241c15] px-4 py-7 text-hanji [background-image:repeating-linear-gradient(90deg,rgb(0_0_0/0.22)_0_1px,transparent_1px_72px),repeating-linear-gradient(180deg,rgb(255_255_255/0.025)_0_1px,transparent_1px_9px)] ${className}`}
    >
      {children}
    </div>
  );
}

// 청심당 inside, as drawn (public/cards/sarangbang.webp: 정 훈도 at his desk, the star screen, the moonlit doors):
// the picture with the plaque over its ceiling beams, fading into the night blue where `children` sit.
// `short`: a wide crop of him at the desk, with no plaque, as the head of a room (app/ask/[id]).
// `corner`: laid over the picture's top left (the way back, in a room).
export function RoomArt({ children, short = false, caption, corner }: { children?: React.ReactNode; short?: boolean; caption?: string; corner?: React.ReactNode }) {
  return (
    <div className="relative -mx-4 overflow-clip bg-[#1b2430] text-hanji">
      <div className={`relative ${short ? "aspect-[5/4]" : "aspect-[1122/1402]"}`}>
        <Image
          src="/cards/sarangbang.webp"
          alt="정 훈도가 사랑방 서안 앞에 앉아 그대를 맞는 모습"
          fill
          priority
          sizes="440px"
          className={`object-cover ${short ? "object-[50%_52%]" : ""}`}
        />
        <span aria-hidden className={`absolute inset-x-0 top-0 bg-gradient-to-b to-transparent ${short ? "h-14 from-[#141a22]/45" : "h-28 from-[#141a22]/85"}`} />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#1b2430]" />
        {corner && <div className="absolute top-3 left-4 z-10">{corner}</div>}
        {!short && (
          <div className="absolute inset-x-0 top-3 flex justify-center">
            <Plaque caption={caption} />
          </div>
        )}
      </div>
      {children && <div className="relative -mt-14 px-6 pb-7">{children}</div>}
    </div>
  );
}
