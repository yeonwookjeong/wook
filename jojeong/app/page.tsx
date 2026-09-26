import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import Hero from "@/components/Hero";
import Hundo from "@/components/Hundo";
import { ROLES } from "@/lib/roles";
import { ownedCourts } from "@/lib/load";
import { courtCount } from "@/lib/store";
import type { RoleKey } from "@/lib/saju";

const SHOWCASE: RoleKey[] = ["yeong", "byeongjo", "hojo", "yejo", "gansin", "yubae"];


export default async function Home() {
  const [courts, count] = await Promise.all([ownedCourts(), courtCount()]);

  return (
    <>
      <Hero />
      <p className="mt-5 text-center text-[15px] leading-relaxed text-ink-soft">
        생년월일을 넣으면 <b className="text-ink">전하가 어떤 왕이었을지</b> 알려드리옵니다.
        <br />
        벗들을 부르면 <b className="text-ink">사주가 관직을 내려드리옵니다.</b>
      </p>
      {count > 0 && (
        <p className="mx-auto mt-3 w-fit border-y border-seal/30 px-3 py-1 text-center text-sm">
          지금까지 <b className="font-myeongjo text-base text-seal">{count.toLocaleString("ko-KR")}</b>명의 전하가 즉위하셨사옵니다
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-1.5 text-center">
        <div className="border border-seal/25 bg-[#f9f1de] px-3 py-3">
          <p className="text-[11px] font-extrabold text-seal">무료 · 조선의 나</p>
          <p className="mt-1 text-[13px] leading-snug">왕 등급 · 가상 실록 · 조선 신분과 직업 · 벗들의 관직</p>
        </div>
        <Link href="/reports" className="border border-seal/50 bg-seal/5 px-3 py-3">
          <p className="text-[11px] font-extrabold text-seal">비밀 보고서 · 지금의 나</p>
          <p className="mt-1 text-[13px] leading-snug">올해 운세 · 연애 · 재물 · 직업, 조선 최고의 사주쟁이가 봐 드림</p>
        </Link>
      </div>

      <p className="mt-7 text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">官 職</p>
      <ul className="mt-2 grid grid-cols-3 gap-1.5">
        {SHOWCASE.map((key) => {
          const role = ROLES[key];
          const danger = role.tone === "red" || role.tone === "gray";
          return (
            <li
              key={key}
              className={`border px-2 py-3 text-center ${danger ? "border-seal/40 bg-seal/5" : "border-seal/20 bg-[#f9f1de]"}`}
            >
              <p className={`font-myeongjo text-lg font-extrabold ${danger ? "text-seal" : ""}`}>{role.title}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink-soft">{role.tagline}</p>
            </li>
          );
        })}
      </ul>

      <section className="mt-8 border-l-[3px] border-seal/60 py-1 pl-4">
        <p className="text-xs font-extrabold tracking-wider text-seal">알고 계셨사옵니까?</p>
        <p className="mt-2 text-[15px] leading-relaxed">
          조선 왕실에는 사주를 보는 관직이 있었사옵니다. <b>관상감 명과학(命課學)</b>의 관원들은 왕자와 공주의 궁합을
          심사하고 왕실의 길일을 택했으며, 오늘날 사주와 같은 <b>자평명리</b>로 시험을 치렀사옵니다.
        </p>
      </section>

      <section className="mt-5">
        <Hundo>
          관상감 막내, 명과학 훈도 정가이옵니다. 다들 정 훈도라 부르옵니다. 품계는 말단 정9품이오나 사주 보는 눈만큼은 조선
          제일이옵니다. 먼저
          즉위하시면 전하가 어떤 왕이신지 아뢰고, 벗들을 부르시면 누가 영의정이고 누가 간신인지 가려 천거하겠사옵니다.
        </Hundo>
      </section>

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

      <ol className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
        {["즉위하고 왕 유형 확인", "벗들에게 링크 보내기", "관직 발표 & 교지 공유"].map((step, i) => (
          <li key={step} className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center border border-seal/50 font-myeongjo text-sm font-extrabold text-seal">
              {"一二三"[i]}
            </span>
            {step}
          </li>
        ))}
      </ol>

    </>
  );
}
