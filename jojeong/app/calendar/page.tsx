import type { Metadata } from "next";
import Link from "next/link";
import FreeSeen from "@/components/FreeSeen";
import MeForm from "@/components/MeForm";
import { readMe } from "@/lib/me";
import { monthFor } from "@/lib/month";
import { BRANCHES_KO, STEMS_KO } from "@/lib/saju";
import { newYearOf } from "@/lib/yeonun";
import CalendarView from "./CalendarView";

export const metadata: Metadata = {
  title: "내 운세 달력",
  description: "내 사주로 이번 달 날마다 좋은 날, 무난한 날, 조심할 날을 한눈에 봐요. 좋은 날은 휴대폰 달력에 넣을 수 있어요.",
  // A page for the reader's own chart: nothing here for a search engine to index.
  robots: { index: false, follow: true },
};

// Free: this month, day by day, from the 오늘의 운세 engine (lib/month.ts). The chart comes from the browser's saved
// one (lib/me.ts); with none, the birth form first.
export default async function CalendarPage() {
  const me = await readMe();
  const ny = newYearOf();

  if (!me) {
    return (
      <>
        <section className="mt-6 text-center">
          <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">月 曆</p>
          <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">내 운세 달력</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            이번 달 날마다 좋은 날, 무난한 날, 조심할 날을
            <br />내 사주로 한눈에 보여 드려요
          </p>
        </section>
        <section className="doc-paper mt-5 px-5 py-5">
          <MeForm next="/calendar" submit="내 달력 보기" />
        </section>
      </>
    );
  }

  const m = monthFor(me.person);
  const p = me.person.pillars;
  const ilju = `${STEMS_KO[p.dayStem]}${BRANCHES_KO[p.dayBranch]}일주`;

  return (
    <>
      <FreeSeen k="calendar" />
      <section className="mt-6 px-1">
        <p className="font-myeongjo text-[13px] font-extrabold text-seal">내 운세 달력</p>
        <h1 className="mt-1 font-myeongjo text-[28px] font-extrabold leading-tight">
          {me.person.name}님의 {m.month}월
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">{ilju} 기준으로 날마다 계산했어요</p>
      </section>

      <CalendarView month={m} />

      {ny && (
        <section className="doc-paper mt-8 px-5 py-5">
          <p className="text-[13px] font-bold text-gold">{ny} 신년운세</p>
          <h2 className="mt-1 font-myeongjo text-[20px] font-extrabold">{ny}년 열두 달은</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
            달마다 좋은 날과 조심할 날, 그달의 흐름까지 신년운세 한 권에 담겨 있어요.
          </p>
          <Link
            href={`/reports/yeonun?y=${ny}`}
            className="mt-4 flex h-12 items-center justify-center rounded-[10px] bg-ink text-[15px] font-bold text-hanji"
          >
            내 {ny}년 열두 달 보기
          </Link>
        </section>
      )}
      <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-soft">
        사주는 나를 돌아보는 참고용이에요. 중요한 결정은 스스로 내려 주세요.
      </p>
    </>
  );
}
