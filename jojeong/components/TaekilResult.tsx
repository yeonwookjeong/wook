import { bestDays, KINDS, ruledOut, verdictOf, weekendBest, type DayPick, type Kind, type Note } from "@/lib/taekil";

const MARK = { 2: "◎", 1: "○", 0: "△", [-1]: "✕" } as const;
const MARK_STYLE = { 2: "bg-seal text-hanji", 1: "bg-gold/25 text-ink", 0: "bg-ink/5 text-ink-soft", [-1]: "text-ink-soft/40" } as const;

function Why({ notes, bad }: { notes: Note[]; bad?: boolean }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {notes.map((n) => (
        <li key={n.tag} className="text-[13px] leading-relaxed">
          <b className={bad ? "text-ink-soft" : "text-seal"}>{bad ? "△ " : "✓ "}{n.tag}</b> <span className="text-ink/85">{n.why}</span>
        </li>
      ))}
    </ul>
  );
}

function Head({ d, rank }: { d: DayPick; rank?: number }) {
  return (
    <>
      <p className="flex items-baseline gap-2">
        {rank !== undefined && <span className="font-myeongjo text-sm font-extrabold text-seal">{"一二三"[rank]}</span>}
        <b className="font-myeongjo text-lg whitespace-nowrap">{d.label}</b>
        <span className={`ml-auto rounded-md px-1.5 text-xs font-extrabold ${MARK_STYLE[d.grade]}`}>{MARK[d.grade]}</span>
      </p>
      <p className="text-xs text-ink-soft">
        {d.lunar} · {d.gz}
        {d.weekend && " · 주말"}
      </p>
    </>
  );
}

// A day with everything that decided it: one line of verdict, then each sign in plain words.
function DayCard({ d, kind, rank }: { d: DayPick; kind: Kind; rank?: number }) {
  return (
    <li className="rounded-2xl border border-seal/20 bg-white/60 px-4 py-3">
      <Head d={d} rank={rank} />
      <p className="mt-2 text-[13px] leading-relaxed font-bold">{verdictOf(d, kind)}</p>
      <Why notes={d.reasons} />
      {d.warns.length > 0 && <Why notes={d.warns} bad />}
      {d.hours.length > 0 && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
          <b className="text-ink">좋은 시간</b> {d.hours.join(", ")}
        </p>
      )}
    </li>
  );
}

// The same card folded, for the long list of the paid calendar.
function FoldCard({ d, kind }: { d: DayPick; kind: Kind }) {
  return (
    <li className="rounded-2xl border border-seal/20 bg-white/60 px-4 py-3">
      <details>
        <summary className="cursor-pointer list-none">
          <Head d={d} />
          <p className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {d.reasons.map((r) => (
              <span key={r.tag} className="rounded-full bg-seal/8 px-2 py-0.5 text-seal">
                {r.tag}
              </span>
            ))}
            <span className="ml-auto text-ink-soft">풀이 ▾</span>
          </p>
        </summary>
        <p className="mt-2 text-[13px] leading-relaxed font-bold">{verdictOf(d, kind)}</p>
        <Why notes={d.reasons} />
        {d.warns.length > 0 && <Why notes={d.warns} bad />}
        {d.hours.length > 0 && <p className="mt-2 text-[12px] text-ink-soft">좋은 시간 {d.hours.join(", ")}</p>}
      </details>
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

const HOW = [
  "책력(통서)이 이 일에 맞다고 한 날만 후보로 올려요.",
  "그날을 지키는 신이 황도(길한 신)인지 흑도인지, 건제십이신과 28수 별자리가 무엇인지로 점수를 매겨요.",
  "사주와 부딪히는(충) 날은 빼고, 사주에 필요한 기운이 들어오거나 합이 드는 날에 점수를 더해요.",
  "좋은 시간은 그날의 황도시 가운데 낮 시간이고, 사주와 부딪히는 시간은 뺐어요.",
];

export default function TaekilResult({ kind, days, label, names, full }: { kind: Kind; days: DayPick[]; label: string; names: string; full: boolean }) {
  const best = bestDays(days, kind);
  const good = days.filter((d) => d.grade >= 1).sort((a, b) => a.date.localeCompare(b.date));
  const weekend = kind === "open" ? [] : weekendBest(days);
  const out = ruledOut(days);
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].map((ym) => days.filter((d) => d.date.startsWith(ym)));
  const fit = days.filter((d) => d.fit).length;
  return (
    <>
      <section className="doc-paper mt-4 px-5 pt-6 pb-5">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">{KINDS[kind].title} · 가장 좋은 날 세 개</h2>
        <p className="mt-1 text-center text-xs text-ink-soft">
          {label} · 책력상 {KINDS[kind].label}에 맞는 날 {fit}일 가운데 {names} 사주로 한 번 더 골랐어요
        </p>
        {best.length ? (
          <ol className="mt-4 flex flex-col gap-2">
            {best.map((d, i) => (
              <DayCard key={d.date} d={d} kind={kind} rank={i} />
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-center text-sm">이 기간에는 뚜렷한 길일이 없어요. 기간을 넓혀 다시 찾아보세요.</p>
        )}
        <details className="mt-4 text-[12px] leading-relaxed text-ink-soft">
          <summary className="cursor-pointer font-bold text-ink">어떻게 골랐나요? ▾</summary>
          <ol className="mt-2 list-decimal pl-4">
            {HOW.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </details>
      </section>

      {full && (
        <>
          {weekend.length > 0 && (
            <section className="doc-paper mt-4 px-5 pt-6 pb-5">
              <h2 className="text-center font-myeongjo text-lg font-extrabold">주말에 잡을 수 있는 좋은 날</h2>
              <p className="mt-1 text-center text-[11px] text-ink-soft">평일이 어렵다면 이 가운데서 고르세요</p>
              <ul className="mt-4 flex flex-col gap-2">
                {weekend.map((d) => (
                  <FoldCard key={d.date} d={d} kind={kind} />
                ))}
              </ul>
            </section>
          )}

          <section className="doc-paper mt-4 px-5 pt-6 pb-5">
            <h2 className="text-center font-myeongjo text-lg font-extrabold">기간 전체 택일 달력</h2>
            <p className="mt-1 text-center text-[11px] text-ink-soft">◎ 길일 · ○ 무난 · △ 애매 · 점(·)은 피할 날이나 책력상 맞지 않는 날</p>
            {months.map((m) => (
              <Month key={m[0].date} days={m} />
            ))}
            <h3 className="mt-6 font-myeongjo font-extrabold">써도 좋은 날 {good.length}일</h3>
            <p className="text-[11px] text-ink-soft">날짜를 누르면 그날이 좋은 이유가 펼쳐져요</p>
            <ul className="mt-2 flex flex-col gap-2">
              {good.map((d) => (
                <FoldCard key={d.date} d={d} kind={kind} />
              ))}
            </ul>
          </section>

          {out.length > 0 && (
            <section className="doc-paper mt-4 px-5 pt-6 pb-5">
              <h2 className="text-center font-myeongjo text-lg font-extrabold">책력에는 좋다는데, 빼 둔 날</h2>
              <p className="mt-1 text-center text-[11px] leading-relaxed text-ink-soft">
                책력(통서)은 이 일에 맞다고 하지만 {names} 사주와 부딪혀서 뺀 날이에요. 흔한 길일표에서 이 날을 권하더라도 한 번 더 생각해 보세요.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {out.map((d) => (
                  <li key={d.date} className="rounded-2xl border border-ink/10 px-4 py-3">
                    <Head d={d} />
                    <Why notes={d.warns.filter((w) => w.tag.includes("충"))} bad />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-4 px-1 text-[11px] leading-relaxed text-ink-soft">
            황도일·건제십이신·28수는 전통 책력(통서)의 풀이이고, 충은 사주의 일지나 띠와 부딪히는 날이에요. 날짜를 정하는 건 결국 사람의 사정이 먼저예요.
            좋은 날이 사정에 안 맞으면 ○ 무난한 날도 충분히 괜찮아요.
          </p>
        </>
      )}
    </>
  );
}
