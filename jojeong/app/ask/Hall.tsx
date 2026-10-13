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
              <p className="font-myeongjo text-[26px] leading-none tracking-[0.35em] text-[#e2bc68] drop-shadow-[0_1px_0_rgb(0_0_0/0.6)] [padding-left:0.35em]">聽心堂</p>
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
      {glow && <span aria-hidden className="absolute -top-12 -right-12 size-44 rounded-full bg-[radial-gradient(circle,rgb(226_188_104/0.25),transparent_65%)]" />}
      <div className="relative">{children}</div>
    </div>
  );
}

// The gold button of the hall.
export const GOLD_BUTTON =
  "block w-full rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e] disabled:opacity-60";
