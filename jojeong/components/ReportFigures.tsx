import type { Couple } from "@/lib/couple";
import { GRADES5, type Layers, type YearPreview } from "@/lib/freePreview";
import { SCALE5_CHIP } from "@/lib/scale5";
import type { FreeReading } from "@/lib/freeReading";
import { ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, type Reading, type Slot, type TenGod } from "@/lib/myeongri";
import { elementRank, perHundred, type Distinct } from "@/lib/rarity";
import { BRANCHES, STEMS } from "@/lib/saju";
import type { DecadeYear } from "@/lib/domains";
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
// The month tags (lib/yeonun.ts monthMarks) in the reader's words.
const TAG_WORD: Record<string, string> = { 변동: "변화가 큰 달", "인연·약속": "약속이 잘 붙는 달", 귀인: "도와주는 사람", 합: "마음이 통함" };
const tagWords = (tags: string[]) => tags.map((t) => TAG_WORD[t] ?? t).join(" · ");
// What each group of the ten gods brings, plainly.
const GROUP_WORD: Record<string, string> = { 비겁: "동료·경쟁", 식상: "표현·재주", 재성: "돈·결과", 관성: "일·책임", 인성: "배움·도움" };

// On top of a bought report, open: the reader's eight characters, the first thing they paid to have read.
// The chart's own rarest traits, shown on top (the chapters then leave these out). The element ones are left to the
// bars, which rank the exact share (a pattern's rate is for its whole bracket, so the two numbers would differ).
const EL_PATTERNS = ["el-extreme", "missing-two"];
const topRare = (d: Distinct) => d.patterns.filter((p) => !EL_PATTERNS.includes(p.id)).slice(0, 3);
export function ChartTop({
  name,
  chart,
  year,
  weights,
  distinct,
}: {
  name: string;
  chart: Parameters<typeof SajuChart>[0];
  year?: { y: number; hanja: string; gods: [string, string] };
  weights?: number[];
  distinct?: Distinct | null;
}) {
  const wsum = weights ? weights.reduce((a, b) => a + b, 0) || 1 : 1;
  const ranks = weights?.map((w, e) => elementRank(e, w / wsum));
  const rare = distinct ? topRare(distinct) : [];
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">命 盤</p>
      <h2 className="mt-1 text-center font-myeongjo text-[18px] font-extrabold">{name}님의 사주팔자</h2>
      <p className="mt-1 text-center text-[11.5px] text-ink-soft">이 여덟 글자로 아래 보고서를 썼어요</p>
      <SajuChart {...chart} kingdom={false} weights={weights} ranks={ranks} />
      {(distinct?.ilju || rare.length > 0) && (
        <div className="mt-3 rounded-lg bg-white/60 px-3 py-2.5 ring-1 ring-seal/15">
          <p className="text-[11.5px] font-extrabold text-seal">다른 사람과 견주면</p>
          {distinct?.ilju && (
            <p className="mt-1 text-[12.5px] leading-snug">
              같은 {distinct.ilju.name}일주 가운데서도 <b>{distinct.ilju.build}</b> 구조는{" "}
              <b className="text-seal">약 {Math.max(1, Math.round(distinct.ilju.rate * 100))}%</b>뿐이에요
            </p>
          )}
          <ul className="mt-1.5 flex flex-col gap-1">
            {rare.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-2 text-[12.5px]">
                <span className="min-w-0">{p.plain}</span>
                <b className="shrink-0 text-seal">{perHundred(p.rate)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      {year && (
        <p className="mt-3 rounded-lg bg-seal/5 px-3 py-2 text-center text-[13px] leading-relaxed">
          {year.y}년에 들어오는 두 글자{" "}
          <b className="font-myeongjo text-[16px] text-seal">{year.hanja}</b>
          <span className="block text-[11.5px] text-ink-soft">
            {name}님에게는{" "}
            {GROUP_OF[year.gods[0] as TenGod] === GROUP_OF[year.gods[1] as TenGod]
              ? `'${GROUP_WORD[GROUP_OF[year.gods[0] as TenGod]]}'의 기운이 겹쳐 들어와요`
              : `'${GROUP_WORD[GROUP_OF[year.gods[0] as TenGod]]}', '${GROUP_WORD[GROUP_OF[year.gods[1] as TenGod]]}'의 기운으로 들어와요`}
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
              {m.tags.length > 0 && <span className="mt-1 block text-[10px] leading-tight text-ink-soft">{tagWords(m.tags)}</span>}
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
  돈: "돈 들어오기 좋은 달",
  일: "일이 잘 풀리고 자리가 생기기 좋은 달",
  사랑: "인연이 닿고 마음이 통하기 좋은 달",
  사람: "도와주는 사람을 만나기 좋은 달",
  몸: "몸을 아껴야 하는 달",
};

// One area of a year (돈, 일…): its own grade on the five steps, what made that grade, and the months its stars
// fall in. Each area chapter shows only its own, so no two chapters carry the same picture.
export function AreaFigure({ area, preview, months, y }: { area: string; preview: YearPreview; months: MonthMark[]; y: number }) {
  const a = preview.areas.find((x) => x.area === area);
  if (!a) return null;
  const g = GRADES5.indexOf(a.grade5);
  return (
    <Frame title={`${y}년 ${AREA_WHAT[area] ?? area}, 왜 이 판정일까`} sub="그해 들어오는 기운과 내 사주가 만나는 곳으로 봤어요">
      <ol className="grid grid-cols-5 gap-1 text-center">
        {GRADES5.map((x, i) => (
          <li key={x} className={`rounded-md px-0.5 py-1.5 text-[11px] leading-tight font-bold ${i === g ? `${SCALE5_CHIP[i]} ring-2 ring-seal/40` : "bg-ink/5 text-ink-soft opacity-60"}`}>
            {x}
          </li>
        ))}
      </ol>
      {a.why.length === 0 && <p className="mt-3 rounded-lg bg-white/60 px-2.5 py-1.5 text-[12.5px] ring-1 ring-seal/10">올해는 이쪽을 크게 밀거나 막는 기운이 없어요. 평소 하던 대로 가면 되는 해예요.</p>}
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
    ["사람 도움이 필요한 일", "도와주는 사람이 오는 달", at((m) => m.tags.includes("귀인")), true],
    ["큰 결정은 미루기", "✕ 조심할 달", at((m) => m.rating === 0), false],
    ["생활이 흔들리기 쉬움", "변화가 큰 달", at((m) => m.tags.includes("변동")), false],
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
      {months[i].tags.length > 0 && <span className="mt-0.5 block text-[11.5px]">{tagWords(months[i].tags)}</span>}
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
              {m && (
                <span className={`mt-1 inline-block rounded px-1 text-[10.5px] font-bold ${soft ? "bg-seal/15 text-seal" : "bg-ink text-hanji"}`}>
                  {soft ? "가까워짐" : m === "충" ? "흔들림" : "마음 쓸 일"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {yearGods && (
        <ul className="mt-3 flex flex-col gap-1 text-[12.5px]">
          <li className="rounded-lg bg-seal/8 px-2.5 py-1.5">
            올해 들어오는 기운은 <b className="text-seal">{[...new Set(yearGods.map((g) => WHOSE[GROUP_OF[g as TenGod]]))].join(", ")}</b> 쪽을 뜻해요. 그쪽 일이
            늘거나 눈에 띄기 쉬운 해예요.
          </li>
        </ul>
      )}
      {quiet && <p className="mt-2 text-[12px]">{y}년 기운은 가족의 네 자리 어디도 크게 건드리지 않아요. 집안은 큰 변동 없이 흘러가는 쪽이에요.</p>}
      {meets && !quiet && <p className="mt-2 text-[11px] text-ink-soft">가까워짐은 도움이 오가는 자리, 흔들림·마음 쓸 일은 올해 신경 써 줄 자리예요.</p>}
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

// 10년 대운 속의 이 해: the decade, how the year sits with it, and what the year touches in the chart, in words.
const feelOf = (m: string) => (m.includes("합") ? "tie" : m === "충" ? "clash" : m === "공망" ? "" : "rub");
const SEAT_PLAIN: Record<string, string> = { 연지: "바깥 관계·윗사람", 월지: "일터·부모", 일지: "나·배우자", 시지: "자녀·아랫사람", 일간: "나 자신" };
const FEEL_WORD: Record<string, string> = { tie: "가까워져요", clash: "흔들려요", rub: "마음 쓸 일이 생겨요" };
export function DecadeLayerFigure({ layers, decade }: { layers: Layers; decade: { mood: string; theme: string } | null }) {
  if (!layers.daeun) return null;
  const withDecade = layers.year.daeun.map((t) => feelOf(t.split(" ").at(-1)!));
  const fit = withDecade.includes("clash")
    ? "10년 흐름과 부딪히는 해예요. 계획이 틀어지기 쉬우니 일정에 여유를 두세요."
    : withDecade.includes("tie")
      ? "10년 흐름과 손발이 맞는 해예요. 이 10년에 하려던 일을 밀고 가기 좋아요."
      : withDecade.includes("rub")
        ? "10년 흐름과 살짝 엇박자가 나는 해예요. 속도를 조금 늦추면 편해요."
        : "10년 흐름을 그대로 이어 가는 해예요.";
  const touched = [
    ...new Map(
      layers.year.natal
        .map((t) => [SEAT_PLAIN[t.slice(0, 2)], feelOf(t.split(" ").at(-1)!)] as const)
        .filter(([seat, f]) => seat && f)
        .map(([seat, f]) => [`${seat}${f}`, { seat, f }]),
    ).values(),
  ];
  return (
    <Frame title="10년 흐름 속의 이 해" sub="한 해는 지금의 10년(대운) 위에 겹쳐서 읽어요">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        <li className="rounded-lg bg-seal/8 px-2.5 py-1.5">
          <b className="text-seal">지금의 10년</b>{" "}
          <span className="text-ink-soft">
            {layers.daeun.from}~{layers.daeun.to}
            {decade ? ` · ${decade.mood}` : ""}
          </span>
          {decade && <span className="mt-0.5 block text-[12px]">{decade.theme}</span>}
        </li>
        <li className="rounded-lg bg-seal/15 px-2.5 py-1.5 ring-1 ring-seal/30">
          <b className="text-seal">이 해와 10년 흐름</b>
          <span className="mt-0.5 block text-[12px]">{fit}</span>
        </li>
        <li className="rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-seal/10">
          <b>이 해가 건드리는 곳</b>
          {touched.length ? (
            touched.map(({ seat, f }) => (
              <span key={seat + f} className="mt-0.5 block text-[12px]">
                {seat} 쪽이 {FEEL_WORD[f]}
              </span>
            ))
          ) : (
            <span className="mt-0.5 block text-[12px]">크게 건드리는 곳 없이 조용히 지나가는 해예요.</span>
          )}
        </li>
      </ol>
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
// weights: the weighted shares the free screen quotes (lib/rarity.ts), so the two never show two numbers.
export function ElementsFigure({ name, elements, weights }: { name: string; elements: number[]; weights?: number[] }) {
  const sum = elements.reduce((a, b) => a + b, 0) || 1;
  const pct = weights ? weights.map((w) => Math.round(w * 100)) : elements.map((e) => Math.round((e / sum) * 100));
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
export function RareFigure({ name, d, areas, skipTop = false }: { name: string; d: Distinct; areas?: string[]; skipTop?: boolean }) {
  const shown = skipTop ? topRare(d).map((p) => p.id) : [];
  const pool = d.patterns.filter((p) => !shown.includes(p.id));
  const items = (areas ? pool.filter((p) => areas.includes(p.area)) : pool).slice(0, 3);
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
  // What each lends the other is listed in chapter 2 (the two people); here, the one element each needs most.
  const give = (x: number) => (pct(x) < 5 ? "거의 없어요" : `${pct(x)}% 들어 있어요`);
  return (
    <Frame title="꼭 필요한 기운, 서로 쥐고 있을까" sub="각자 사주의 균형을 잡아 주는 기운이 상대에게 얼마나 있는지예요">
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        <li className="rounded-lg bg-seal/8 px-2.5 py-1.5">
          <b className="text-seal">{a}님에게 필요한 기운</b> · {b}님 사주에 {give(c.yongGive[0])}
        </li>
        <li className="rounded-lg bg-seal/8 px-2.5 py-1.5">
          <b className="text-seal">{b}님에게 필요한 기운</b> · {a}님 사주에 {give(c.yongGive[1])}
        </li>
        {c.sharedLack.length > 0 && (
          <li className="rounded-lg bg-ink/5 px-2.5 py-1.5">
            <b>둘 다 모자람</b> {c.sharedLack.map((e) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`).join(" · ")} · 함께 밖에서 채워야 하는 기운
          </li>
        )}
      </ul>
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

// The 'when' chapter of a topic report (돈이 트이는 때, 결혼은 언제, 이직·창업 언제): the ten-year table is open above,
// so here only its answer: the nearest good years, and the year to get through, with why in plain words.
const plainWhy = (w: string) => w.replace(/\s?\((용신|기신|겁재|배우자성|상관|관성|상관견관|식상|재성|인성|비겁)\)/g, "").replace(/^(도화|역마|화개|천을귀인): /, "");
export function WhenFigure({ years, title }: { years: DecadeYear[]; title: string }) {
  const best = years.filter((y) => y.grade === 2).slice(0, 2);
  const good = best.length ? best : years.filter((y) => y.grade === 1).slice(0, 2);
  const watch = years.filter((y) => y.grade === -1).slice(0, 1);
  if (!good.length && !watch.length) return null;
  const row = (y: DecadeYear, on: boolean) => (
    <li key={y.year} className={`rounded-lg px-2.5 py-2 ${on ? "bg-seal/10 ring-1 ring-seal/30" : "bg-ink/5"}`}>
      <b className="font-myeongjo">
        {on ? (y.grade === 2 ? "◎" : "○") : "✕"} {y.year}년
      </b>{" "}
      <span className="text-ink-soft">· {y.tag}</span>
      {y.why.length > 0 && <span className="mt-0.5 block text-[11.5px]">{y.why.map(plainWhy).join(" · ")}</span>}
    </li>
  );
  return (
    <Frame title={title} sub="위 10년 달력에서 이 장의 답만 골랐어요">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {good.map((y) => row(y, true))}
        {watch.map((y) => row(y, false))}
      </ol>
    </Frame>
  );
}

// 택일 '흔한 길일표와 다른 점': how the almanac's days narrowed down to these, step by step. The chosen days, their
// reasons and hours are open above the report, so the chapters do not repeat them.
export function SieveFigure({ days, names }: { days: DayPick[]; names: string }) {
  const fit = days.filter((d) => d.fit);
  const clashed = fit.filter((d) => d.warns.some((w) => w.tag.includes("충")));
  const good = fit.filter((d) => d.grade >= 1);
  const best = fit.filter((d) => d.grade === 2);
  if (!fit.length) return null;
  const steps: [string, number, string][] = [
    ["기간 안의 모든 날", days.length, ""],
    ["책력이 이 일에 맞다고 한 날", fit.length, "흔한 길일표는 여기까지예요"],
    ["그중 사주와 부딪혀 뺀 날", clashed.length, `${names} 사주와 정면으로 부딪히는 날`],
    ["써도 좋은 날", good.length, ""],
    ["그중 가장 좋은 날(◎)", best.length, ""],
  ];
  const max = days.length || 1;
  return (
    <Frame title="길일표에서 내 날까지" sub="같은 길일표도 사주를 대 보면 이만큼 걸러져요">
      <ol className="flex flex-col gap-1.5 text-[12.5px]">
        {steps.map(([what, n, note], i) => (
          <li key={what} className="grid grid-cols-[1fr_2.6rem] items-center gap-2">
            <span>
              <span className={i === 2 ? "font-bold" : i >= 3 ? "font-bold text-seal" : ""}>{what}</span>
              {note && <span className="block text-[10.5px] text-ink-soft">{note}</span>}
              <span className="mt-0.5 block h-2 rounded-full bg-ink/8">
                <span className={`block h-2 rounded-full ${i === 2 ? "bg-ink/50" : i >= 3 ? "bg-seal" : "bg-seal/35"}`} style={{ width: `${Math.max(3, (n / max) * 100)}%` }} />
              </span>
            </span>
            <b className="text-right tabular-nums">{n}일</b>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
