import type { Metadata } from "next";
import Link from "next/link";
import { readMe } from "@/lib/me";
import { samjaeOf, TTI } from "@/lib/samjae";

const YEAR = 2026;

export const metadata: Metadata = {
  title: `${YEAR} 삼재 띠 확인`,
  description: `${YEAR}년 삼재 띠는 토끼띠·양띠·돼지띠(눌삼재). 띠별 삼재 연도와 들삼재·눌삼재·날삼재를 한눈에 확인하세요.`,
};

// Free: every 띠's 삼재 this year and next, and the reader's own when a chart is saved. Rule-based, no writer.
export default async function SamjaePage() {
  const me = await readMe();
  const mine = me ? me.person.pillars.yearBranch : null;
  const inSamjae = TTI.flatMap((name, i) => (samjaeOf(i, YEAR).stage ? [name] : []));
  const stage = inSamjae.length ? samjaeOf(TTI.indexOf(inSamjae[0]), YEAR).stage : null;
  const mineNow = mine === null ? null : samjaeOf(mine, YEAR);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">三 災</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">{YEAR} 삼재 띠</h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          올해 삼재는 <b className="text-seal">{inSamjae.map((t) => `${t}띠`).join(" · ")}</b>
          {stage && ` (${stage})`}
        </p>
        <p className="mt-1 text-xs text-ink-soft">무료 · 띠는 입춘(2월 4일 무렵) 기준이에요</p>
      </section>

      {me && mineNow && (
        <section className="doc-paper mt-5 px-5 py-5 text-center">
          <p className="text-xs font-extrabold text-seal">{me.person.name}님은 {TTI[mine!]}띠</p>
          <p className="mt-2 font-myeongjo text-xl font-extrabold">
            {mineNow.stage ? `올해 ${mineNow.stage}예요` : "올해는 삼재가 아니에요"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {mineNow.stage ? `${mineNow.next[0]}~${mineNow.next[2]}년이 삼재예요` : `다음 삼재는 ${mineNow.next[0]}~${mineNow.next[2]}년이에요`}
          </p>
        </section>
      )}

      <section className="doc-paper mt-5 px-5 py-5">
        <h2 className="font-myeongjo text-lg font-extrabold">띠별 삼재 한눈에 보기</h2>
        <table className="mt-3 w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-seal/30 text-xs text-ink-soft">
              <th className="py-2 font-normal">띠</th>
              <th className="py-2 font-normal">{YEAR}년</th>
              <th className="py-2 font-normal">삼재 연도</th>
            </tr>
          </thead>
          <tbody>
            {TTI.map((name, i) => {
              const s = samjaeOf(i, YEAR);
              return (
                <tr key={name} className={`border-b border-seal/10 ${i === mine ? "bg-gold/10" : ""}`}>
                  <td className="py-2 font-bold">{name}띠</td>
                  <td className={`py-2 ${s.stage ? "font-extrabold text-seal" : "text-ink-soft"}`}>{s.stage ?? "-"}</td>
                  <td className="py-2 text-ink-soft">
                    {s.next[0]}~{s.next[2]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="doc-paper mt-5 px-5 py-5 text-[14px] leading-relaxed">
        <h2 className="font-myeongjo text-lg font-extrabold">삼재, 얼마나 걱정해야 할까요?</h2>
        <p className="mt-2">
          삼재는 띠마다 12년에 한 번, 3년 동안 조심하라는 옛 믿음이에요. 첫해를 <b>들삼재</b>, 가운데 해를 <b>눌삼재</b>, 마지막 해를{" "}
          <b>날삼재</b>라고 불러요.
        </p>
        <p className="mt-2">
          다만 삼재는 태어난 해의 띠 한 글자만 보는 풀이예요. 실제 사주는 여덟 글자로 보기 때문에, 같은 삼재라도 사람마다 그해가 전혀 다르게
          흘러가요. 삼재인데 오히려 좋은 해인 사람도 많아요.
        </p>
        <Link href="/reports/gukjeong" className="mt-4 block rounded-2xl bg-seal py-3.5 text-center font-myeongjo font-extrabold text-hanji">
          여덟 글자로 보는 내 {YEAR}년 운세 (무료) →
        </Link>
      </section>
    </>
  );
}
