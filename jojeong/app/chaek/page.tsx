import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { kstYm, monthOf, parseYm, shiftYm, WEEK, ymOf } from "@/lib/chaek";

export const metadata: Metadata = {
  title: "정 훈도의 책력 · 달마다 손 없는 날과 절기",
  description: "달마다 손 없는 날, 음력 날짜와 공휴일, 24절기와 사주의 달이 바뀌는 날을 정리한 정 훈도의 책력. 이사·개업 날짜 잡기 전에 한 번에 확인하세요.",
  alternates: { canonical: "/chaek" },
};

// "This month" moves on its own: the page is rebuilt every hour.
export const revalidate = 3600;

// The almanac's front page: this month and the eleven after it, each with its 손 없는 날 and 절기, and the other
// free pages that read the calendar (일주 랭킹, 삼재).
export default function ChaekPage() {
  const now = kstYm();
  const months = Array.from({ length: 12 }, (_, i) => shiftYm(...now, i)).filter((ym) => parseYm(ymOf(...ym)) !== null);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">冊 曆</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">정 훈도의 책력</h1>
        <p className="mt-3 text-[14px] leading-relaxed">
          조선의 관상감은 해마다 책력(달력)을 펴내던 관청이에요.
          <br />
          그 관상감 훈도가 달마다 손 없는 날과 절기를 정리해 두었어요.
        </p>
      </section>

      <ul className="mt-5 flex flex-col gap-2">
        {months.map(([y, m], i) => {
          const days = monthOf(y, m);
          const sons = days.filter((d) => d.son);
          const terms = days.flatMap((d) => (d.term ? [d.term.ko] : []));
          return (
            <li key={`${y}-${m}`}>
              <Link href={`/chaek/${ymOf(y, m)}`} className={`doc-paper flex items-center gap-4 px-5 py-4 ${i === 0 ? "ring-2 ring-gold" : ""}`}>
                <span className="w-14 shrink-0 text-center">
                  <span className="block text-[11px] text-ink-soft">{y}</span>
                  <b className="block font-myeongjo text-2xl leading-none">{m}월</b>
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[14px]">
                    {i === 0 && <span className="mr-1 text-seal">이번 달 ·</span>}손 없는 날 {sons.length}일
                  </b>
                  <span className="block text-[12px] leading-snug text-ink-soft">{sons.map((d) => `${d.d}(${WEEK[d.wd]})`).join(" · ")}</span>
                  <span className="block text-[11px] text-[#a87a22]">절기 {terms.join(" · ")}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-seal">보기 →</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="doc-paper mt-5 px-5 py-4">
        <h2 className="font-myeongjo font-extrabold">책력으로 보는 다른 것</h2>
        <ul className="mt-2 flex flex-col divide-y divide-seal/10 text-[14px]">
          <li>
            <Link href="/ranking" className="flex items-center justify-between py-2.5">
              <span>
                <b>이달의 일주 랭킹</b>
                <span className="block text-[12px] text-ink-soft">절기로 바뀌는 사주의 한 달, 60일주 가운데 내 일주는 몇 위</span>
              </span>
              <span className="text-xs font-bold text-seal">→</span>
            </Link>
          </li>
          <li>
            <Link href="/samjae" className="flex items-center justify-between py-2.5">
              <span>
                <b>삼재 띠 확인</b>
                <span className="block text-[12px] text-ink-soft">올해와 내년 삼재 띠</span>
              </span>
              <span className="text-xs font-bold text-seal">→</span>
            </Link>
          </li>
        </ul>
      </section>

      <AdSlot />
    </>
  );
}
