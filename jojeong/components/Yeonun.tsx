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

export function YearList({ name, rows, hrefOf, owned }: { name: string; rows: YearRow[]; hrefOf: (y: number) => string; owned: number[] }) {
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
      <h3 className="mt-5 text-[12px] font-bold text-seal">올해와 앞으로</h3>
      <ul className="mt-1">
        {ahead.map((r) => (
          <Row key={r.year} r={r} href={hrefOf(r.year)} owned={owned.includes(r.year)} />
        ))}
      </ul>
      {past.length > 0 && (
        <>
          <h3 className="mt-5 text-[12px] font-bold text-ink-soft">지나온 해</h3>
          <ul className="mt-1">
            {[...recent].reverse().map((r) => (
              <Row key={r.year} r={r} href={hrefOf(r.year)} owned={owned.includes(r.year)} />
            ))}
          </ul>
          {older.length > 0 && (
            <details className="group mt-1">
              <summary className="cursor-pointer list-none py-2 text-center text-[12px] font-bold text-ink-soft [&::-webkit-details-marker]:hidden">
                {older[0].year}~{older.at(-1)!.year}년 더 보기 <span className="inline-block transition group-open:rotate-180">▾</span>
              </summary>
              <ul>
                {[...older].reverse().map((r) => (
                  <Row key={r.year} r={r} href={hrefOf(r.year)} owned={owned.includes(r.year)} />
                ))}
              </ul>
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
        <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed">
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
