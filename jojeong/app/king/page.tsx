import type { Metadata } from "next";
import Link from "next/link";
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
  description: "생년월일만 넣으면 전하가 됩니다. 친구를 부르면 사주가 영의정부터 간신까지 관직을 내려드립니다.",
};

// 왕이 될 사주: the free Joseon game people share. The site's main page (/) is the present-day readings.
export default async function KingHome() {
  const [courts, count] = await Promise.all([ownedCourts(), courtCount()]);

  return (
    <>
      <Hero />

      <section className="mt-6 text-center">
        <h2 className="font-myeongjo text-[22px] leading-snug font-extrabold">
          누가 영의정이고,
          <br />
          누가 <span className="text-seal">간신</span>일까?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          생년월일로 즉위하고 친구들을 부르면,
          <br />
          <b className="text-ink">사주로 친구마다 관직</b>이 정해지옵니다.
        </p>
      </section>

      <CourtBoard kingName="민준" seats={EXAMPLE} caption="예시 · 친구가 들어올 때마다 자리가 채워지옵니다" />

      <ol className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
        {[
          ["생년월일로", "즉위하기"],
          ["단톡방에", "링크 올리기"],
          ["친구마다", "관직 발표"],
        ].map(([a, b], i) => (
          <li key={a} className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center border border-seal/50 font-myeongjo text-sm font-extrabold text-seal">
              {"一二三"[i]}
            </span>
            <span>
              {a}
              <br />
              <b className="text-ink">{b}</b>
            </span>
          </li>
        ))}
      </ol>

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
              <li key={court.id}>
                <Link href={`/court/${court.id}`} className="flex items-center justify-between py-2 text-[15px] font-bold">
                  <span>{court.kingName} 전하의 조정</span>
                  <span className="text-sm text-gold">입궐 →</span>
                </Link>
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
        내 왕 유형 · 가상 실록 · 친구들의 관직까지 <b className="text-ink">전부 무료</b>이옵니다
      </p>

      <section className="mt-8 border-l-[3px] border-seal/60 py-1 pl-4">
        <p className="text-xs font-extrabold tracking-wider text-seal">알고 계셨사옵니까?</p>
        <p className="mt-2 text-[15px] leading-relaxed">
          조선 왕실에는 사주를 보는 관직이 있었사옵니다. <b>관상감 명과학(命課學)</b>의 관원들은 왕자와 공주의 궁합을
          심사하고 왕실의 길일을 택했으며, 오늘날 사주와 같은 <b>자평명리</b>로 시험을 치렀사옵니다.
        </p>
      </section>

      <section className="mt-5">
        <Hundo>
          관상감 막내, 명과학 훈도 정가이옵니다. 벗들을 부르시면 누가 영의정이고 누가 간신인지 사주로 가려 천거하겠사옵니다.
        </Hundo>
      </section>

      <AdSlot />
    </>
  );
}
