import { imageOf, rareText, type Card } from "@/lib/sinsal";

// The two cards a reader keeps from the 신살 도감 (drawn into PNGs by components/SinsalShare.tsx): 4:5 for a feed
// or a chat, 9:16 for a story. The result only: never the birth date or the eight characters.
const GOLD = "#d4af5f";

function Others({ cards, gender, size }: { cards: Card[]; gender: "m" | "f" | null; size: number }) {
  if (!cards.length) return null;
  return (
    <div className="flex items-center justify-center gap-1.5">
      {cards.slice(0, 4).map((c) => (
        // eslint-disable-next-line @next/next/no-img-element -- drawn into an image
        <img key={c.id} src={imageOf(c, gender)} alt={c.sal} width={size} height={size * 1.25} className="rounded object-cover object-top" style={{ width: size, height: size * 1.25, outline: `2px solid ${GOLD}` }} />
      ))}
      {cards.length > 4 && <span className="text-[11px] font-bold">+{cards.length - 4}</span>}
    </div>
  );
}

// The other 살 the chart holds: their small pictures and their names.
function With({ cards, gender, size }: { cards: Card[]; gender: "m" | "f" | null; size: number }) {
  return (
    <div className="mt-2">
      <Others cards={cards} gender={gender} size={size} />
      <p className="mt-1 text-[11px] text-hanji/85">
        함께 적힌 살 · {cards.slice(0, 4).map((c) => c.sal).join(", ")}
        {cards.length > 4 && ` 외 ${cards.length - 4}`}
      </p>
    </div>
  );
}

export function SinsalCardA({ name, head, rest, count, gender }: { name: string; head: Card; rest: Card[]; count: number; gender: "m" | "f" | null }) {
  return (
    <div className="flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#0f2236,#17304a_55%,#1f3d5c)] p-3.5 text-hanji">
      <div className="flex items-center justify-between px-1 text-[11px] font-extrabold">
        <span className="flex items-center gap-1.5">
          <span className="grid size-6 -rotate-3 place-items-center border-2 border-seal bg-hanji text-[8px] leading-none text-seal">
            訓<br />導
          </span>
          훈도사주
        </span>
        <span style={{ color: GOLD }}>신살 유형 · {count}가지 살</span>
      </div>
      {/* The picture fills the frame (it is near 4:5 itself, so little is cut); the words sit on its dark foot. */}
      <div className="relative mx-auto mt-2.5 min-h-0 w-full flex-1 overflow-hidden rounded-xl" style={{ boxShadow: `0 0 0 1.5px ${GOLD}99` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
        <img src={imageOf(head, gender)} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#0a142000,#0a1420eb_45%)] px-3 pt-9 pb-2.5 text-center">
          <p className="text-[10px] text-hanji/75">{name}님의 살 유형</p>
          <p className="font-myeongjo text-[21px] leading-tight font-extrabold">{head.nick}</p>
          <p className="text-[11px] font-bold" style={{ color: GOLD }}>
            {head.sal} · {head.line}
          </p>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 text-[10px] text-hanji/85">
            <span className="rounded-full px-2 py-px font-extrabold text-[#0f2236]" style={{ background: GOLD }}>
              {rareText(head)}
            </span>
            {rest.length > 0 && (
              <span>
                함께 적힌 살 · {rest.slice(0, 3).map((c) => c.sal).join(", ")}
                {rest.length > 3 && ` 외 ${rest.length - 3}`}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
        <img src="/hundo-face.png" alt="" className="size-10 shrink-0 rounded-full border-[3px] bg-hanji object-cover" style={{ borderColor: GOLD }} />
        <p className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug font-bold text-ink">너는 무슨 유형이야?</p>
        <span className="shrink-0 text-[10px] tracking-wider text-hanji/80">hundosaju.com</span>
      </div>
    </div>
  );
}

export function SinsalCardB({ name, head, rest, count, gender }: { name: string; head: Card; rest: Card[]; count: number; gender: "m" | "f" | null }) {
  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[#0f2236] text-hanji">
      {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
      <img src={imageOf(head, gender)} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#0f223600,#0f2236f0_38%)] px-5 pt-24 pb-6 text-center">
        <p className="text-[12px] opacity-85">{name}님의 살 유형</p>
        <p className="mt-1 font-myeongjo text-[32px] leading-tight font-extrabold">{head.nick}</p>
        <p className="font-myeongjo text-[15px] font-extrabold" style={{ color: GOLD }}>
          {head.sal} · {head.line}
        </p>
        <p className="mt-2.5">
          <span className="inline-block rounded-full px-3 py-1 text-[11px] font-extrabold text-[#0f2236]" style={{ background: GOLD }}>
            {rareText(head)}
          </span>
        </p>
        {rest.length > 0 && <With cards={rest} gender={gender} size={30} />}
        <p className="mt-2 text-[13px] font-extrabold">20가지 살 유형 중 · {count}가지 살</p>
        <p className="mt-3 text-[11px] font-extrabold" style={{ color: GOLD }}>
          훈도사주 · 신살 유형 테스트
        </p>
      </div>
    </div>
  );
}
