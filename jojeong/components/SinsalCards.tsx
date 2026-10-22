import Image from "next/image";
import { imageOf, rareText, type Card } from "@/lib/sinsal";
import { moreOf } from "@/lib/sinsalMore";

const PLACE = ["해", "달", "날", "시"];

// The cards a chart holds, rarest first, each at full size; more than one scrolls sideways. On the night page
// (components/SinsalNight.tsx): the picture fades into the card, and the words sit on the fade.
export default function SinsalCards({ cards, places, gender }: { cards: Card[]; places: number[][]; gender: "m" | "f" | null }) {
  const many = cards.length > 1;
  return (
    <section className="mt-4">
      <div className={many ? "-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" : ""}>
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
              <More c={c} />
            </div>
          </article>
        ))}
      </div>
      {many && <p className="mt-1 text-center text-[12px] text-hanji/60">옆으로 넘겨 {cards.length}장 모두 보세요 →</p>}
    </section>
  );
}

// "더 알아보기": folded under the card, the 살's name, how it is found, and how it reads (lib/sinsalMore.ts).
function More({ c }: { c: Card }) {
  const m = moreOf(c.id);
  const tier = m.tier?.[c.id];
  const row = (label: string, text: string) => (
    <div className="flex gap-2">
      <dt className="w-[4.2rem] shrink-0 font-bold text-[#d4af5f]">{label}</dt>
      <dd className="min-w-0 flex-1">{text}</dd>
    </div>
  );
  return (
    <details className="group mt-4 border-t border-white/10 pt-3 text-left">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-[13px] font-extrabold text-[#d4af5f] [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">더 알아보기 ▾</span>
        <span className="hidden group-open:inline">접기 ▴</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3 text-[13px] leading-relaxed text-hanji/85">
        <p>{m.name}</p>
        <div className="rounded-xl bg-white/[0.05] px-3 py-2.5">
          <p className="text-[12px] font-extrabold text-[#d4af5f]">
            {c.id === "musal" ? "읽는 법" : "찾는 법"} {m.sure ? "" : "⚖️"}
          </p>
          <p className="mt-1">{m.find}</p>
          {m.table && (
            <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 font-bold text-hanji">
              {m.table.split(" / ").map((t) => (
                <li key={t} className={m.table!.includes(" / ") ? "" : "col-span-2"}>
                  {t}
                </li>
              ))}
            </ul>
          )}
          {m.note && <p className="mt-1.5 text-[11.5px] text-hanji/55">{m.note}</p>}
        </div>
        {tier && <p className="font-bold">{tier}</p>}
        <dl className="flex flex-col gap-1.5">
          {row("잘 풀릴 때", m.good)}
          {row("조심할 때", m.care)}
          {row("일", m.life[0])}
          {row("사랑", m.life[1])}
          {row("돈", m.life[2])}
          {m.people && row("사람 사이", m.people)}
        </dl>
        <p className="text-[11.5px] text-hanji/50">살 하나만 본 것이라, 다른 칸과 어떻게 어울리느냐에 따라 결이 달라져요. ⚖️ 표시는 학파나 책마다 보는 법이 다른 것이에요.</p>
      </div>
    </details>
  );
}
