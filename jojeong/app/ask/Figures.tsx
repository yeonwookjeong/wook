import { elName, type Figures } from "@/lib/askFigures";
import { ELEMENT_HANJA } from "@/lib/myeongri";

// The pictures in an answer letter (lib/askFigures.ts): the chart with this question's characters lit, the five
// elements, and the months ahead. Plain boxes, so they also come out in the saved letter image.

const EL_COLOR = ["#3f7d4e", "#b3261e", "#a07a2c", "#5f6670", "#24395a"];
const MARK = ["✕", "△", "○", "◎"];
const MARK_WORD = ["버팀", "조심", "무난", "좋음"];

function Frame({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="my-4 rounded-xl border border-seal/20 bg-white/45 px-3.5 pt-3 pb-3 font-sans">
      <figcaption className="text-[11px] font-bold tracking-[0.12em] text-seal">{title}</figcaption>
      <div className="mt-2">{children}</div>
      {note && <p className="mt-2 text-[11.5px] leading-snug text-ink-soft">{note}</p>}
    </figure>
  );
}

function Cell({ c }: { c: { ch: string; el: number; lit: boolean } | null }) {
  if (!c) return <span className="grid h-12 place-items-center rounded-lg border border-dashed border-ink/15 text-[11px] text-ink-soft">모름</span>;
  return (
    <span
      className={`relative grid h-12 place-items-center rounded-lg font-myeongjo text-[24px] leading-none ${c.lit ? "bg-[#d4af5f]/25 ring-2 ring-[#d4af5f]" : "bg-hanji/70"}`}
      style={{ color: EL_COLOR[c.el] }}
    >
      {c.ch}
      {c.lit && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[#d4af5f] px-1 text-[9px] font-bold text-white">★</span>}
    </span>
  );
}

export function ChartFigure({ f }: { f: Figures }) {
  const lit = f.chart.reduce((n, c) => n + (c.stem?.lit ? 1 : 0) + (c.branch?.lit ? 1 : 0), 0);
  return (
    <Frame
      title="그대의 여덟 글자 · 이 질문이 닿는 곳"
      note={
        f.starEl === null ? undefined : (
          <>
            ★ {f.star} = {elName(f.starEl)} 기운 · 여덟 글자 중 <b className="text-ink">{lit}개</b>
            {lit === 0 && " (사주에 없으니 들어오는 해와 달에 움직여요)"}
            {f.seat && <> · 테두리는 {f.seat}</>}
          </>
        )
      }
    >
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {f.chart.map((c) => (
          <div key={c.pos} className={`flex flex-col gap-1 rounded-xl p-1 ${c.seat ? "outline-2 outline-seal/60 outline-dashed" : ""}`}>
            <span className="text-[10.5px] text-ink-soft">
              {c.pos === "일" ? "나(일)" : c.pos}
              {c.seat && <b className="block text-[10px] text-seal">{c.seat}</b>}
            </span>
            <Cell c={c.stem} />
            <Cell c={c.branch} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function ElementsFigure({ f }: { f: Figures }) {
  const max = Math.max(...f.elements.map((e) => e.n), 1);
  return (
    <Frame title="그대 안의 다섯 기운" note={f.starEl === null ? undefined : <>★ 표시가 이 질문에 쓰이는 기운({f.star})이에요</>}>
      <ul className="flex flex-col gap-1.5">
        {f.elements.map((e) => (
          <li key={e.el} className="flex items-center gap-2 text-[12px]">
            <span className="w-11 shrink-0 font-myeongjo font-bold" style={{ color: EL_COLOR[e.el] }}>
              {ELEMENT_HANJA[e.el]} {["목", "화", "토", "금", "수"][e.el]}
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-ink/6">
              <span className="block h-full rounded-full" style={{ width: `${(e.n / max) * 100}%`, background: EL_COLOR[e.el], opacity: e.n ? 0.85 : 0 }} />
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums">
              {e.n}개{e.el === f.starEl && <b className="ml-0.5 text-[#b8902f]">★</b>}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function MonthsFigure({ f }: { f: Figures }) {
  return (
    <Frame
      title="다가올 여섯 달"
      note={<>◎ 좋음 · ○ 무난 · △ 조심 · ✕ 버팀{f.starEl !== null && <> · ★ {f.star}이 드는 달</>} · 날짜는 그 달이 시작되는 절기</>}
    >
      <ol className="grid grid-cols-6 items-start gap-1 text-center">
        {f.months.map((m) => (
          <li key={m.label + m.from} className="flex flex-col items-center">
            <span className="h-3 text-[10px] text-[#b8902f]">{m.star ? "★" : ""}</span>
            <span className="flex h-[60px] w-full items-end">
              <span
                className={`flex w-full flex-col justify-end rounded-t-md ${m.rating >= 2 ? "bg-seal/80" : "bg-ink/20"}`}
                style={{ height: `${18 + m.rating * 14}px` }}
                aria-label={MARK_WORD[m.rating]}
              >
                <span className={`pb-0.5 text-[12px] font-bold ${m.rating >= 2 ? "text-hanji" : "text-ink"}`}>{MARK[m.rating]}</span>
              </span>
            </span>
            <span className={`mt-1 text-[11px] leading-tight ${m.now ? "font-extrabold text-seal" : ""}`}>
              {m.label}
              {m.now && <span className="block text-[9.5px]">이번 달</span>}
            </span>
            <span className="text-[9.5px] text-ink-soft">{m.from}~</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
