import type { Couple } from "@/lib/couple";
import { GRADES5, type Layers, type YearPreview } from "@/lib/freePreview";
import { SCALE5_CHIP } from "@/lib/scale5";
import type { FreeReading } from "@/lib/freeReading";
import { ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, type Reading, type Slot, type TenGod } from "@/lib/myeongri";
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
              {m.tags.length > 0 && <span className="mt-1 block text-[10px] leading-tight text-ink-soft">{m.tags.join(" · ")}</span>}
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

const AREA_WHAT: Record<string, string> = { 돈: "돈과 재물", 일: "일과 자리", 사랑: "사랑과 인연", 사람: "사람과 귀인", 몸: "몸과 마음" };

const SEAT_WHO: Record<string, string> = { 연: "조상·부모님", 월: "부모님·형제", 일: "나 · 배우자", 시: "자녀 · 말년" };
const monthName = (months: MonthMark[], i: number, y: number) => {
  const [m] = months[i].from.split("/").map(Number);
  return `${m === 1 && i > 0 ? `${y + 1}년 ` : ""}${m}월`;
};
const AREA_MONTHS: Record<string, string> = {
  돈: "재물의 별(재성)이 드는 달",
  일: "직장·자리의 별(관성)이 드는 달",
  사랑: "끌림·약속이 붙거나 배우자의 별이 드는 달",
  사람: "귀인이나 도와주는 윗사람의 별이 드는 달",
  몸: "몸을 아껴야 하는 달(일지와 부딪히거나 가장 약한 달)",
};

// One area of a year (돈, 일…): its own grade on the five steps, what made that grade, and the months its stars
// fall in. Each area chapter shows only its own, so no two chapters carry the same picture.
export function AreaFigure({ area, preview, months, y }: { area: string; preview: YearPreview; months: MonthMark[]; y: number }) {
  const a = preview.areas.find((x) => x.area === area);
  if (!a) return null;
  const g = GRADES5.indexOf(a.grade5);
  return (
    <Frame title={`${y}년 ${AREA_WHAT[area] ?? area}, 왜 이 판정일까`} sub="그해 들어오는 글자가 내 사주의 어디를 건드리는지로 계산했어요">
      <ol className="grid grid-cols-5 gap-1 text-center">
        {GRADES5.map((x, i) => (
          <li key={x} className={`rounded-md px-0.5 py-1.5 text-[11px] leading-tight font-bold ${i === g ? `${SCALE5_CHIP[i]} ring-2 ring-seal/40` : "bg-ink/5 text-ink-soft opacity-60"}`}>
            {x}
          </li>
        ))}
      </ol>
      {a.why.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-[12.5px] leading-snug">
          {a.why.map((w) => (
            <li key={w.text} className={`flex gap-2 rounded-lg px-2.5 py-1.5 ${w.up ? "bg-seal/8" : "bg-ink/5"}`}>
              <b className={`shrink-0 ${w.up ? "text-seal" : ""}`}>{w.up ? "＋" : "－"}</b>
              <span>{w.text}</span>
            </li>
          ))}
        </ul>
      )}
      {a.months.length > 0 && (
        <div className="mt-3">
          <p className="text-[11.5px] font-bold text-ink-soft">{AREA_MONTHS[area]}</p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {a.months.map((i) => (
              <span key={i} className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${MARK_STYLE[months[i].rating]}`}>
                {monthName(months, i, y)} {MARK[months[i].rating]}
              </span>
            ))}
          </p>
          <p className="mt-1 text-[11px] text-ink-soft">그중 ◎·○ 달이 이 분야의 기회, △·✕ 달은 같은 일도 한 번 더 따져 볼 달이에요.</p>
        </div>
      )}
    </Frame>
  );
}

// 움직일 일과 도장 찍을 일: which months for which kind of move, from the month marks and their tags.
export function ActionsFigure({ months, y }: { months: MonthMark[]; y: number }) {
  const at = (f: (m: MonthMark) => boolean) => months.map((m, i) => (f(m) ? i : -1)).filter((i) => i >= 0);
  const rows: [string, string, number[], boolean][] = [
    ["시작·이사·개업", "◎ 힘 받는 달", at((m) => m.rating === 3), true],
    ["계약·약속·합치기", "인연·약속이 붙는 달", at((m) => m.tags.includes("인연·약속") || m.tags.includes("합")), true],
    ["사람 도움이 필요한 일", "귀인이 드는 달", at((m) => m.tags.includes("귀인")), true],
    ["큰 결정은 미루기", "✕ 조심할 달", at((m) => m.rating === 0), false],
    ["판이 흔들리기 쉬움", "일지와 부딪히는(충) 달", at((m) => m.tags.includes("변동")), false],
  ];
  const shown = rows.filter((r) => r[2].length);
  if (!shown.length) return null;
  return (
    <Frame title={`${y}년, 무엇을 언제`} sub="일의 종류마다 맞는 달을 골랐어요" note="달은 절기로 바뀌어요(달 초 4~8일 무렵).">
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {shown.map(([what, why, idx, good]) => (
          <li key={what} className={`rounded-lg px-2.5 py-1.5 ${good ? "bg-seal/8" : "bg-ink/5"}`}>
            <b className={good ? "text-seal" : ""}>{what}</b> <span className="text-[11px] text-ink-soft">· {why}</span>
            <span className="mt-0.5 block font-bold">{idx.map((i) => monthName(months, i, y)).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// 결정적인 때: the year's strongest months with their exact days and what they carry, and the ones to get through.
export function MomentsFigure({ months, best, worst, y }: { months: MonthMark[]; best: number[]; worst: number[]; y: number }) {
  if (!best.length && !worst.length) return null;
  const span = (i: number) => `${months[i].from}${months[i + 1] ? `~${months[i + 1].from}` : "부터"}`;
  const card = (i: number, good: boolean) => (
    <li key={i} className={`rounded-lg px-2.5 py-2 ${good ? "bg-seal/10 ring-1 ring-seal/30" : "bg-ink/5"}`}>
      <b className="font-myeongjo">
        {good ? "◎" : "✕"} {monthName(months, i, y)}
      </b>{" "}
      <span className="text-ink-soft">
        {months[i].gz} · {span(i)}
      </span>
      {months[i].tags.length > 0 && <span className="mt-0.5 block text-[11.5px]">{months[i].tags.join(" · ")}</span>}
    </li>
  );
  return (
    <Frame title="이 해의 결정적인 때" sub="날짜는 절기가 바뀌는 날 기준이에요(해마다 하루쯤 달라요)">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {best.map((i) => card(i, true))}
        {worst.map((i) => card(i, false))}
      </ol>
    </Frame>
  );
}

// 가족: the seats of the chart, the family stars it holds, and for a year which seat the year's branch meets and
// whose star its two characters are.
type Group = keyof Reading["gods"];
export function FamilyFigure({ slots, gods, gender, meets, y, yearGods }: { slots: Slot[]; gods?: Reading["gods"]; gender: "m" | "f" | null; meets?: { pos: string; meeting: string }[]; y?: number; yearGods?: [string, string] }) {
  const stars: [string, Group][] = [
    ["어머니(인성)", "인성"],
    ["아버지(재성)", "재성"],
    ["형제·친구(비겁)", "비겁"],
    ...((gender === "m" ? [["자녀(관성)", "관성"]] : gender === "f" ? [["남편(관성)", "관성"], ["자녀(식상)", "식상"]] : []) as [string, Group][]),
  ];
  const WHOSE: Record<Group, string> = {
    인성: "어머니·윗사람",
    재성: gender === "m" ? "아버지·아내" : "아버지",
    비겁: "형제·친구",
    식상: gender === "f" ? "자녀" : "아랫사람",
    관성: gender === "m" ? "자녀" : gender === "f" ? "남편" : "윗사람·직장",
  };
  const quiet = meets && !meets.length;
  return (
    <Frame title={y ? `${y}년, 가족의 자리에 드는 것` : "사주 속 가족의 자리와 별"} sub="네 기둥마다 가까운 사람의 자리가 있어요">
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {slots.map((s) => {
          const m = meets?.find((x) => x.pos === s.pos)?.meeting;
          const soft = m === "육합" || m === "삼합" || m === "방합";
          return (
            <div key={s.pos} className={`rounded-lg px-1 py-2 ring-1 ${m ? "bg-white/80 ring-seal/40" : "bg-white/60 ring-seal/10"}`}>
              <span className="block text-[10.5px] text-ink-soft">{s.pos}주</span>
              <b className="mt-0.5 block font-myeongjo text-[17px] leading-tight">
                {s.stem === null ? "·" : STEMS[s.stem]}
                <br />
                {s.branch === null ? "·" : BRANCHES[s.branch]}
              </b>
              <span className="mt-1 block text-[10.5px] leading-tight font-bold text-seal">{SEAT_WHO[s.pos]}</span>
              {m && <span className={`mt-1 inline-block rounded px-1 text-[10.5px] font-bold ${soft ? "bg-seal/15 text-seal" : "bg-ink text-hanji"}`}>{y}년과 {m}</span>}
            </div>
          );
        })}
      </div>
      {yearGods && (
        <ul className="mt-3 flex flex-col gap-1 text-[12.5px]">
          {yearGods.map((g, i) => (
            <li key={i} className="rounded-lg bg-seal/8 px-2.5 py-1.5">
              <b className="text-seal">
                {i ? "아래 글자" : "위 글자"} · {g}
              </b>{" "}
              {WHOSE[GROUP_OF[g as TenGod]]}의 별이 들어와요
            </li>
          ))}
        </ul>
      )}
      {quiet && <p className="mt-2 text-[12px]">{y}년 글자는 가족의 네 자리 어디와도 부딪히거나 묶이지 않아요. 집안은 큰 변동 없이 흘러가는 쪽이에요.</p>}
      {meets && !quiet && <p className="mt-2 text-[11px] text-ink-soft">합은 가까워지고 도움이 오가는 자리, 충·형·원진은 일이 생기거나 마음 쓸 자리예요.</p>}
      {gods && !y && (
        <>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[12px]">
            {stars.map(([who, g]) => (
              <li key={who} className="flex items-center justify-between rounded-lg bg-white/60 px-2.5 py-1 ring-1 ring-seal/10">
                <span>{who}</span>
                <b className={gods[g] ? "text-seal" : "text-ink-soft"}>{gods[g]}개</b>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-soft">여덟 글자 가운데 그 사람을 뜻하는 별이 몇 개 있는지예요. 0개라고 인연이 없는 게 아니라, 덜 기대거나 늦게 닿는 쪽이에요.</p>
        </>
      )}
    </Frame>
  );
}

// 10년 대운 속의 이 해: the decade's two characters and what they meet in the chart, then the year against both.
export function DecadeLayerFigure({ layers, decade }: { layers: Layers; decade: { mood: string; theme: string } | null }) {
  if (!layers.daeun) return null;
  return (
    <Frame title="사주 위에 대운, 대운 위에 이 해" sub="한 해는 지금의 10년(대운) 위에 겹쳐서 읽어요">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        <li className="rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-seal/10">
          <b>내 사주</b>{" "}
          <span className="font-myeongjo">
            {layers.natal
              .filter((n) => !n.gz.includes("?"))
              .map((n) => n.gz)
              .join(" ")}
          </span>
        </li>
        <li className="rounded-lg bg-seal/8 px-2.5 py-1.5">
          <b className="text-seal">
            대운 <span className="font-myeongjo">{layers.daeun.gz}</span>
          </b>{" "}
          <span className="text-ink-soft">
            {layers.daeun.from}~{layers.daeun.to}
            {decade ? ` · ${decade.mood}` : ""}
          </span>
          <span className="mt-0.5 block text-[11.5px]">{layers.daeun.tags.length ? `내 사주와: ${layers.daeun.tags.join(" · ")}` : "내 사주와 부딪히거나 묶이는 곳 없음"}</span>
        </li>
        <li className="rounded-lg bg-seal/15 px-2.5 py-1.5 ring-1 ring-seal/30">
          <b className="text-seal">
            이 해 <span className="font-myeongjo">{layers.year.gz}</span>
          </b>
          <span className="mt-0.5 block text-[11.5px]">내 사주와: {layers.year.natal.length ? layers.year.natal.join(" · ") : "부딪히거나 묶이는 곳 없음"}</span>
          <span className="block text-[11.5px]">대운과: {layers.year.daeun.length ? layers.year.daeun.join(" · ") : "부딪히거나 묶이는 곳 없음"}</span>
        </li>
      </ol>
      {decade && <p className="mt-2 text-[11.5px] text-ink-soft">이 10년의 주제: {decade.theme}</p>}
    </Frame>
  );
}

// 지금 나는 어디쯤: how far into the present decade, and what the next one brings.
export function NowFigure({ flow, y }: { flow: NonNullable<FreeReading["flow"]>; y: number }) {
  const i = flow.findIndex((f) => f.from <= y && y <= f.to);
  if (i < 0) return null;
  const cur = flow[i];
  const next = flow[i + 1];
  const len = cur.to - cur.from + 1;
  const k = y - cur.from + 1;
  return (
    <Frame title="지금, 이 10년의 몇 번째 해" sub={`${cur.from}~${cur.to}년 · ${cur.young ? "성장기" : `${cur.mood}의 10년`}`}>
      <ol className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${len}, minmax(0, 1fr))` }}>
        {Array.from({ length: len }, (_, j) => (
          <li key={j} className={`h-3 rounded-sm ${j + 1 < k ? "bg-seal/35" : j + 1 === k ? "bg-seal" : "bg-ink/8"}`} />
        ))}
      </ol>
      <p className="mt-2 text-[12.5px]">
        <b className="text-seal">
          {len}년 중 {k}년째
        </b>{" "}
        · {cur.to > y ? `남은 해 ${cur.to - y}년` : "올해가 이 10년의 마지막 해"} · {cur.theme}
      </p>
      {next && (
        <p className="mt-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-[12.5px] ring-1 ring-seal/10">
          <b>{next.from === y + 1 ? "내년부터 새 10년" : "다음 10년"}</b> {next.from}~{next.to} · {next.young ? "성장기" : next.mood}
          <span className="block text-[11.5px] text-ink-soft">{next.theme}</span>
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

// What is rare in this chart. With areas, only what belongs to the chapter (돈, 일, 연애…), so the rare traits are
// spread over the chapters they speak to instead of one list repeated.
export function RareFigure({ name, d, areas }: { name: string; d: Distinct; areas?: string[] }) {
  const items = (areas ? d.patterns.filter((p) => areas.includes(p.area)) : d.patterns).slice(0, 3);
  const ilju = areas ? null : d.ilju;
  if (!items.length && !ilju) return null;
  return (
    <Frame title={`${name}님 사주에서 드문 것${areas ? ` · ${areas.join("·")}` : ""}`} sub="같은 생년월일 구조를 모아 계산한 비율이에요">
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {ilju && (
          <li className="flex items-baseline justify-between gap-2 rounded-lg bg-seal/8 px-2.5 py-1.5">
            <span>
              같은 {ilju.name}일주 중 <b>{ilju.build}</b>
            </span>
            <b className="shrink-0 text-seal">{Math.max(1, Math.round(ilju.rate * 100))}%</b>
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
    <Frame title={title} sub="위 달력에서 고른 날 · 순서대로 1·2·3순위 · 시간은 다음 장에">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {days.map((d, i) => (
          <li key={d.date} className={`rounded-lg px-2.5 py-2 ${i === 0 ? "bg-seal/10 ring-1 ring-seal/30" : "bg-white/60 ring-1 ring-seal/10"}`}>
            <b className="font-myeongjo">
              {i + 1}순위 · {Number(d.date.slice(5, 7))}월 {Number(d.date.slice(8, 10))}일
            </b>{" "}
            <span className="text-ink-soft">
              {d.lunar} · {d.gz}
            </span>
            {d.reasons.length > 0 && <span className="mt-0.5 block text-[11.5px]">{d.reasons.map((r) => r.tag).join(" · ")}</span>}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

// 택일 몇 시: each chosen day's good hours (and the ceremony hour, where the 손 is on a move).
export function HoursFigure({ days }: { days: DayPick[] }) {
  const rows = days.filter((d) => d.hours.length || d.ceremony || d.son);
  if (!rows.length) return null;
  return (
    <Frame title="그날의 좋은 시간" sub="황도시(그날 기운이 밝은 시간) 기준이에요">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {rows.map((d, i) => (
          <li key={d.date} className="rounded-lg bg-white/60 px-2.5 py-2 ring-1 ring-seal/10">
            <b className="font-myeongjo">
              {i + 1}순위 {Number(d.date.slice(5, 7))}/{Number(d.date.slice(8, 10))}
            </b>
            <span className="mt-1 flex flex-wrap gap-1">
              {d.hours.map((h) => (
                <span key={h} className="rounded-md bg-seal/10 px-1.5 py-0.5 text-[11.5px] font-bold text-seal">
                  {h}
                </span>
              ))}
            </span>
            {d.ceremony && <span className="mt-1 block text-[11.5px]">예식·식사 시간 {d.ceremony}</span>}
            {d.son && <span className="block text-[11.5px]">손 있는 방향 {d.son}</span>}
          </li>
        ))}
      </ol>
    </Frame>
  );
}
