import { NIGHT_GOLD, NIGHT_PANEL } from "@/components/SinsalNight";
import type { Pillars } from "@/lib/saju";
import { comboPer100, makeupOf, rareOf, rareText, type Card } from "@/lib/sinsal";
import { moreOf } from "@/lib/sinsalMore";

// Shades for the 살 in the makeup bar, the largest first.
const SHADES = ["#d4af5f", "#e8cf8f", "#9fb8d6", "#6f8fb5", "#c98f6b", "#8fb59a", "#b59ad0", "#d6d0c0", "#7a8a9a", "#a8746a"];

// The head of the 신살 result: the type (the rarest card's nickname), how rare it and the whole set are, how the
// 살 share the chart, and when the type shines or slips (lib/sinsalMore.ts as written, no new reading).
export default function SinsalType({ name, head, rest, pillars }: { name: string; head: Card; rest: Card[]; pillars: Pillars }) {
  const cards = [head, ...rest];
  const makeup = makeupOf(pillars, cards);
  const combo = head.id === "musal" ? null : comboPer100(cards.map((c) => c.id), pillars.hourBranch === null);
  const m = moreOf(head.id);
  const row = (label: string, text: string) => (
    <div className="flex gap-2">
      <dt className={`w-[4.6rem] shrink-0 font-bold ${NIGHT_GOLD}`}>{label}</dt>
      <dd className="min-w-0 flex-1">{text}</dd>
    </div>
  );
  return (
    <>
      <section className="pt-6 text-center">
        <p className={`font-myeongjo text-sm font-extrabold tracking-[0.3em] ${NIGHT_GOLD}`}>神 煞 · 살 유형</p>
        <p className="mt-3 text-[14px] text-hanji/80">{name}님은</p>
        <h1 className="mt-1 font-myeongjo text-[32px] leading-tight font-extrabold">{head.nick}</h1>
        <p className="mt-1 text-[14px] text-hanji/80">
          {head.sal} <span className="text-hanji/55">{head.hanja}</span> · {head.line}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full bg-[#d4af5f] px-3 py-1 text-xs font-extrabold text-[#0f2236]">이 유형 {rareText(head)}</span>
          {combo !== null && <span className="rounded-full border border-[#d4af5f]/60 px-3 py-1 text-xs font-extrabold text-[#d4af5f]">살 조합까지 같은 사람 {rareOf(combo)}</span>}
        </div>
      </section>

      {makeup.length > 0 && (
        <section className={`${NIGHT_PANEL} mt-5 px-4 py-4`}>
          <h2 className="text-center font-myeongjo text-[17px] font-extrabold">
            {name}님의 살 구성 <span className={NIGHT_GOLD}>{makeup.length}가지</span>
          </h2>
          <div className="mt-3 flex h-4 overflow-hidden rounded-full" role="img" aria-label={makeup.map((r) => `${r.card.sal} ${r.pct}%`).join(", ")}>
            {makeup.map((r, i) => (
              <span key={r.card.id} style={{ width: `${r.pct}%`, background: SHADES[i % SHADES.length] }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
            {makeup.map((r, i) => (
              <li key={r.card.id} className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: SHADES[i % SHADES.length] }} />
                <span className="min-w-0 flex-1 truncate">{r.card.sal}</span>
                <b className="tabular-nums">{r.pct}%</b>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-white/10 pt-3 text-center text-[13.5px] leading-relaxed text-hanji/90">
            {makeup.map((r) => r.card.line).join(" · ")}
          </p>
          <p className="mt-2 text-center text-[11.5px] text-hanji/50">살이 적힌 칸 수로 나눈 비중이에요.</p>
        </section>
      )}

      <section className={`${NIGHT_PANEL} mt-4 px-4 py-4`}>
        <h2 className="text-center font-myeongjo text-[17px] font-extrabold">이 유형의 결</h2>
        <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-hanji/90">
          {row("이럴 때 빛나요", m.good)}
          {row("조심할 때", m.care)}
          {row("일", m.life[0])}
          {row("인연", m.life[1])}
          {row("돈", m.life[2])}
        </dl>
      </section>
    </>
  );
}
