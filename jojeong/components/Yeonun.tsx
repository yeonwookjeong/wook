import type { Mood } from "@/lib/freeReading";
import Link from "next/link";
import type { YearDetail, YearRow, Verdict } from "@/lib/yeonun";

// 연운's free screens: the list of years (past, this year, ahead) and the top of one year. Computed only.

const VERDICT_STYLE: Record<Verdict, string> = {
  대길: "bg-seal text-hanji",
  길: "bg-seal/15 text-seal",
  평: "bg-gold/15 text-ink",
  조심: "bg-ink/10 text-ink",
  인내: "bg-ink text-hanji",
};
const RATING = [
  { mark: "✕", label: "고비", cls: "bg-ink text-hanji" },
  { mark: "△", label: "조심", cls: "bg-ink/10 text-ink" },
  { mark: "○", label: "무난", cls: "bg-gold/15 text-ink" },
  { mark: "◎", label: "좋음", cls: "bg-seal text-hanji" },
] as const;

function Row({ r, href, owned }: { r: YearRow; href: string; owned: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 border-b border-seal/10 py-2.5 last:border-b-0 ${r.when === "past" ? "opacity-75" : ""} ${r.when === "now" ? "-mx-2 rounded-xl bg-gold/10 px-2" : ""}`}
      >
        <span className="w-14 shrink-0">
          <b className="block font-myeongjo text-[15px] leading-tight">{r.year}</b>
          <span className="block text-[11px] text-ink-soft">
            {r.ko.replace("년", "")}
            {r.age !== null && r.age >= 0 ? ` · ${r.age}세` : ""}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">
            {r.theme}
            {r.when === "now" && <span className="ml-1 text-[11px] text-seal">올해</span>}
            {r.turning && <span className="ml-1 text-[11px] text-gold">대운 바뀜</span>}
          </span>
          <span className="block text-[12px] leading-snug text-ink-soft">{r.line}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${VERDICT_STYLE[r.verdict]}`}>{r.verdict}</span>
          {owned && <span className="text-[10px] font-bold text-seal">결제함</span>}
        </span>
      </Link>
    </li>
  );
}

type Decade = { from: number; to: number; age: string; mood: Mood; theme: string; line: string; young: boolean; now: boolean };
const MOOD_MARK = { 활짝: "◎◎", 기회: "◎", 무난: "○", 다지기: "△", 버티기: "▽" } as const;
const isGood = (m: Mood) => m === "활짝" || m === "기회";

// A decade header: the ground the years below stand on, as the free life flow grades it.
function DecadeHead({ d }: { d: Decade }) {
  return (
    <li className="mt-3 mb-1 flex items-baseline gap-2 rounded-lg bg-ink/5 px-2 py-1.5 text-[12px]">
      <b className={isGood(d.mood) ? "text-seal" : "text-ink"}>
        {d.young ? "" : `${MOOD_MARK[d.mood]} `}{d.from}~{d.to}{d.age ? ` (${d.age})` : ""}
      </b>
      <span className="text-ink-soft">{d.line}</span>
    </li>
  );
}

const MOOD_WORD = { 활짝: "크게 좋은 10년", 기회: "좋은 10년", 무난: "무난한 10년", 다지기: "다지는 10년", 버티기: "버티는 10년" } as const;

// "When is my 대운?": every ten-year stretch of the life at a glance, with the good ones named in one sentence.
// In everyday speech 대운 means the big lucky stretch, so the ◎ decades are called that plainly.
function DecadeStrip({ name, decades }: { name: string; decades: Decade[] }) {
  const good = decades.filter((d) => isGood(d.mood) && !d.young);
  const now = decades.find((d) => d.now);
  const nextGood = good.find((d) => now && d.from > now.to);
  return (
    <div className="mt-4 rounded-2xl border border-seal/25 bg-white/60 px-4 py-4">
      <h3 className="font-myeongjo text-[16px] font-extrabold">{name}님의 대운은 언제일까</h3>
      <p className="mt-1.5 text-[14px] leading-[1.75]">
        {good.length ? (
          <>
            흔히 &lsquo;대운이 들어왔다&rsquo;고 하는 좋은 10년은{" "}
            {good.map((d, i) => (
              <span key={d.from}>
                {i > 0 && ", "}
                <b className="text-seal">
                  {d.from}~{d.to}년{d.age ? `(${d.age})` : ""}
                </b>
              </span>
            ))}
            이에요.{" "}
            {now && isGood(now.mood)
              ? "지금이 바로 그 10년 안이에요."
              : nextGood
                ? `다음 좋은 10년은 ${nextGood.from}년 무렵부터 열려요.`
                : "좋은 10년은 이미 지나왔지만, 그 안에서도 좋은 해는 따로 와요."}
          </>
        ) : (
          "평생 크게 치우친 10년 없이 고르게 흘러가는 사주예요. 그래서 한 해 한 해의 운이 더 크게 드러나요."
        )}
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {decades.map((d) => (
          <li
            key={d.from}
            className={`flex items-baseline gap-2 rounded-lg px-2 py-1 text-[13px] ${d.now ? "bg-gold/15 font-bold" : ""} ${isGood(d.mood) ? "text-seal" : ""}`}
          >
            <span className="w-6 shrink-0">{d.young ? "" : MOOD_MARK[d.mood]}</span>
            <span className="w-[5.5rem] shrink-0 tabular-nums">
              {d.from}~{d.to}
            </span>
            <span className="w-14 shrink-0 text-ink-soft">{d.age}</span>
            <span className="min-w-0 flex-1">
              {d.young ? "자라는 시기" : MOOD_WORD[d.mood]}
              {d.now ? " · 지금" : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
        대운은 10년마다 바뀌는 인생의 큰 흐름(기후)이고, 아래 해마다의 운은 그 위의 날씨예요. 좋은 10년 안에도 조심할 해가 있고, 그래도 바탕이 받쳐 줘서 덜
        흔들려요. 대운은 1월 1일이 아니라 태어난 날 무렵에 바뀌어요.
      </p>
    </div>
  );
}

// Rows with a decade header wherever a new decade begins (or at the top of the list).
function Rows({ rows, decades, hrefOf, owned }: { rows: YearRow[]; decades: Decade[] | null; hrefOf: (y: number) => string; owned: number[] }) {
  const decadeOf = (y: number) => decades?.find((x) => x.from <= y && y <= x.to);
  return (
    <ul className="mt-1">
      {rows.flatMap((r, i) => {
        const d = decadeOf(r.year);
        const head = d && (i === 0 || decadeOf(rows[i - 1].year) !== d) ? [<DecadeHead key={`d${d.from}`} d={d} />] : [];
        return [...head, <Row key={r.year} r={r} href={hrefOf(r.year)} owned={owned.includes(r.year)} />];
      })}
    </ul>
  );
}

export function YearList({
  name,
  rows,
  decades,
  hrefOf,
  owned,
}: {
  name: string;
  rows: YearRow[];
  decades: Decade[] | null;
  hrefOf: (y: number) => string;
  owned: number[];
}) {
  const past = rows.filter((r) => r.when === "past");
  const ahead = rows.filter((r) => r.when !== "past");
  const recent = past.slice(-3);
  const older = past.slice(0, -3);
  return (
    <section className="doc-paper mt-4 px-5 pt-6 pb-5">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">{name}님의 해마다 운세</h2>
      <p className="mt-1 text-center text-[12px] leading-relaxed text-ink-soft">
        해마다의 판정과 그 이유는 무료예요. 궁금한 해를 누르면 달마다의 흐름까지 보여 드려요.
      </p>
      {decades && <DecadeStrip name={name} decades={decades} />}
      <h3 className="mt-5 text-[12px] font-bold text-seal">올해와 앞으로</h3>
      <Rows rows={ahead} decades={decades} hrefOf={hrefOf} owned={owned} />
      {past.length > 0 && (
        <>
          <h3 className="mt-5 text-[12px] font-bold text-ink-soft">지나온 해</h3>
          <Rows rows={[...recent].reverse()} decades={decades} hrefOf={hrefOf} owned={owned} />
          {older.length > 0 && (
            <details className="group mt-1">
              <summary className="cursor-pointer list-none py-2 text-center text-[12px] font-bold text-ink-soft [&::-webkit-details-marker]:hidden">
                {older[0].year}~{older.at(-1)!.year}년 더 보기 <span className="inline-block transition group-open:rotate-180">▾</span>
              </summary>
              <Rows rows={[...older].reverse()} decades={decades} hrefOf={hrefOf} owned={owned} />
            </details>
          )}
        </>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
        대길 · 길 · 평 · 조심 · 인내 순이에요. 해는 1월 1일이 아니라 입춘(2월 4일 무렵)에 바뀌어요. 나이는 그해 생일이 지난 뒤의 만 나이예요.
      </p>
    </section>
  );
}

export function YearTop({ d, name, prev, next, list }: { d: YearDetail; name: string; prev: string | null; next: string | null; list: string }) {
  const monthName = (i: number) => `${d.months[i].from.split("/")[0]}월`;
  return (
    <>
      <nav className="mt-4 flex items-center justify-between text-[13px] font-bold">
        {prev ? (
          <Link href={prev} className="text-ink-soft">
            ← {d.year - 1}년
          </Link>
        ) : (
          <span />
        )}
        <Link href={list} className="text-seal">
          연도 목록
        </Link>
        {next ? (
          <Link href={next} className="text-ink-soft">
            {d.year + 1}년 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <section className="doc-paper mt-2 px-5 pt-6 pb-5 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">{d.hanja}</p>
        <h2 className="mt-1 font-myeongjo text-2xl font-extrabold">
          {name}님의 {d.year}년
        </h2>
        <p className="mt-1 text-[12px] text-ink-soft">
          {d.ko}
          {d.age !== null && d.age >= 0 ? ` · ${d.age}세 무렵` : ""}
          {d.when === "past" ? " · 지나온 해" : d.when === "now" ? " · 올해" : " · 앞으로 올 해"}
        </p>
        <p className="mt-4">
          <span className={`rounded-lg px-3 py-1 font-myeongjo text-lg font-extrabold ${VERDICT_STYLE[d.verdict]}`}>{d.verdict}</span>
        </p>
        <p className="mt-4 font-myeongjo text-[17px] font-extrabold">{d.theme}</p>
        <p className="mt-1 text-[13px] leading-relaxed">{d.themeLine}</p>
        <p className="mt-2 text-[12px] text-ink-soft">{d.line}</p>
      </section>

      <section className="doc-paper mt-4 px-5 pt-6 pb-5">
        <h3 className="text-center font-myeongjo font-extrabold">{d.when === "past" ? "그해를 움직인 것" : "이 해를 움직이는 것"}</h3>
        <ul className="mt-3 flex flex-col gap-3 text-[15px] leading-[1.8]">
          {d.points.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-seal">·</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="doc-paper mt-4 px-5 pt-6 pb-5">
        <h3 className="text-center font-myeongjo font-extrabold">달마다 흐름</h3>
        <p className="mt-1 text-center text-[11px] text-ink-soft">달은 절기에 바뀌어요. 날짜는 그달이 시작되는 날이에요.</p>
        <ul className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          {d.months.map((m, i) => (
            <li key={m.from} className="rounded-xl border border-seal/15 bg-white/60 px-1 py-2">
              <span className="block text-[12px] font-bold">{monthName(i)}</span>
              <span className="block text-[10px] text-ink-soft">{m.from}~</span>
              <span className={`mt-1 inline-block rounded-md px-1.5 text-xs font-extrabold ${RATING[m.rating].cls}`}>{RATING[m.rating].mark}</span>
              {m.tags.length > 0 && <span className="mt-0.5 block text-[9px] leading-tight text-ink-soft">{m.tags.join("·")}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[12px]">
          가장 좋은 달 <b className="text-seal">{d.best.map(monthName).join("·")}</b> · 조심할 달 <b>{d.worst.map(monthName).join("·")}</b>
        </p>
      </section>
    </>
  );
}
