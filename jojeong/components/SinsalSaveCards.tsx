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
        <span style={{ color: GOLD }}>신살 도감 {count}/20</span>
      </div>
      <div className="doc-paper mx-auto mt-2.5 flex min-h-0 w-[92%] flex-1 flex-col overflow-hidden text-center text-ink">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
        <img src={imageOf(head, gender)} alt="" className="min-h-0 w-full flex-1 object-cover object-top" />
        <div className="px-2 pt-2 pb-2.5">
          <p className="text-[11px] text-ink-soft">{name}님의 가장 드문 카드</p>
          <p className="font-myeongjo text-[19px] leading-tight font-extrabold">
            {head.sal} · {head.nick}
          </p>
          <p className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${GOLD}55` }}>
            {rareText(head)}
          </p>
          {rest.length > 0 && (
            <div className="mt-1.5">
              <Others cards={rest} gender={gender} size={30} />
              <p className="mt-1 text-[10.5px] text-ink-soft">
                함께 적힌 살 · {rest.slice(0, 4).map((c) => c.sal).join(", ")}
                {rest.length > 4 && ` 외 ${rest.length - 4}`}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
        <img src="/hundo-face.png" alt="" className="size-10 shrink-0 rounded-full border-[3px] bg-hanji object-cover" style={{ borderColor: GOLD }} />
        <p className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug font-bold text-ink">너는 20장 중 몇 장이야?</p>
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
        <p className="text-[12px] opacity-85">{name}님의 가장 드문 카드</p>
        <p className="mt-1 font-myeongjo text-[30px] leading-tight font-extrabold">{head.sal}</p>
        <p className="font-myeongjo text-[16px] font-extrabold" style={{ color: GOLD }}>
          {head.nick}
        </p>
        <p className="mt-2.5">
          <span className="inline-block rounded-full px-3 py-1 text-[11px] font-extrabold text-[#0f2236]" style={{ background: GOLD }}>
            {rareText(head)}
          </span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Others cards={[head, ...rest]} gender={gender} size={28} />
          <span className="text-[13px] font-extrabold">
            {count} / 20
          </span>
        </div>
        <p className="mt-3 text-[11px] font-extrabold" style={{ color: GOLD }}>
          훈도사주 · 신살 도감
        </p>
      </div>
    </div>
  );
}
