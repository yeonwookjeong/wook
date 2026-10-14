import type { Couple } from "@/lib/couple";
import { GRADES5, type YearPreview } from "@/lib/freePreview";
import { SCALE5_BAR, SCALE5_CHIP, SCALE5_WIDTH } from "@/lib/scale5";
import type { FreeReading } from "@/lib/freeReading";
import { ELEMENT_HANJA, ELEMENT_KO, type Slot } from "@/lib/myeongri";
import type { Distinct } from "@/lib/rarity";
import { BRANCHES, STEMS } from "@/lib/saju";
import type { DayPick } from "@/lib/taekil";
import type { MonthMark, YearRow } from "@/lib/yeonun";
import { Frame } from "./PaidFigures";
import SajuChart from "./SajuChart";

// The second pass on the bought reports (lib/open.ts RENEW2): the chart on top of every bought report, and a
// picture in the chapters that were words only. Every number here is what the page already computed for the free
// screen and what the writer was told, so the picture and the text agree.

const MARK = ["✕", "△", "○", "◎"];
const MARK_STYLE = ["bg-ink text-hanji", "bg-[#d4af5f]/35 text-ink", "bg-seal/15 text-seal", "bg-seal text-hanji"];
const MARK_WORD = ["조심", "잔잔", "무난", "좋음"];

// On top of a bought report, open: the reader's eight characters, the first thing they paid to have read.
export function ChartTop({ name, chart, year }: { name: string; chart: Parameters<typeof SajuChart>[0]; year?: { y: number; hanja: string; gods: [string, string] } }) {
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">命 盤</p>
      <h2 className="mt-1 text-center font-myeongjo text-[18px] font-extrabold">{name}님의 사주팔자</h2>
      <p className="mt-1 text-center text-[11.5px] text-ink-soft">이 여덟 글자로 아래 보고서를 썼어요</p>
      <SajuChart {...chart} kingdom={false} />
      {year && (
        <p className="mt-3 rounded-lg bg-seal/5 px-3 py-2 text-center text-[13px] leading-relaxed">
          {year.y}년에 들어오는 두 글자{" "}
          <b className="font-myeongjo text-[16px] text-seal">{year.hanja}</b>
          <span className="block text-[11.5px] text-ink-soft">
            {name}님에게는 위 글자가 {year.gods[0]}, 아래 글자가 {year.gods[1]}로 들어와요
          </span>
        </p>
      )}
    </section>
  );
}

// Two people's charts side by side (택일 for two), small.
export function PairCharts({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return (
    <section className="doc-paper mt-4 px-4 pt-5 pb-4">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">命 盤</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {a}
        {b}
      </div>
    </section>
  );
}

// A year's months, ◎○△✕ (연운's months, the coming months of a love report).
export function MonthsStrip({ title, sub, months, y, pick }: { title: string; sub?: string; months: MonthMark[]; y: number; pick?: number[] }) {
  const shown = pick ? months.filter((_, i) => pick.includes(i)) : months;
  return (
    <Frame title={title} sub={sub} note="◎ 좋음 · ○ 무난 · △ 잔잔 · ✕ 조심. 달은 절기로 바뀌어요(달 초 4~8일 무렵).">
      <ul className="grid grid-cols-3 gap-1.5 text-center">
        {shown.map((m) => {
          const [mm] = m.from.split("/").map(Number);
          return (
            <li key={m.from} className="rounded-lg bg-white/60 px-1 py-1.5 ring-1 ring-seal/10">
              <span className="block text-[11px] text-ink-soft">
                {mm === 1 && months.indexOf(m) > 0 ? `${y + 1}.` : ""}
                {mm}월 · {m.gz}
              </span>
              <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-extrabold ${MARK_STYLE[m.rating]}`}>
                {MARK[m.rating]} {MARK_WORD[m.rating]}
              </span>
              {m.tags[0] && <span className="mt-1 block truncate text-[10px] text-ink-soft">{m.tags[0]}</span>}
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

const AREA_WHAT: Record<string, string> = { 돈: "돈과 재물", 일: "일과 자리", 사랑: "사랑과 인연", 사람: "사람과 귀인", 몸: "몸과 마음" };

// One area of a year (돈, 일…) against the others, with the year's best and hardest months.
export function AreaFigure({ area, preview, months, best, worst, y }: { area: string; preview: YearPreview; months: MonthMark[]; best: number[]; worst: number[]; y: number }) {
  const mm = (i: number) => {
    const [m] = months[i].from.split("/").map(Number);
    return `${m}월`;
  };
  return (
    <Frame title={`${y}년의 ${AREA_WHAT[area] ?? area}`} sub="영역마다 그해 드는 기운을 계산한 결과예요">
      <ul className="flex flex-col gap-1.5">
        {preview.areas.map((a) => {
          const i = GRADES5.indexOf(a.grade5);
          return (
            <li key={a.area} className={`grid grid-cols-[4.6rem_1fr_3.6rem] items-center gap-2 text-[12px] ${a.area === area ? "font-extrabold" : "text-ink-soft opacity-70"}`}>
              <span>{AREA_WHAT[a.area]}</span>
              <span className="h-2.5 rounded-full bg-ink/8">
                <span className={`block h-2.5 rounded-full ${SCALE5_BAR[i]}`} style={{ width: `${SCALE5_WIDTH[i]}%` }} />
              </span>
              <span className={`justify-self-end rounded-md px-1.5 py-0.5 text-[10.5px] font-bold whitespace-nowrap ${SCALE5_CHIP[i]}`}>{a.grade5}</span>
            </li>
          );
        })}
      </ul>
      {(best.length > 0 || worst.length > 0) && (
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {best.length > 0 && (
            <span>
              <b className="text-seal">◎ 힘 받는 달</b> {best.map(mm).join(" · ")}
            </span>
          )}
          {worst.length > 0 && (
            <span>
              <b>✕ 아낄 달</b> {worst.map(mm).join(" · ")}
            </span>
          )}
        </p>
      )}
    </Frame>
  );
}

// Where this year stands: the years either side, and the ten years it sits in.
export function YearPlaceFigure({ y, rows, decade }: { y: number; rows: YearRow[]; decade: { from: number; to: number; mood: string; theme: string } | null }) {
  const V: Record<string, string> = { 대길: SCALE5_CHIP[0], 길: SCALE5_CHIP[1], 평: SCALE5_CHIP[2], 조심: SCALE5_CHIP[3], 인내: SCALE5_CHIP[4] };
  return (
    <Frame title="10년 흐름 속의 이 해" sub={decade ? `${decade.from}~${decade.to}년 · ${decade.mood}의 10년` : undefined} note={decade ? decade.theme : undefined}>
      <ol className="grid grid-cols-3 gap-1.5 text-center">
        {rows.map((r) => (
          <li key={r.year} className={`rounded-lg px-1 py-2 ${r.year === y ? "bg-white/80 ring-2 ring-seal/40" : "bg-white/40"}`}>
            <b className={`block font-myeongjo text-[14px] ${r.year === y ? "text-seal" : ""}`}>{r.year}</b>
            <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${V[r.verdict]}`}>{r.verdict}</span>
            <span className="mt-1 block text-[10.5px] leading-tight text-ink-soft">{r.theme}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

// The five powers (성향 지도), as bars.
export function PowersFigure({ name, powers, strong, weak }: { name: string; powers: FreeReading["powers"]; strong?: FreeReading["strong"]; weak?: FreeReading["weak"] }) {
  const max = Math.max(...powers.map((p) => p.pct), 1);
  return (
    <Frame title={`${name}님의 다섯 가지 힘`} sub="사주 여덟 글자의 무게를 다섯 갈래로 나눈 비율이에요">
      <ul className="flex flex-col gap-1.5">
        {powers.map((p) => (
          <li key={p.group} className="grid grid-cols-[5.2rem_1fr_2.6rem] items-center gap-2 text-[12px]">
            <span className="truncate font-bold">{p.name}</span>
            <span className="h-2.5 rounded-full bg-ink/8">
              <span className="block h-2.5 rounded-full bg-seal/70" style={{ width: `${Math.max(4, (p.pct / max) * 100)}%` }} />
            </span>
            <span className="text-right tabular-nums">{p.pct}%</span>
          </li>
        ))}
      </ul>
      {strong && weak && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] leading-snug">
          <p className="rounded-lg bg-seal/8 px-2.5 py-2">
            <b className="block text-seal">무기 · {strong.name}</b>
            {strong.line}
          </p>
          <p className="rounded-lg bg-ink/5 px-2.5 py-2">
            <b className="block">약점 · {weak.name}</b>
            {weak.line}
          </p>
        </div>
      )}
    </Frame>
  );
}

// The chart with whose seat is which: 부모·형제·배우자·자녀.
const SEAT_WHO: Record<string, string> = { 연: "조상·부모님", 월: "부모님·형제", 일: "나 · 배우자", 시: "자녀 · 말년" };
export function SeatsFigure({ slots }: { slots: Slot[] }) {
  return (
    <Frame title="사주 속 가족의 자리" sub="네 기둥마다 가까운 사람의 자리가 있어요">
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {slots.map((s) => (
          <div key={s.pos} className="rounded-lg bg-white/60 px-1 py-2 ring-1 ring-seal/10">
            <span className="block text-[10.5px] text-ink-soft">{s.pos}주</span>
            <b className="mt-0.5 block font-myeongjo text-[17px] leading-tight">
              {s.stem === null ? "·" : STEMS[s.stem]}
              <br />
              {s.branch === null ? "·" : BRANCHES[s.branch]}
            </b>
            <span className="mt-1 block text-[10.5px] leading-tight font-bold text-seal">{SEAT_WHO[s.pos]}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// What is plenty and what is missing, for the body chapter.
const BODY = ["간·눈·근육", "심장·혈관·잠", "위장·소화", "폐·피부·호흡", "신장·방광·몸의 물"];
export function ElementsFigure({ name, elements }: { name: string; elements: number[] }) {
  const sum = elements.reduce((a, b) => a + b, 0) || 1;
  const pct = elements.map((e) => Math.round((e / sum) * 100));
  const max = Math.max(...pct, 1);
  return (
    <Frame title={`${name}님 몸의 다섯 기운`} sub="많은 기운은 과로하기 쉽고, 적은 기운은 따로 챙겨야 하는 곳이에요" note="병을 진단하는 표가 아니라, 생활에서 챙길 곳을 짚는 표예요.">
      <ul className="flex flex-col gap-1.5">
        {pct.map((p, e) => (
          <li key={e} className="grid grid-cols-[3.2rem_1fr_2.4rem] items-center gap-2 text-[12px]">
            <span className="font-bold">
              {ELEMENT_KO[e]}({ELEMENT_HANJA[e]})
            </span>
            <span className="relative h-2.5 rounded-full bg-ink/8">
              <span className={`block h-2.5 rounded-full ${p >= 30 ? "bg-seal" : p <= 8 ? "bg-ink/25" : "bg-seal/40"}`} style={{ width: `${Math.max(3, (p / max) * 100)}%` }} />
            </span>
            <span className="text-right tabular-nums">{p}%</span>
            <span />
            <span className="-mt-1 text-[10.5px] text-ink-soft">
              {BODY[e]}
              {p >= 30 ? " · 많음" : p <= 8 ? " · 모자람" : ""}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// The flow of life in one table (instead of ten folds): each decade, its mood, and where the reader is now.
export function FlowFigure({ flow }: { flow: NonNullable<FreeReading["flow"]> }) {
  const MOOD: Record<string, string> = { 활짝: SCALE5_CHIP[0], 기회: SCALE5_CHIP[1], 무난: SCALE5_CHIP[2], 다지기: SCALE5_CHIP[3], 버티기: SCALE5_CHIP[4] };
  return (
    <Frame title="인생의 10년들" sub="10년마다 바뀌는 큰 흐름(대운) · 지금 있는 칸에 표시했어요">
      <ul className="flex flex-col divide-y divide-seal/10">
        {flow.map((f) => (
          <li key={f.from} className={`flex items-start gap-2 py-1.5 text-[12px] ${f.now ? "-mx-1.5 rounded-md bg-seal/8 px-1.5" : ""}`}>
            <span className="w-[4.6rem] shrink-0 tabular-nums">
              <b>{f.age}</b>
              <span className="block text-[10px] text-ink-soft">
                {f.from}~{f.to}
              </span>
            </span>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${f.young ? "bg-ink/5 text-ink-soft" : MOOD[f.mood]}`}>{f.young ? "성장기" : f.mood}</span>
            <span className="min-w-0 leading-snug">
              {f.now && <b className="text-seal">지금 · </b>}
              {f.theme}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// What is rare in this chart (the first chapter of a topic report).
export function RareFigure({ name, d }: { name: string; d: Distinct }) {
  const items = d.patterns.slice(0, 3);
  if (!items.length && !d.ilju) return null;
  return (
    <Frame title={`${name}님 사주에서 드문 것`} sub="같은 생년월일 구조를 모아 계산한 비율이에요">
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {d.ilju && (
          <li className="flex items-baseline justify-between gap-2 rounded-lg bg-seal/8 px-2.5 py-1.5">
            <span>
              같은 {d.ilju.name}일주 중 <b>{d.ilju.build}</b>
            </span>
            <b className="shrink-0 text-seal">{Math.max(1, Math.round(d.ilju.rate * 100))}%</b>
          </li>
        )}
        {items.map((p) => (
          <li key={p.id} className="flex items-baseline justify-between gap-2 rounded-lg bg-white/60 px-2.5 py-1.5">
            <span className="min-w-0">
              <b>{p.plain}</b>
              <span className="block text-[11px] text-ink-soft">{p.meaning}</span>
            </span>
            <b className="shrink-0 text-seal">{Math.max(1, Math.round(p.rate * 100))}%</b>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// 궁합: what each lends the other, and what both lack.
const pct = (x: number) => Math.round(x <= 1 ? x * 100 : x);
export function LendsFigure({ c, a, b }: { c: Couple; a: string; b: string }) {
  return (
    <Frame title="서로 채워 주는 것, 같이 모자란 것" sub="두 사람의 다섯 기운을 겹쳐 본 결과예요">
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {c.lends.map((l, i) => (
          <li key={i} className="rounded-lg bg-seal/8 px-2.5 py-1.5">
            <b className="text-seal">
              {l.from} → {l.to}
            </b>{" "}
            {ELEMENT_KO[l.el]}({ELEMENT_HANJA[l.el]}) 기운을 채워 줘요 <span className="text-ink-soft">({l.from}님 사주의 {l.pct}%)</span>
          </li>
        ))}
        {c.sharedLack.length > 0 && (
          <li className="rounded-lg bg-ink/5 px-2.5 py-1.5">
            <b>둘 다 모자람</b> {c.sharedLack.map((e) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`).join(" · ")} · 함께 밖에서 채워야 하는 기운
          </li>
        )}
        {!c.lends.length && !c.sharedLack.length && <li className="text-ink-soft">한쪽으로 크게 기울거나 모자란 기운이 없는 사이예요.</li>}
      </ul>
      <p className="mt-2 text-[11.5px] text-ink-soft">
        {a}님에게 꼭 필요한 기운이 {b}님 사주에 {pct(c.yongGive[0])}%, {b}님에게 꼭 필요한 기운이 {a}님 사주에 {pct(c.yongGive[1])}% 들어 있어요.
      </p>
    </Frame>
  );
}

// 궁합: where the two charts meet seat to seat (the 합 and 충 lines the free screen lists).
export function SeatLinesFigure({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <Frame title="두 사람의 자리끼리" sub="같은 자리에 무엇이 만나는지 · 합은 끌림, 충은 부딪힘이에요">
      <ul className="flex flex-col gap-1 text-[12.5px]">
        {lines.map((l, i) => (
          <li key={i} className="rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-seal/10">
            {l}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// 택일: the chosen days, their hours, at a glance.
export function DaysFigure({ days, title }: { days: DayPick[]; title: string }) {
  if (!days.length) return null;
  return (
    <Frame title={title} sub="위 달력에서 고른 날 · 순서대로 1·2·3순위">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {days.map((d, i) => (
          <li key={d.date} className={`rounded-lg px-2.5 py-2 ${i === 0 ? "bg-seal/10 ring-1 ring-seal/30" : "bg-white/60 ring-1 ring-seal/10"}`}>
            <b className="font-myeongjo">
              {i + 1}순위 · {Number(d.date.slice(5, 7))}월 {Number(d.date.slice(8, 10))}일
            </b>{" "}
            <span className="text-ink-soft">
              {d.lunar} · {d.gz}
            </span>
            {d.hours.length > 0 && <span className="mt-0.5 block text-[11.5px]">좋은 시간 {d.hours.join(", ")}</span>}
            {d.ceremony && <span className="block text-[11.5px]">예식 시간 {d.ceremony}</span>}
          </li>
        ))}
      </ol>
    </Frame>
  );
}
