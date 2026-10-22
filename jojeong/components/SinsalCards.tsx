import Image from "next/image";
import { imageOf, rareText, type Card } from "@/lib/sinsal";

const PLACE = ["해", "달", "날", "시"];

// The cards a chart holds, rarest first, each at full size; more than one scrolls sideways.
export default function SinsalCards({ cards, places, gender }: { cards: Card[]; places: number[][]; gender: "m" | "f" | null }) {
  const many = cards.length > 1;
  return (
    <section className="mt-4">
      <div className={many ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" : ""}>
        {cards.map((c, i) => (
          <article key={c.id} className={`doc-paper overflow-hidden ${many ? "w-[86%] shrink-0 snap-center" : ""}`}>
            <Image src={imageOf(c, gender)} alt={`${c.sal} · ${c.nick}`} width={800} height={1000} priority={i === 0} className="h-auto w-full" />
            <div className="px-5 pt-4 pb-5 text-center">
              <p className="text-xs font-extrabold text-seal">
                {i === 0 && c.id !== "musal" ? "가장 드문 카드" : c.id === "musal" ? "특별 카드" : "내 카드"}
                {many && ` · ${i + 1}/${cards.length}`}
              </p>
              <h2 className="mt-1 font-myeongjo text-2xl font-extrabold">
                {c.sal} · <span className="text-xl">{c.hanja}</span>
              </h2>
              <p className="mt-0.5 font-bold">{c.nick}</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">{c.line}</p>
              <p className="mt-2 inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold">{rareText(c)}</p>
              {places[i].length > 0 && (
                <div className="mt-3 flex justify-center gap-1.5" aria-label={`${places[i].map((k) => PLACE[k]).join("·")} 칸에 있어요`}>
                  {PLACE.map((label, k) => (
                    <span key={label} className={`rounded-md border px-2 py-0.5 text-[11px] ${places[i].includes(k) ? "border-seal bg-seal/10 font-extrabold text-seal" : "border-ink/15 text-ink-soft/60"}`}>
                      태어난 {label}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-left text-[14px] leading-relaxed">{c.body}</p>
            </div>
          </article>
        ))}
      </div>
      {many && <p className="mt-1 text-center text-[12px] text-ink-soft">옆으로 넘겨 {cards.length}장 모두 보세요 →</p>}
    </section>
  );
}
