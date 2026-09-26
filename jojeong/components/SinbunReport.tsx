import Link from "next/link";
import { ELEMENT_HANJA, ELEMENT_KO } from "@/lib/myeongri";
import type { Pillars } from "@/lib/saju";
import { sinbunStory } from "@/lib/sinbun";
import Keep from "./Keep";
import RoyalDoc from "./RoyalDoc";

const HANJA_NUM = "一二三四五六七";

const RANK_STYLE = {
  양반: "border-gold text-gold",
  중인: "border-[#3d6656] text-[#3d6656]",
  상민: "border-ink/60 text-ink",
  천민: "border-seal text-seal",
} as const;

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center border border-seal/25 px-1 py-2">
      <span className="text-[11px] text-ink-soft">{label}</span>
      <span className="mt-0.5 font-myeongjo text-lg font-extrabold">{children}</span>
    </div>
  );
}

// The free 조선 신분 감정 report: a whole Joseon life in seven chapters, laid out like the 가상 실록.
// Ends with a bridge to the paid present-day 직업·적성 report.
export default function SinbunReport({ pillars, heading, query }: { pillars: Pillars; heading: string; query: string }) {
  const s = sinbunStory(pillars);
  return (
    <RoyalDoc className="mt-3" paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">身 分 鑑 定</p>
      <h1 className="mt-2 text-center font-myeongjo text-xl font-extrabold">{heading}</h1>

      <div className="mt-5 flex flex-col items-center text-center">
        <span className={`border-2 px-3 py-0.5 font-myeongjo text-sm font-extrabold ${RANK_STYLE[s.rank]}`}>{s.rank}</span>
        <p className="mt-2 font-myeongjo text-3xl font-extrabold">{s.job}</p>
        <p className="mt-1 text-sm text-ink-soft">{s.line}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        <Stat label="신분">{s.rank}</Stat>
        <Stat label="출세 가능성">
          <span className="text-sm tracking-tighter whitespace-nowrap" aria-label={`5점 만점에 ${s.rise}점`}>
            <span className="text-gold">{"★".repeat(s.rise)}</span>
            <span className="text-ink/15">{"★".repeat(5 - s.rise)}</span>
          </span>
        </Stat>
        <Stat label="귀인의 기운">
          {ELEMENT_KO[s.yong]}({ELEMENT_HANJA[s.yong]})
        </Stat>
      </div>

      <div className="mt-6 flex flex-col border-t-[3px] border-double border-seal/40 pt-2">
        {s.chapters.map((c, i) => (
          <article key={c.title} className="border-t border-ink/10 py-4 first:border-t-0">
            <h2 className="font-myeongjo text-sm font-extrabold text-seal">
              제{HANJA_NUM[i]}장 <span className="text-ink">{c.title}</span>
            </h2>
            {c.labels ? (
              <ol className="mt-1.5 flex flex-col gap-1.5">
                {c.paras.map((t, j) => (
                  <li key={t} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="w-8 shrink-0 font-myeongjo font-extrabold text-seal">{c.labels![j]}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            ) : (
              c.paras.map((t) => (
                <p key={t} className="mt-1.5 text-[15px] leading-relaxed">
                  {t}
                </p>
              ))
            )}
          </article>
        ))}
      </div>

      <Link href={`/reports/jikup?${query}`} className="mt-2 block border border-seal/30 bg-seal/5 px-4 py-3 text-sm">
        <span className="block font-bold">
          <Keep>{s.now}</Keep>
        </span>
        <span className="mt-1 block text-seal">
          지금 시대에 어울리는 일 세&nbsp;가지는 <span className="inline-block">&lsquo;직업·적성&rsquo; 보고서에서 →</span>
        </span>
      </Link>

      <p className="mt-5 text-right font-myeongjo text-sm text-ink-soft">— 관상감 명과학 훈도 정가, 삼가 적음</p>
      <p className="mt-2 text-center text-[11px] text-ink-soft/80">사주로 지어 올린 가상의 한평생이옵니다.</p>
    </RoyalDoc>
  );
}
