import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { kstMonthNow, monthPillarOf, rankMonth, type IljuMonth } from "@/lib/iljuRank";
import { readMe } from "@/lib/me";

export const metadata: Metadata = {
  title: "이달의 일주 랭킹",
  description: "60일주 중 이번 달 운이 좋은 일주는? 절기로 바뀌는 사주의 한 달을 기준으로, 60일주 운세를 1위부터 60위까지 매달 새로 매겨요.",
};

// Free: the sixty day pillars ranked for this month (the 절기 month that begins in it), and the reader's own
// when a chart is saved. Computed from the month's pillar alone (lib/iljuRank.ts), no writer.
export default async function RankingPage() {
  const { y, m } = kstMonthNow();
  const mp = monthPillarOf(y, m)!;
  const rows = rankMonth(mp.stem, mp.branch);
  const me = await readMe();
  const mine = me ? rows.find((r) => r.stem === me.person.pillars.dayStem && r.branch === me.person.pillars.dayBranch) : null;
  const stars = (r: IljuMonth) => 5 - Math.floor((r.rank - 1) / 12);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">六十日柱</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">{m}월 60일주 랭킹</h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          사주의 {m}월은 <b>{mp.term}</b>부터, {mp.label}
          <span className="text-ink-soft">
            {" "}
            ({mp.from} ~ {mp.to})
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">무료 · 태어난 날의 두 글자(일주)로 본 간이 운세예요</p>
      </section>

      {mine ? (
        <section className="doc-paper mt-5 px-5 py-5 text-center">
          <p className="text-xs font-extrabold text-seal">{me!.person.name}님은 {mine.name}</p>
          <p className="mt-2 font-myeongjo text-4xl text-seal">{mine.hanja}</p>
          <p className="mt-1 font-myeongjo text-2xl font-extrabold">
            이번 달 <span className="text-seal">{mine.rank}위</span>
            <span className="ml-2 text-base tracking-wider text-gold">{"★".repeat(stars(mine)) + "☆".repeat(5 - stars(mine))}</span>
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">{mine.line}</p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
            일주는 여덟 글자 중 두 글자예요. 내 사주 전체로 본 이달의 흐름은
            <br />
            <Link href="/reports/yeonun" className="font-bold text-seal underline">
              연운 · 그해 운세
            </Link>
            에서 볼 수 있어요.
          </p>
        </section>
      ) : (
        <Link href="/" className="doc-paper mt-5 flex items-center gap-3 px-5 py-4">
          <span className="min-w-0 flex-1">
            <b className="block font-myeongjo">내 일주를 모르겠다면</b>
            <span className="block text-[12.5px] text-ink-soft">생년월일만 넣으면 무료 사주 분석에서 바로 알려 드려요</span>
          </span>
          <span className="shrink-0 text-xs font-bold text-seal">무료 →</span>
        </Link>
      )}

      <section className="mt-6">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">이달의 TOP 3</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {rows.slice(0, 3).map((r) => (
            <li key={r.no} className="doc-paper flex items-center gap-4 px-5 py-4">
              <span className="font-myeongjo text-2xl font-extrabold text-seal">{r.rank}</span>
              <span className="font-myeongjo text-3xl text-seal">{r.hanja}</span>
              <span className="min-w-0 flex-1">
                <b className="block font-myeongjo text-lg">{r.name}</b>
                <span className="block text-[12.5px] leading-snug text-ink-soft">{r.line}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="doc-paper mt-6 px-4 py-4">
        <h2 className="px-1 font-myeongjo text-lg font-extrabold">1위부터 60위까지</h2>
        <ol className="mt-2 flex flex-col">
          {rows.map((r) => (
            <li
              key={r.no}
              className={`flex items-start gap-3 border-t border-seal/10 px-1 py-2.5 ${mine?.no === r.no ? "bg-gold/15" : ""}`}
            >
              <span className={`w-7 shrink-0 text-right font-bold tabular-nums ${r.rank <= 3 ? "text-seal" : ""}`}>{r.rank}</span>
              <span className="w-12 shrink-0 font-myeongjo text-xl leading-6 text-seal">{r.hanja}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <b className="font-myeongjo">{r.name}</b>
                  <span className="text-[11px] tracking-wider text-gold">{"★".repeat(stars(r)) + "☆".repeat(5 - stars(r))}</span>
                </span>
                <span className="block text-[12px] leading-snug text-ink-soft">{r.line}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5 border-l-[3px] border-seal/60 py-1 pl-4 text-[13px] leading-relaxed text-ink-soft">
        <p className="text-xs font-extrabold text-seal">순위는 이렇게 매겨요</p>
        <p className="mt-1">
          이달의 월주({mp.label})가 각 일주와 만나는 방식을 봐요. 월간이 일간에게 어떤 십신인지, 월지와 일지가 합하는지 부딪치는지,
          귀인이 드는지를 점수로 합쳤어요. 사주의 달은 1일이 아니라 절기로 바뀌어서, 매달 1일에 그달의 절기 달로 새로 매겨요.
        </p>
      </section>

      <AdSlot />
    </>
  );
}
