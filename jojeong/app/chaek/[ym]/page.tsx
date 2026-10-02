import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import ChaekCalendar from "@/components/ChaekCalendar";
import Hundo from "@/components/Hundo";
import NextStep from "@/components/NextStep";
import { kstYm, monthOf, parseYm, shiftYm, WEEK, ymOf, type ChaekDay } from "@/lib/chaek";
import { meetings } from "@/lib/deep";
import { monthPillarNow, monthPillarOf } from "@/lib/iljuRank";
import { readMe } from "@/lib/me";
import { STEPS } from "@/lib/nextStep";
import { BRANCHES } from "@/lib/saju";

// One month of 정 훈도의 책력, for the reader who searched "10월 손 없는 날": the days first, then the calendar
// with lunar dates, the 절기 and the day the saju month turns, and what 손 is. All computed (lib/chaek.ts); a
// saved chart marks the 손 없는 날 that clash with the reader's day branch.

const dateOf = (m: number, d: ChaekDay) => `${m}/${d.d} (${WEEK[d.wd]})`;

export async function generateMetadata({ params }: PageProps<"/chaek/[ym]">): Promise<Metadata> {
  const ym = parseYm((await params).ym);
  if (!ym) return {};
  const [y, m] = ym;
  const days = monthOf(y, m);
  const sons = days.filter((d) => d.son);
  const terms = days.flatMap((d) => (d.term ? [d.term.ko] : []));
  return {
    title: `${y}년 ${m}월 손 없는 날 · 이사 날짜`,
    description: `${y}년 ${m}월 손 없는 날은 ${sons.map((d) => dateOf(m, d)).join(", ")}, 모두 ${sons.length}일이에요. 음력 날짜와 공휴일, 절기(${terms.join("·")}), 사주의 달이 바뀌는 날까지 한 장에 정리했어요.`,
    alternates: { canonical: `/chaek/${ymOf(y, m)}` },
  };
}

export default async function ChaekMonthPage({ params }: PageProps<"/chaek/[ym]">) {
  const ym = parseYm((await params).ym);
  if (!ym) notFound();
  const [y, m] = ym;
  const days = monthOf(y, m);
  const sons = days.filter((d) => d.son);
  const holidays = days.filter((d) => d.holi);
  const terms = days.filter((d) => d.term);

  const me = await readMe();
  const mine = me ? me.person.pillars.dayBranch : null;
  const clash = new Set(mine === null ? [] : sons.filter((d) => meetings(d.branch, mine).includes("충")).map((d) => d.d));

  // The saju month in force on the 1st, and the one that begins with this month's 절.
  const before = monthPillarOf(...shiftYm(y, m, -1));
  const turn = monthPillarOf(y, m);
  const turnDay = days.find((d) => d.term?.opens);
  const ranking = monthPillarNow().label;

  const prev = shiftYm(y, m, -1);
  const next = shiftYm(y, m, 1);
  const inRange = (ym: [number, number]) => parseYm(ymOf(...ym)) !== null;
  const now = kstYm();

  return (
    <>
      <nav className="pt-4 text-sm">
        <Link href="/chaek" className="font-bold text-ink-soft">
          ← 정 훈도의 책력
        </Link>
      </nav>

      <section className="mt-4 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">冊 曆</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">
          {y}년 {m}월 손 없는 날
        </h1>
        <p className="mt-2 text-[15px]">
          {m}월 손 없는 날은 <b className="text-seal">{sons.length}일</b>이에요
        </p>
        <p className="mt-1 text-xs text-ink-soft">음력 날짜 끝자리가 9와 0인 날 · 무료</p>
      </section>

      <section className="doc-paper mt-5 px-5 py-4">
        <ul className="flex flex-col divide-y divide-seal/10">
          {sons.map((d) => (
            <li key={d.d} className="flex items-center gap-3 py-2.5">
              <b className="w-24 shrink-0 font-myeongjo text-lg">{dateOf(m, d)}</b>
              <span className="text-[13px] text-ink-soft">음력 {d.lunar}</span>
              <span className="ml-auto flex shrink-0 gap-1 text-[11px] font-bold">
                {d.holi && <span className="rounded bg-seal/10 px-1.5 py-0.5 text-seal">{d.holi}</span>}
                {!d.holi && (d.wd === 0 || d.wd === 6) && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-ink-soft">주말</span>}
                {clash.has(d.d) && <span className="rounded bg-ink px-1.5 py-0.5 text-hanji">나와 충</span>}
              </span>
            </li>
          ))}
        </ul>
        {me && (
          <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[13px] leading-relaxed">
            {clash.size ? (
              <>
                {me.person.name}님 일지 {BRANCHES[mine!]}와 정면으로 부딪히는(충) 날이{" "}
                <b className="text-seal">
                  {[...clash].map((d) => `${m}/${d}`).join(", ")}
                </b>
                예요. 손 없는 날이어도 {me.person.name}님께는 큰일을 잡기 조심스러운 날이에요.
              </>
            ) : (
              <>
                이달 손 없는 날 가운데 {me.person.name}님 일지 {BRANCHES[mine!]}와 정면으로 부딪히는(충) 날은 없어요.
              </>
            )}
          </p>
        )}
      </section>

      <NextStep from="chaek" steps={STEPS.chaek(Boolean(me))} />

      <section className="doc-paper mt-5 px-3 py-4">
        <h2 className="px-2 font-myeongjo text-lg font-extrabold">
          {y}년 {m}월 책력
        </h2>
        <p className="mt-0.5 px-2 text-[11px] text-ink-soft">작은 글씨는 음력 · 붉은 칸은 손 없는 날{clash.size ? " · 충 표시는 나와 부딪히는 날" : ""}</p>
        <div className="mt-3">
          <ChaekCalendar days={days} clash={clash} />
        </div>
        {holidays.length > 0 && (
          <p className="mt-3 px-2 text-[12px] leading-relaxed text-ink-soft">
            공휴일: {holidays.map((d) => `${m}/${d.d} ${d.holi}`).join(" · ")}
          </p>
        )}
      </section>

      <section className="doc-paper mt-4 px-5 py-5 text-[14px] leading-relaxed">
        <h2 className="font-myeongjo text-lg font-extrabold">{m}월의 절기</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {terms.map((d) => (
            <li key={d.d}>
              <b>
                {dateOf(m, d)} {d.term!.ko}({d.term!.hanja})
              </b>
              <span className="text-ink-soft"> · {d.term!.meaning}</span>
            </li>
          ))}
        </ul>
        {before && turn && turnDay && (
          <p className="mt-3 rounded-xl bg-ink/[0.04] px-3 py-2 text-[13px]">
            사주의 달은 1일이 아니라 절기로 바뀌어요. {m}/1~{m}/{turnDay.d - 1}은 <b>{before.label}</b>, {m}/{turnDay.d} {turnDay.term!.ko}부터{" "}
            <b className="text-seal">{turn.label}</b>이에요.
            {(turn.label === ranking || before.label === ranking) && (
              <>
                {" "}
                <Link href="/ranking" className="font-bold text-seal underline underline-offset-2">
                  {ranking} 60일주 랭킹 보기 →
                </Link>
              </>
            )}
          </p>
        )}
      </section>

      <section className="doc-paper mt-4 px-5 py-5 text-[14px] leading-relaxed">
        <h2 className="font-myeongjo text-lg font-extrabold">손 없는 날, 그 ‘손’이 뭐길래</h2>
        <p className="mt-2">
          ‘손’은 날마다 동서남북을 옮겨 다니며, 그쪽에서 벌이는 일을 방해한다고 믿은 귀신이에요. 음력 1·2일엔 동쪽, 3·4일엔 남쪽, 5·6일엔 서쪽,
          7·8일엔 북쪽에 있고, 끝자리가 9와 0인 날엔 하늘로 올라가 어디에도 없어요. 그래서 <b>손 없는 날</b>이에요.
        </p>
        <p className="mt-2">한 달에 대여섯 날뿐이라 이사·개업 날짜로 많이 몰려요. 주말이나 공휴일과 겹치는 날은 이삿짐 예약이 특히 일찍 차는 편이에요.</p>
        <p className="mt-2">
          다만 손 없는 날은 음력 날짜만 보는 풍속이라 <b>누구에게나 같은 날</b>이에요. 사주로 보는 좋은 날은 사람마다 달라서, 모두에게 좋다는
          날이 어떤 사람에게는 부딪히는 날일 수 있어요.
        </p>
      </section>

      <section className="mt-5">
        <Hundo>손 없는 날은 날을 고르는 첫 체이옵니다. 그 체를 지난 날 가운데 그대와 맞는 날은 따로 있사옵니다.</Hundo>
      </section>

      <nav className="mt-6 flex items-center justify-between text-[13px] font-bold">
        {inRange(prev) ? (
          <Link href={`/chaek/${ymOf(...prev)}`} className="text-seal">
            ← {prev[1]}월 손 없는 날
          </Link>
        ) : (
          <span />
        )}
        {(now[0] !== y || now[1] !== m) && (
          <Link href={`/chaek/${ymOf(...now)}`} className="text-ink-soft">
            이번 달
          </Link>
        )}
        {inRange(next) ? (
          <Link href={`/chaek/${ymOf(...next)}`} className="text-seal">
            {next[1]}월 손 없는 날 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <AdSlot />
    </>
  );
}
