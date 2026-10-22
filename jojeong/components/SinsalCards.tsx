import Image from "next/image";
import { imageOf, rareText, type Card } from "@/lib/sinsal";

const PLACE = ["해", "달", "날", "시"];

// The cards a chart holds, rarest first, each at full size; more than one scrolls sideways. On the night page
// (components/SinsalNight.tsx): the picture fades into the card, and the words sit on the fade.
export default function SinsalCards({ cards, places, gender }: { cards: Card[]; places: number[][]; gender: "m" | "f" | null }) {
  const many = cards.length > 1;
  return (
    <section className="mt-4">
      <div className={many ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" : ""}>
        {cards.map((c, i) => (
          <article key={c.id} className={`overflow-hidden rounded-2xl bg-[#0a1420] shadow-[0_0_0_1px_rgb(212_175_95/0.4),0_12px_28px_rgb(0_0_0/0.5)] ${many ? "w-[86%] shrink-0 snap-center" : ""}`}>
            <div className="relative">
              <Image src={imageOf(c, gender)} alt={`${c.sal} · ${c.nick}`} width={800} height={1000} priority={i === 0} className="h-auto w-full" />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,rgb(10_20_32/0),#0a1420)]" />
            </div>
            <div className="relative -mt-16 px-5 pb-5 text-center">
              <p className="text-xs font-extrabold text-[#d4af5f]">
                {i === 0 && c.id !== "musal" ? "가장 드문 카드" : c.id === "musal" ? "특별 카드" : "내 카드"}
                {many && ` · ${i + 1}/${cards.length}`}
              </p>
              <h2 className="mt-1 font-myeongjo text-2xl font-extrabold">
                {c.sal} <span className="text-lg text-hanji/70">{c.hanja}</span>
              </h2>
              <p className="mt-0.5 font-bold">{c.nick}</p>
              <p className="mt-0.5 text-[13px] text-hanji/70">{c.line}</p>
              <p className="mt-2 inline-block rounded-full bg-[#d4af5f] px-3 py-1 text-xs font-extrabold text-[#0f2236]">{rareText(c)}</p>
              {places[i].length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-1.5 whitespace-nowrap" aria-label={`태어난 ${places[i].map((k) => PLACE[k]).join("·")} 칸에 있어요`}>
                  <span className="mr-0.5 text-[11px] text-hanji/60">적힌 칸</span>
                  {PLACE.map((label, k) => (
                    <span
                      key={label}
                      className={`rounded-md border px-2.5 py-0.5 text-[12px] ${places[i].includes(k) ? "border-[#d4af5f] bg-[#d4af5f]/15 font-extrabold text-[#d4af5f]" : "border-white/15 text-hanji/40"}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-left text-[14px] leading-relaxed text-hanji/85">{c.body}</p>
            </div>
          </article>
        ))}
      </div>
      {many && <p className="mt-1 text-center text-[12px] text-hanji/60">옆으로 넘겨 {cards.length}장 모두 보세요 →</p>}
    </section>
  );
}
