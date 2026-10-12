import { Cell } from "@/components/SajuChart";
import { type FigureKit, type Figures } from "@/lib/askFigures";
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

const TOUCH_GOOD = "border-[#b8902f] bg-[#d4af5f]/15 text-[#8a6a1f]";
const TOUCH_BAD = "border-seal/50 bg-seal/8 text-seal";

// ⑤ 合沖: this year's and this month's characters, and the seats of the chart they meet.
export function ClashFigure({ c }: { c: NonNullable<FigureKit["clash"]> }) {
  return (
    <Frame
      title="지금 들어온 글자가 만나는 자리"
      sub="올해와 이달의 기운이 그대 사주 어디를 건드리는지"
      note="금색은 합(끌어당겨 묶임), 붉은색은 충·형(부딪혀 움직임)이에요. 충은 나쁜 일이 아니라 바뀌는 자리예요."
    >
      <div className="flex justify-center gap-3">
        {c.incoming.map((x) => (
          <div key={x.label} className="flex flex-col items-center gap-1">
            <span className="text-[10.5px] font-bold text-ink-soft">
              {x.label} · {x.god}
            </span>
            <div className="grid w-28 grid-cols-2 gap-1">
              <Cell value={STEMS[x.stem]} el={stemEl(x.stem)} />
              <Cell value={BRANCHES[x.branch]} el={BRANCH_EL[x.branch]} />
            </div>
          </div>
        ))}
      </div>
      <p aria-hidden className="my-1.5 text-center text-[14px] leading-none text-ink-soft">
        ↓ ↓ ↓
      </p>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {c.cols.map((col) => {
          const hit = col.touches.length > 0;
          return (
            <div key={col.pos} className={`flex flex-col gap-1 rounded-xl p-1 ${hit ? "bg-hanji ring-1 ring-seal/25" : "opacity-55"}`}>
              <span className="text-[10.5px] font-bold">{col.pos}주</span>
              <Cell value={col.stem === null ? null : STEMS[col.stem]} el={col.stem === null ? null : stemEl(col.stem)} />
              <Cell value={col.branch === null ? null : BRANCHES[col.branch]} el={col.branch === null ? null : BRANCH_EL[col.branch]} />
              <span className="flex min-h-5 flex-col gap-0.5">
                {col.touches.map((t, i) => (
                  <span key={i} className={`rounded-md border px-0.5 py-0.5 text-[9.5px] leading-tight font-bold ${t.good ? TOUCH_GOOD : TOUCH_BAD}`}>
                    {t.from} {t.kind.split(" · ")[0]}
                    <span className="block font-normal">{t.kind.split(" · ")[1]}</span>
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

// ⑥ 宮位: one seat close up.
export function SeatFigure({ s }: { s: NonNullable<FigureKit["seat"]> }) {
  return (
    <Frame title="한 자리 들여다보기" sub={`${s.name} · ${s.pos}주`} note={s.meaning}>
      <div className="flex items-start gap-3">
        <div className="flex w-[4.5rem] shrink-0 flex-col gap-1 text-center">
          <span className="text-[10px] font-bold text-seal">{s.stemGod}</span>
          <Cell value={s.stem === null ? null : STEMS[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
          <div className="relative rounded-lg ring-[2.5px] ring-[#d4af5f] ring-offset-1 ring-offset-hanji">
            <Cell value={BRANCHES[s.branch]} el={BRANCH_EL[s.branch]} />
          </div>
        </div>
        <dl className="grid min-w-0 flex-1 grid-cols-[3.4rem_1fr] gap-x-2 gap-y-1.5 text-[12px] leading-snug">
          <dt className="font-bold text-ink-soft">속 글자</dt>
          <dd className="flex flex-wrap gap-1">
            {s.hidden.map((h) => (
              <span key={h.stem} className={`rounded-md px-1.5 py-0.5 ${h.main ? "bg-ink text-hanji" : "bg-ink/8"}`}>
                <span className="font-myeongjo">{STEMS[h.stem]}</span> {h.god}
              </span>
            ))}
          </dd>
          <dt className="font-bold text-ink-soft">기운 단계</dt>
          <dd>{s.stage}</dd>
          {s.sals.length > 0 && (
            <>
              <dt className="font-bold text-ink-soft">신살</dt>
              <dd>{s.sals.join(" · ")}</dd>
            </>
          )}
          <dt className="font-bold text-ink-soft">올해</dt>
          <dd>
            <span className="font-myeongjo">{s.year.gz}</span>
            {s.year.kinds.length ? (
              s.year.kinds.map((k) => (
                <span key={k} className={`ml-1 rounded-md border px-1 text-[11px] font-bold ${/합/.test(k) ? TOUCH_GOOD : TOUCH_BAD}`}>
                  {k}
                </span>
              ))
            ) : (
              <span className="text-ink-soft"> 와 조용히 지나가요</span>
            )}
          </dd>
        </dl>
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">검은 칸이 그 자리의 주인 글자(본기)예요.</p>
    </Frame>
  );
}

// ⑦ 大運: the ten-year spans along a line, now marked.
export function DecadesFigure({ d }: { d: NonNullable<FigureKit["decades"]> }) {
  const from = Math.max(0, Math.min(d.nowIndex - 1, d.spans.length - 5));
  const shown = d.spans.slice(from, from + 5);
  return (
    <Frame
      title="10년 흐름"
      sub="지금 그대가 서 있는 10년과 그다음"
      note="◎ 크게 돕는 10년 · ○ 순한 10년 · △ 애쓰는 10년 · ✕ 버티는 10년 · 위의 말은 그 10년에 들어오는 별(십성)이에요"
    >
      <ol className="relative grid grid-cols-5 gap-1 text-center">
        <span aria-hidden className="absolute top-[3.15rem] right-2 left-2 h-0.5 bg-seal/20" />
        {shown.map((s) => (
          <li key={s.from} className="relative flex flex-col items-center gap-1">
            <span className={`text-[10px] font-bold ${s.now ? "text-seal" : "text-ink-soft"}`}>{s.god}</span>
            <span
              className={`grid size-10 place-items-center rounded-full font-myeongjo text-[13px] font-bold ${s.now ? "bg-seal text-hanji ring-2 ring-[#d4af5f] ring-offset-1 ring-offset-hanji" : "border border-seal/30 bg-hanji"}`}
            >
              {s.gz}
            </span>
            <span className={`text-[14px] font-bold ${s.fit >= 2 ? "text-seal" : "text-ink-soft"}`}>{MARK[s.fit]}</span>
            <span className={`text-[10.5px] leading-tight ${s.now ? "font-extrabold text-seal" : ""}`}>
              {s.from}~{String(s.to).slice(2)}
              {s.now && <span className="block">지금</span>}
            </span>
            {s.age && <span className="text-[9.5px] text-ink-soft">{s.age}</span>}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

// ⑧ 年比: this year and next, area by area.
const GRADE_W = { 좋음: 100, 보통: 60, 조심: 25 } as Record<string, number>;
export function YearsFigure({ y }: { y: NonNullable<FigureKit["years"]> }) {
  const [a, b] = y.years;
  return (
    <Frame
      title="올해와 내년"
      sub={`${a.year} ${a.verdict} → ${b.year} ${b.verdict}`}
      note="영역마다 좋음 · 보통 · 조심으로 견줬어요. 보고서의 한 해 판정과 같은 계산이에요."
    >
      <div className="mb-1.5 flex justify-end gap-3 text-[10.5px] text-ink-soft">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-ink/35" /> {a.name}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-seal/85" /> {b.name}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {a.areas.map((ar, i) => {
          const br = b.areas[i];
          const up = br.score - ar.score;
          return (
            <li key={ar.area} className="grid grid-cols-[2.2rem_1fr_3.2rem] items-center gap-2 text-[12px]">
              <b>{ar.area}</b>
              <span className="flex flex-col gap-0.5">
                <span className="h-2.5 rounded-full bg-ink/35" style={{ width: `${GRADE_W[ar.grade]}%` }} />
                <span className="h-2.5 rounded-full bg-seal/85" style={{ width: `${GRADE_W[br.grade]}%` }} />
              </span>
              <span className={`text-right text-[11px] font-bold ${up > 0.3 ? "text-seal" : up < -0.3 ? "text-ink-soft" : ""}`}>
                {up > 0.3 ? "▲ 오름" : up < -0.3 ? "▼ 숨 고름" : "― 비슷"}
              </span>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

// ⑨ 神殺: the 신살 in the chart.
export function SalsFigure({ s }: { s: NonNullable<FigureKit["sals"]> }) {
  return (
    <Frame title="사주 속 신살" sub="태어날 때 받은 특별한 별">
      <ul className="grid grid-cols-1 gap-1.5">
        {s.map((x) => (
          <li key={x.name} className="flex items-start gap-2.5 rounded-lg bg-hanji/70 px-2.5 py-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-seal/40 font-myeongjo text-[12px] leading-tight font-bold text-seal">
              {x.hanja.length > 2 ? x.hanja.slice(0, 2) : x.hanja}
            </span>
            <span className="min-w-0">
              <b className="text-[13px]">{x.name}</b> <span className="text-[11px] text-ink-soft">{x.seats.join(" · ")}</span>
              {x.line && <span className="mt-0.5 block text-[12px] leading-snug">{x.line}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// ⑩ 兩人: the two side by side.
export function PairFigure({ p }: { p: NonNullable<FigureKit["pair"]> }) {
  const side = (x: typeof p.a, role: string) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[12px] font-bold">{x.name}</span>
      <span
        className={`grid size-14 place-items-center rounded-xl font-myeongjo text-[18px] font-bold ${EL_BAR[x.el]} ${x.el === 3 ? "text-ink" : "text-white"}`}
      >
        {x.ilju}
      </span>
      <span className="text-[10.5px] text-ink-soft">{x.ilju}일주</span>
      <span className="rounded-full bg-seal/10 px-2 py-0.5 text-[10.5px] font-bold text-seal">상대에게 {role}</span>
    </div>
  );
  return (
    <Frame title="두 사람" sub={`${p.a.name}님과 ${p.b.name}`}>
      <div className="flex items-center justify-center gap-4">
        {side(p.a, p.roles[1])}
        <span className="text-[20px] text-[#b8902f]">⟷</span>
        {side(p.b, p.roles[0])}
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-[12px] leading-snug">
        {p.seat.map((x) => (
          <li key={x}>· {x}</li>
        ))}
        {p.lends.map((l) => (
          <li key={l.to + l.el}>
            · {l.to}에게 모자란 {l.el}을 {l.from}이 {l.pct}% 채워 줘요
          </li>
        ))}
        {p.years.slice(0, 3).map((y) => (
          <li key={y.year}>
            · <b>{y.year}</b> <span className="font-myeongjo">{y.gz}</span> {y.mark} <span className="text-ink-soft">({y.why})</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// One picture by its mark; nothing for a mark this room cannot draw.
export function FigureOf({ kit, k, name }: { kit: FigureKit; k: string; name: string }) {
  switch (k) {
    case "命盤":
      return <ChartFigure f={kit.base} />;
    case "五行":
      return <ElementsFigure f={kit.base} />;
    case "月運":
      return <MonthsFigure f={kit.base} />;
    case "稀貴":
      return <RareFigure f={kit.base} name={name} />;
    case "合沖":
      return kit.clash ? <ClashFigure c={kit.clash} /> : null;
    case "宮位":
      return kit.seat ? <SeatFigure s={kit.seat} /> : null;
    case "大運":
      return kit.decades && kit.decades.nowIndex >= 0 ? <DecadesFigure d={kit.decades} /> : null;
    case "年比":
      return kit.years ? <YearsFigure y={kit.years} /> : null;
    case "神殺":
      return kit.sals ? <SalsFigure s={kit.sals} /> : null;
    case "兩人":
      return kit.pair ? <PairFigure p={kit.pair} /> : null;
    default:
      return null;
  }
}
