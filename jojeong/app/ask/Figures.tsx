import { Cell } from "@/components/SajuChart";
import type { Figures } from "@/lib/askFigures";
import { BRANCH_EL, ELEMENT_HANJA, ELEMENT_KO, stemEl } from "@/lib/myeongri";
import { BRANCHES, STEMS } from "@/lib/saju";

// The pictures in an answer letter (lib/askFigures.ts), drawn as the reports draw the chart (components/
// SajuChart.tsx Cell), with what this question touches marked. Plain boxes, so they also come out in the saved
// letter image.

const EL_BAR = ["bg-[#3d6656]", "bg-seal", "bg-gold", "bg-[#bdb6a6]", "bg-[#1f3448]"];
const MARK = ["✕", "△", "○", "◎"];
const POS_ROLE = { 시: "자녀·말년", 일: "나·배우자", 월: "부모·일터", 연: "뿌리·어린 시절" } as const;
const el = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

function Frame({ title, sub, note, children }: { title: string; sub?: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="my-4 rounded-xl border border-seal/25 bg-white/50 px-3.5 pt-3 pb-3 font-sans leading-normal">
      <figcaption>
        <span className="block text-[11px] font-extrabold tracking-[0.14em] text-seal">{title}</span>
        {sub && <span className="mt-0.5 block text-[12.5px] font-bold text-ink">{sub}</span>}
      </figcaption>
      <div className="mt-2.5">{children}</div>
      {note && <div className="mt-2.5 border-t border-seal/10 pt-2 text-[11.5px] leading-relaxed text-ink-soft">{note}</div>}
    </figure>
  );
}

const Star = () => (
  <span className="absolute -top-1.5 -right-1.5 z-10 grid size-4 place-items-center rounded-full bg-[#d4af5f] text-[9px] text-white shadow">★</span>
);

function Lit({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div className={`relative rounded-lg ${on ? "ring-[2.5px] ring-[#d4af5f] ring-offset-1 ring-offset-hanji" : ""}`}>
      {on && <Star />}
      {children}
    </div>
  );
}

// ① What sets this chart apart, from every birth 1950~2008 (lib/rarity.ts).
export function RareFigure({ f, name }: { f: Figures; name: string }) {
  if (!f.rare.length) return null;
  return (
    <Frame title="그대가 남다른 점" sub={`${name}님 사주에서 드물게 보이는 것`} note="1950~2008년에 태어날 수 있는 모든 날·시의 사주와 견준 값이에요.">
      <ul className="flex flex-col gap-2">
        {f.rare.map((x) => (
          <li key={x.term} className="rounded-lg bg-hanji/70 px-3 py-2">
            <p className="flex items-start justify-between gap-2">
              <span className="text-[13.5px] font-bold">
                {x.plain} <span className="text-[11px] font-normal text-ink-soft">{x.term}</span>
              </span>
              <span className="shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{x.rate}</span>
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{x.meaning}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// ② The chart as a 만세력: four pillars, their ten gods, hidden stems, 12운성 and 신살, the star marked.
export function ChartFigure({ f }: { f: Figures }) {
  const rows: [string, (c: Figures["cols"][number]) => React.ReactNode][] = [
    ["지장간", (c) => <span className={`font-myeongjo ${c.hiddenLit ? "font-bold text-[#b8902f]" : ""}`}>{c.hidden || "·"}</span>],
    ["12운성", (c) => c.stage || "·"],
    [
      "신살",
      (c) =>
        c.sals.length
          ? c.sals.map((x) => (
              <span key={x} className="block">
                {x}
              </span>
            ))
          : "·",
    ],
  ];
  return (
    <Frame
      title="그대의 여덟 글자"
      sub={f.lens.group ? `이 질문이 닿는 곳 · ★ ${f.lens.star}` : "태어난 해·달·날·시의 여덟 글자"}
      note={
        f.lens.group && f.starEl !== null ? (
          <>
            <b className="text-ink">★ {f.lens.star}</b> = {f.gods} · {el(f.starEl)} 기운 · 겉으로 드러난 글자 <b className="text-ink">{f.lit}개</b>
            {f.hiddenLit > 0 && <> · 지장간 속에 {f.hiddenLit}곳</>}
            {f.lit === 0 && f.hiddenLit === 0 && " · 사주에 없어, 들어오는 해와 달에 크게 움직여요"}
            {f.lens.seat && <> · 점선은 {f.lens.seat.label}</>}
          </>
        ) : undefined
      }
    >
      <div className="grid grid-cols-[2.6rem_repeat(4,minmax(0,1fr))] items-end gap-x-1.5 gap-y-1 text-center">
        <span />
        {f.cols.map((c) => (
          <span key={`p${c.pos}`} className="text-[11px] font-bold">
            {c.pos}주<span className="block text-[9.5px] leading-tight font-normal text-ink-soft">{POS_ROLE[c.pos]}</span>
          </span>
        ))}
        <span className="self-center text-left text-[10px] font-bold text-ink-soft">십성</span>
        {f.cols.map((c) => (
          <span key={`g${c.pos}`} className={`text-[10.5px] font-bold ${c.stemLit ? "text-[#b8902f]" : "text-seal"}`}>
            {c.pos === "일" ? "나" : c.stemGod || "·"}
          </span>
        ))}
        <span className="self-center text-left text-[10px] font-bold text-ink-soft">천간</span>
        {f.cols.map((c) => (
          <div key={`s${c.pos}`} className={`rounded-xl p-0.5 ${c.seatStem ? "outline-2 outline-seal/50 outline-dashed" : ""}`}>
            <Lit on={c.stemLit}>
              <Cell value={c.stem === null ? null : STEMS[c.stem]} el={c.stem === null ? null : stemEl(c.stem)} />
            </Lit>
          </div>
        ))}
        <span className="self-center text-left text-[10px] font-bold text-ink-soft">지지</span>
        {f.cols.map((c) => (
          <div key={`b${c.pos}`} className={`rounded-xl p-0.5 ${c.seat ? "outline-2 outline-seal/50 outline-dashed" : ""}`}>
            <Lit on={c.branchLit}>
              <Cell value={c.branch === null ? null : BRANCHES[c.branch]} el={c.branch === null ? null : BRANCH_EL[c.branch]} />
            </Lit>
          </div>
        ))}
        <span className="self-center text-left text-[10px] font-bold text-ink-soft">십성</span>
        {f.cols.map((c) => (
          <span key={`u${c.pos}`} className={`text-[10.5px] font-bold ${c.branchLit ? "text-[#b8902f]" : "text-seal"}`}>
            {c.branchGod || "모름"}
            {c.seat && <span className="block text-[9.5px] text-seal">{c.seat}</span>}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-[2.6rem_repeat(4,minmax(0,1fr))] gap-x-1.5 text-center text-[10.5px]">
        {rows.map(([label, cell]) => (
          <div key={label} className="contents">
            <span className="border-t border-seal/10 py-1 text-left text-[10px] font-bold text-ink-soft">{label}</span>
            {f.cols.map((c) => (
              <span key={c.pos} className="border-t border-seal/10 py-1 leading-tight">
                {cell(c)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ③ The five elements as the reports weigh them, with the characters counted beside.
export function ElementsFigure({ f }: { f: Figures }) {
  const max = Math.max(...f.share, 1);
  return (
    <Frame
      title="그대 안의 다섯 기운"
      sub={`${f.strength} · 용신 ${el(f.yong)}`}
      note={
        <>
          비율은 보고서와 같은 방식으로, 태어난 달 글자를 무겁게 보고 합(合)으로 바뀌는 기운까지 셈한 값이에요. 괄호는 글자 수예요.
          {f.starEl !== null && (
            <>
              {" "}
              <b className="text-ink">★ {f.lens.star}</b>의 기운은 {el(f.starEl)}이에요.
            </>
          )}
        </>
      }
    >
      <ul className="flex flex-col gap-1.5">
        {f.share.map((pct, e) => (
          <li key={e} className="flex items-center gap-2 text-[12px]">
            <span className="w-12 shrink-0 font-bold">
              {ELEMENT_KO[e]} <span className="font-myeongjo">{ELEMENT_HANJA[e]}</span>
            </span>
            <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-ink/6">
              <span className={`block h-full rounded-full ${EL_BAR[e]}`} style={{ width: `${(pct / max) * 100}%` }} />
            </span>
            <span className="w-[4.6rem] shrink-0 text-right tabular-nums">
              <b>{pct}%</b> <span className="text-[10.5px] text-ink-soft">({f.count[e]})</span>
              {e === f.starEl && <b className="ml-0.5 text-[#b8902f]">★</b>}
              {e === f.yong && <b className="ml-0.5 text-[10px] text-seal">용</b>}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// ④ The months ahead: the verdict, what moves in it, and where the star comes in.
export function MonthsFigure({ f }: { f: Figures }) {
  return (
    <Frame
      title="다가올 여섯 달"
      sub={f.lens.group ? `★ ${f.lens.star}이 드는 달에 표시` : "달마다 그대에게 오는 기운"}
      note={<>◎ 좋음 · ○ 무난 · △ 조심 · ✕ 버팀 · 날짜는 그 달이 시작되는 절기예요</>}
    >
      <ol className="grid grid-cols-6 items-start gap-1 text-center">
        {f.months.map((m) => (
          <li key={m.label + m.from} className="flex min-w-0 flex-col items-center">
            <span className="h-4 text-[11px] text-[#b8902f]">{m.star ? "★" : ""}</span>
            <span className="flex h-[64px] w-full items-end">
              <span
                className={`flex w-full flex-col justify-end rounded-t-md ${m.rating >= 2 ? "bg-seal/85" : "bg-ink/20"} ${m.now ? "ring-2 ring-[#d4af5f]" : ""}`}
                style={{ height: `${20 + m.rating * 14}px` }}
              >
                <span className={`pb-0.5 text-[13px] font-bold ${m.rating >= 2 ? "text-hanji" : "text-ink"}`}>{MARK[m.rating]}</span>
              </span>
            </span>
            <span className={`mt-1 text-[11px] leading-tight font-bold ${m.now ? "text-seal" : ""}`}>{m.label}</span>
            <span className="text-[9.5px] text-ink-soft">{m.from}~</span>
            <span className="mt-0.5 flex flex-col text-[9.5px] leading-tight text-seal">
              {m.tags.slice(0, 2).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
