import { bestDays, KINDS, type DayPick, type Kind } from "@/lib/taekil";

const MARK = { 2: "◎", 1: "○", 0: "△", [-1]: "✕" } as const;
const MARK_STYLE = { 2: "bg-seal text-hanji", 1: "bg-gold/25 text-ink", 0: "bg-ink/5 text-ink-soft", [-1]: "text-ink-soft/40" } as const;

function DayCard({ d, rank }: { d: DayPick; rank?: number }) {
  return (
    <li className="rounded-2xl border border-seal/20 bg-white/60 px-4 py-3">
      <p className="flex items-baseline gap-2">
        {rank !== undefined && <span className="font-myeongjo text-sm font-extrabold text-seal">{"一二三"[rank]}</span>}
        <b className="font-myeongjo text-lg whitespace-nowrap">{d.label}</b>
        <span className={`ml-auto rounded-md px-1.5 text-xs font-extrabold ${MARK_STYLE[d.grade]}`}>{MARK[d.grade]}</span>
      </p>
      <p className="text-xs text-ink-soft">
        {d.lunar} · {d.gz}
      </p>
      <p className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
        {d.reasons.map((r) => (
          <span key={r} className="rounded-full bg-seal/8 px-2 py-0.5 text-seal">
            {r}
          </span>
        ))}
        {d.warns.map((w) => (
          <span key={w} className="rounded-full bg-ink/5 px-2 py-0.5 text-ink-soft">
            {w}
          </span>
        ))}
      </p>
      {d.hours.length > 0 && <p className="mt-1.5 text-[12px] text-ink-soft">좋은 시간 {d.hours.join(", ")}</p>}
    </li>
  );
}

// One month as a calendar of marks.
function Month({ days }: { days: DayPick[] }) {
  const [y, m] = days[0].date.split("-").map(Number);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const byDay = new Map(days.map((d) => [Number(d.date.slice(8)), d]));
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (
    <div className="mt-4">
      <p className="font-myeongjo font-extrabold">
        {y}년 {m}월
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[12px]">
        {"일월화수목금토".split("").map((w) => (
          <span key={w} className="text-[10px] text-ink-soft">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: len }, (_, i) => {
          const d = byDay.get(i + 1);
          return (
            <span key={i} className={`rounded-md py-1 ${d ? MARK_STYLE[d.grade] : "text-ink-soft/30"}`}>
              {i + 1}
              <span className="block text-[10px] leading-none">{d ? (d.grade >= 0 ? MARK[d.grade] : "·") : ""}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function TaekilResult({ kind, days, label, full }: { kind: Kind; days: DayPick[]; label: string; full: boolean }) {
  const best = bestDays(days, kind);
  const good = days.filter((d) => d.grade >= 1).sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].map((ym) => days.filter((d) => d.date.startsWith(ym)));
  return (
    <>
      <section className="doc-paper mt-4 px-5 pt-6 pb-5">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">{KINDS[kind].title} · 가장 좋은 날 세 개</h2>
        <p className="mt-1 text-center text-xs text-ink-soft">
          {label} · 책력상 {KINDS[kind].label}에 맞는 날 {days.filter((d) => d.fit).length}일 가운데
        </p>
        {best.length ? (
          <ol className="mt-4 flex flex-col gap-2">
            {best.map((d, i) => (
              <DayCard key={d.date} d={d} rank={i} />
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-center text-sm">이 기간에는 뚜렷한 길일이 없어요. 기간을 넓혀 다시 찾아보세요.</p>
        )}
      </section>

      {full && (
        <section className="doc-paper mt-4 px-5 pt-6 pb-5">
          <h2 className="text-center font-myeongjo text-lg font-extrabold">기간 전체 택일 달력</h2>
          <p className="mt-1 text-center text-[11px] text-ink-soft">◎ 길일 · ○ 무난 · △ 애매 · 점(·)은 피할 날이나 책력상 맞지 않는 날</p>
          {months.map((m) => (
            <Month key={m[0].date} days={m} />
          ))}
          <h3 className="mt-6 font-myeongjo font-extrabold">써도 좋은 날 {good.length}일</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {good.map((d) => (
              <DayCard key={d.date} d={d} />
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
            황도일·건제십이신·28수는 전통 책력(통서)의 풀이이고, 충은 내 사주의 배우자 자리(일지)나 띠와 부딪히는 날이에요. 날짜를 정하는 건 결국
            사람의 사정이 먼저예요. 좋은 날이 사정에 안 맞으면 ○ 무난한 날도 충분히 괜찮아요.
          </p>
        </section>
      )}
    </>
  );
}
