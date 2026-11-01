import type { Metadata } from "next";
import Link from "next/link";
import ForgetCourtButton from "@/components/ForgetCourtButton";
import NextStep from "@/components/NextStep";
import { STEPS } from "@/lib/nextStep";
import { SERVICE_NAME, TAGLINE } from "@/lib/brand";
import AdSlot from "@/components/AdSlot";
import BirthForm from "@/components/BirthForm";
import Hero from "@/components/Hero";
import Hundo from "@/components/Hundo";
import CourtBoard, { type BoardSeat } from "@/components/CourtBoard";
import { ownedCourts } from "@/lib/load";
import { courtCount } from "@/lib/store";

// A made-up court for the landing: most seats taken, two still open, one 간신 caught.
const EXAMPLE: BoardSeat[] = [
  { role: "yeong", name: "서연" },
  { role: "jwa", name: "지훈" },
  { role: "daejehak", name: "하은" },
  { role: "hojo", name: "도윤" },
  { role: "daesaheon", name: "수아" },
  { role: "gansin", name: "철수" },
];


export const metadata: Metadata = {
  title: { absolute: `${SERVICE_NAME} · ${TAGLINE}` },
  description: "내가 왕이라면 어떤 왕이었을까. 생년월일로 즉위해 왕 유형과 가상 실록을 보고, 어명을 내려 친구를 부르면 사주로 영의정부터 간신까지 관직이 정해집니다.",
};

// 어명이오 (formerly 왕이 될 사주): the free Joseon game people share. The site's main page (/) is the present-day readings.
export default async function KingHome() {
  const [courts, count] = await Promise.all([ownedCourts(), courtCount()]);

  return (
    <>
      <Hero />

      <section className="mt-6 text-center">
        <h2 className="font-myeongjo text-[24px] leading-snug font-extrabold">
          내가 왕이라면,
          <br />
          어떤 <span className="text-seal">왕</span>이었을까?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft break-keep">
          생년월일로 즉위하면 <b className="text-ink">전하의 왕 유형과 가상 실록</b>이 나오옵니다.
          <br />
          어명을 내려 벗들을 부르면, <b className="text-ink">사주로 벗마다 관직</b>이 정해지옵니다.
        </p>
      </section>

      <ol className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
        {[
          ["卽位", "즉위", "내 왕 유형과 실록"],
          ["御命", "어명", "단톡방에 링크 한 번"],
          ["入闕", "입궐", "벗마다 관직 발표"],
        ].map(([hanja, title, line]) => (
          <li key={title} className="flex flex-col items-center gap-1 rounded-xl border border-seal/25 bg-white/40 px-1 py-2.5">
            <span className="font-myeongjo text-[11px] font-extrabold tracking-[0.2em] text-seal">{hanja}</span>
            <b className="font-myeongjo text-[15px] text-ink">{title}</b>
            <span className="leading-snug">{line}</span>
          </li>
        ))}
      </ol>

      <CourtBoard kingName="민준" seats={EXAMPLE} caption="예시: 벗이 입궐할 때마다 사주에 맞는 품계석 앞에 서옵니다" />

      {/* What a friend receives: the 교지 with their post, so the landing shows the game's second half too. */}
      <div className="relative mx-auto mt-4 max-w-[300px] rotate-[-1.5deg]">
        <div className="doc-paper relative px-5 pt-6 pb-14 text-center shadow-[0_6px_16px_rgb(33_27_23/0.18)]">
          <span className="absolute inset-x-5 top-2.5 h-1 rounded-full bg-[#9e2b25]" aria-hidden />
          <p className="font-myeongjo text-xs font-extrabold tracking-[0.3em] text-seal">敎 旨</p>
          <p className="mt-2 text-xs text-ink-soft">민준 전하께서</p>
          <p className="font-myeongjo text-[15px] font-extrabold">서연을 영의정에 제수하노라</p>
          <p className="mt-1 text-[11px] font-bold text-gold">정1품 의정부, 조정 서열 1위</p>
          <span className="absolute right-3 bottom-2 flex size-10 rotate-[-8deg] items-center justify-center rounded-md border-2 border-seal font-myeongjo text-[10px] font-extrabold leading-tight text-seal">
            御
            <br />寶
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-soft">예시: 벗이 받는 교지</p>
      </div>

      {count > 0 && (
        <p className="mx-auto mt-5 w-fit border-y border-seal/30 px-3 py-1 text-center text-sm">
          지금까지 <b className="font-myeongjo text-base text-seal">{count.toLocaleString("ko-KR")}</b>명의 전하가 즉위하셨사옵니다
        </p>
      )}

      {/* Only this browser's own courts (owner cookie), so a returning king can pick up where they left off. */}
      {courts.length > 0 && (
        <section className="mt-5 border border-seal/25 bg-[#f9f1de] px-4 py-3">
          <p className="text-[11px] font-bold text-ink-soft">이 기기에서 즉위하신 조정</p>
          <ul className="mt-1 flex flex-col divide-y divide-ink/10">
            {courts.map((court) => (
              <li key={court.id} className="flex items-center gap-3">
                <Link href={`/court/${court.id}`} className="flex min-w-0 flex-1 items-center justify-between py-2 text-[15px] font-bold">
                  <span className="truncate">{court.kingName} 전하의 조정</span>
                  <span className="shrink-0 text-sm text-gold">입궐 →</span>
                </Link>
                <ForgetCourtButton courtId={court.id} kingName={court.kingName} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="enthrone" className="doc-paper mt-5 scroll-mt-4 px-6 pt-8 pb-7">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">卽 位</p>
        <p className="mt-1 mb-4 text-center font-myeongjo font-extrabold">{courts.length > 0 ? "새로 즉위하기" : "전하의 사주를 올리시옵소서"}</p>
        <BirthForm mode="king" />
      </section>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">
        내 왕 유형, 가상 실록, 벗들의 관직까지 <b className="text-ink">모두 무료</b>이옵니다
      </p>

      <section className="mt-8 border-l-[3px] border-seal/60 py-1 pl-4">
        <p className="text-xs font-extrabold tracking-wider text-seal">알고 계셨사옵니까?</p>
        <p className="mt-2 text-[15px] leading-relaxed">
          조선 왕실에는 사주를 보는 관직이 있었사옵니다. <b>관상감 명과학(命課學)</b>의 관원들은 왕자와 공주의 궁합을
          심사하고 왕실의 길일을 택했으며, 오늘날 사주와 같은 <b>자평명리</b>로 시험을 치렀사옵니다.
        </p>
      </section>

      {/* The same things the fact above names, as 정 훈도 does them today: the way across to the readings. */}
      <NextStep from="king" steps={STEPS.king()} />

      <section className="mt-5">
        <Hundo>
          관상감 막내, 명과학 훈도 정가이옵니다. 먼저 전하께서 어떤 왕이신지 아뢰고, 벗들이 입궐하면 누가 영의정이고 누가 간신인지 사주로 가려 천거하겠사옵니다.
        </Hundo>
      </section>

      <AdSlot />
    </>
  );
}
