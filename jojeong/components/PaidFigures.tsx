import type { PairYears } from "@/lib/pairYears";
import type { YearRow } from "@/lib/yeonun";

// Pictures inside the chapters of a bought report (v8 on, app/reports/[id]): worked out from the charts, the
// same numbers the writer was told, so the text and the picture agree.

export function Frame({ title, sub, note, children }: { title: string; sub?: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white/50 px-3.5 pt-4 pb-3 ring-1 ring-seal/15">
      <h3 className="text-center font-myeongjo text-[16px] font-extrabold">{title}</h3>
      {sub && <p className="mt-0.5 text-center text-[11px] text-ink-soft">{sub}</p>}
      <div className="mt-3">{children}</div>
      {note && <p className="mt-2.5 text-[10.5px] leading-snug text-ink-soft">{note}</p>}
    </section>
  );
}

const V_STYLE: Record<string, string> = {
  대길: "bg-seal text-hanji",
  길: "bg-seal/25 text-seal",
  평: "bg-ink/10 text-ink",
  조심: "bg-[#d4af5f]/35 text-ink",
  인내: "bg-ink text-hanji",
};
const MARK_STYLE: Record<string, string> = {
  "정이 깊어지는 해": "bg-seal text-hanji",
  "함께 좋은 해": "bg-seal/25 text-seal",
  "무난한 해": "bg-ink/8 text-ink",
  "한쪽 흔들림": "bg-[#d4af5f]/35 text-ink",
  "함께 조심": "bg-ink/20 text-ink",
  "관계가 흔들리기 쉬운 해": "bg-ink text-hanji",
};

// 궁합: the two people's ten years.
export function PairYearsFigure({ x, a, b }: { x: PairYears; a: string; b: string }) {
  return (
    <Frame
      title="우리 둘의 10년"
      sub={`${a}님과 ${b}님, 해마다 각자의 운과 ${x.seat}에 드는 기운`}
      note="각자의 칸은 그 사람의 한 해 판정(대길·길·평·조심·인내)이에요. 맨 오른쪽은 두 사람에게 그해가 어떤지예요."
    >
      <div className="grid grid-cols-[2.6rem_2.6rem_2.6rem_1fr] items-center gap-x-1.5 gap-y-1 text-center text-[11.5px]">
        <span className="text-[11px] font-bold text-ink-soft">해</span>
        <span className="truncate text-[11px] font-bold text-ink-soft">{a}</span>
        <span className="truncate text-[11px] font-bold text-ink-soft">{b}</span>
        <span className="text-[11px] font-bold text-ink-soft">두 사람</span>
        {x.rows.map((r) => (
          <div key={r.year} className="contents">
            <span className={`font-myeongjo font-bold ${r.now ? "text-seal" : ""}`}>
              {r.year}
              <span className="block text-[10.5px] font-normal text-ink-soft">{r.gz}</span>
            </span>
            <span className={`rounded-md py-1 font-bold ${V_STYLE[r.me]}`}>{r.me}</span>
            <span className={`rounded-md py-1 font-bold ${V_STYLE[r.them]}`}>{r.them}</span>
            <span className={`rounded-md px-1.5 py-1 text-left leading-tight font-bold ${MARK_STYLE[r.mark]}`}>
              {r.mark}
              <span className="block text-[10.5px] font-normal opacity-80">{r.why}</span>
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// 평생 사주 "앞으로 10년": each year's verdict and what decides it.
export function YearsAheadFigure({ rows, name }: { rows: YearRow[]; name: string }) {
  return (
    <Frame title="앞으로 10년, 해마다" sub={`${name}님의 해마다 판정 · 연운 보고서와 같은 계산`} note="◆ 표시는 10년 대운이 바뀌는 해예요.">
      <ul className="flex flex-col divide-y divide-seal/10">
        {rows.map((r) => (
          <li key={r.year} className="flex items-start gap-2.5 py-2">
            <span className="w-11 shrink-0 font-myeongjo text-[13px] font-bold">
              {r.year}
              {r.turning && <span className="ml-0.5 text-seal">◆</span>}
              <span className="block text-[10.5px] font-normal text-ink-soft">{r.age !== null ? `${r.age}세 무렵` : r.ko}</span>
            </span>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${V_STYLE[r.verdict]}`}>{r.verdict}</span>
            <span className="min-w-0 text-[12px] leading-snug">
              <b className="block">{r.theme}</b>
              <span className="text-ink-soft">{r.line}</span>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
