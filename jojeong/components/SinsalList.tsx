import { NIGHT_GOLD, NIGHT_PANEL } from "@/components/SinsalNight";
import { BOOK, per100, rareText, type SinsalId } from "@/lib/sinsal";

const ORDER = [...BOOK].sort((a, b) => per100(b.id) - per100(a.id));
const MAX = per100(ORDER[0].id);

// All 20 살, commonest first, each with its share of births; the reader's own in gold. A row opens to the card's words.
export default function SinsalList({ mine }: { mine?: Set<SinsalId> }) {
  return (
    <section className={`${NIGHT_PANEL} mt-5 px-3 py-5`}>
      <h2 className="text-center font-myeongjo text-lg font-extrabold">
        20가지 살, <span className={NIGHT_GOLD}>100명 중 몇 명</span>
      </h2>
      <p className="mt-1 text-center text-[12px] text-hanji/60">한 사람이 여러 살을 가져서 다 더하면 100이 넘어요.</p>
      <ul className="mt-3 flex flex-col gap-1">
        {ORDER.map((c) => {
          const on = mine?.has(c.id) ?? false;
          return (
            <li key={c.id}>
              <details className={`group rounded-lg px-2 py-1.5 ${on ? "bg-[#d4af5f]/15 ring-1 ring-[#d4af5f]/70" : ""}`}>
                <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <span className={`w-[6.2rem] shrink-0 text-[13px] font-bold ${on ? NIGHT_GOLD : ""}`}>
                    {c.sal}
                    {on && " · 나"}
                  </span>
                  <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className={`absolute inset-y-0 left-0 rounded-full ${on ? "bg-[#d4af5f]" : "bg-hanji/45"}`} style={{ width: `${Math.max(2, (per100(c.id) / MAX) * 100)}%` }} />
                  </span>
                  <span className="w-[6.6rem] shrink-0 text-right text-[11.5px] text-hanji/75 tabular-nums">{rareText(c).replace(" 약 ", " ")}</span>
                </summary>
                <div className="mt-1.5 pb-1 pl-1 text-[12.5px] leading-relaxed text-hanji/85">
                  <p className="font-bold">
                    {c.nick} <span className="font-normal text-hanji/65">· {c.line}</span>
                  </p>
                  <p className="mt-0.5">{c.body}</p>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-center text-[11.5px] text-hanji/50">줄을 누르면 그 살 이야기가 펼쳐져요.</p>
    </section>
  );
}
