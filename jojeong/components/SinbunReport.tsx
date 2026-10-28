import Link from "next/link";
import { ELEMENT_HANJA, ELEMENT_KO } from "@/lib/myeongri";
import type { Pillars } from "@/lib/saju";
import { sinbunStory } from "@/lib/sinbun";
import { bornOf, MATERIAL, yearGanji } from "@/lib/hopae";
import Hopae from "./Hopae";
import Keep from "./Keep";
import SinsalNight, { NIGHT_GOLD, NIGHT_PANEL } from "./SinsalNight";
import RoyalDoc from "./RoyalDoc";

const HANJA_NUM = "一二三四五六七";

// The free 조선 신분 감정 report: a whole Joseon life in seven chapters, laid out like the 가상 실록.
// Ends with a bridge to the paid present-day 직업·적성 report.
export default function SinbunReport({
  pillars,
  gender,
  heading,
  query,
}: {
  pillars: Pillars;
  gender?: "m" | "f" | null;
  heading: string;
  query: string;
}) {
  const s = sinbunStory(pillars, gender);
  const m = MATERIAL[s.rank];
  return (
    <>
      {/* The head: the 호패 alone on the night (the one thing the eye goes to), then what it says. */}
      <SinsalNight>
        <section className="pt-6 text-center">
          <p
            className={`font-myeongjo text-sm font-extrabold tracking-[0.3em] ${NIGHT_GOLD}`}
          >
            號 牌 · 조선 신분
          </p>
          <p className="mt-3 text-[14px] text-hanji/80">{heading}</p>
          <div className="relative mt-2">
            <div
              aria-hidden
              className="absolute top-[38%] left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(212_175_95/0.28),transparent_65%)]"
            />
            <Hopae
              tag={{
                rank: s.rank,
                job: s.job,
                office: s.office,
                born: bornOf(pillars.yearStem, pillars.yearBranch),
                issued: yearGanji(),
              }}
              night
              className="relative"
            />
          </div>
          <h1 className="mt-3 font-myeongjo text-[32px] leading-tight font-extrabold">
            {s.job}
          </h1>
          <p className="mt-1 text-[14px] text-hanji/80">{s.line}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {s.rarity && (
              <span className="rounded-full bg-[#d4af5f] px-3 py-1 text-xs font-extrabold text-[#0f2236]">
                100가지 삶 중 {s.rarity}
              </span>
            )}
            <span className="rounded-full border border-[#d4af5f]/60 px-3 py-1 text-xs font-extrabold text-[#d4af5f]">
              {s.rank} · {m.name} {m.hanja}
            </span>
          </div>
        </section>

        <section
          className={`${NIGHT_PANEL} mt-5 grid grid-cols-3 divide-x divide-white/10 py-3 text-center`}
        >
          <div>
            <p className="text-[11.5px] text-hanji/60">신분</p>
            <p className="mt-0.5 font-myeongjo text-lg font-extrabold">
              {s.rank}
            </p>
          </div>
          <div>
            <p className="text-[11.5px] text-hanji/60">출세 가능성</p>
            <p
              className="mt-1 text-sm tracking-tighter whitespace-nowrap"
              aria-label={`5점 만점에 ${s.rise}점`}
            >
              <span className={NIGHT_GOLD}>{"★".repeat(s.rise)}</span>
              <span className="text-white/15">{"★".repeat(5 - s.rise)}</span>
            </p>
          </div>
          <div>
            <p className="text-[11.5px] text-hanji/60">귀인의 기운</p>
            <p className="mt-0.5 font-myeongjo text-lg font-extrabold">
              {ELEMENT_KO[s.yong]}({ELEMENT_HANJA[s.yong]})
            </p>
          </div>
        </section>

        {s.basis.length > 0 && (
          <section className={`${NIGHT_PANEL} mt-4 px-4 py-4`}>
            <h2 className="text-center font-myeongjo text-[17px] font-extrabold">
              정 훈도가 이렇게 본 까닭
            </h2>
            <ul className="mt-2 flex flex-col gap-1 text-[13px] leading-relaxed text-hanji/85">
              {s.basis.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className={NIGHT_GOLD}>·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </SinsalNight>

      <RoyalDoc className="mt-5" paperClassName="px-5">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">
          身 分 鑑 定
        </p>
        <h2 className="mt-2 text-center font-myeongjo text-xl font-extrabold">
          {s.job}의 한평생
        </h2>

        <div className="mt-6 flex flex-col border-t-[3px] border-double border-seal/40 pt-2">
          {s.chapters.map((c, i) => (
            <article
              key={c.title}
              className="border-t border-ink/10 py-4 first:border-t-0"
            >
              <h2 className="font-myeongjo text-sm font-extrabold text-seal">
                제{HANJA_NUM[i]}장 <span className="text-ink">{c.title}</span>
              </h2>
              {c.labels ? (
                <ol className="mt-1.5 flex flex-col gap-1.5">
                  {c.paras.map((t, j) => (
                    <li
                      key={t}
                      className="flex gap-3 text-[15px] leading-relaxed"
                    >
                      <span className="w-8 shrink-0 font-myeongjo font-extrabold text-seal">
                        {c.labels![j]}
                      </span>
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

        <Link
          href={`/reports/jikup?${query}`}
          className="mt-2 block border border-seal/30 bg-seal/5 px-4 py-3 text-sm"
        >
          <span className="block font-bold">
            <Keep>{s.now}</Keep>
          </span>
          <span className="mt-1 block text-seal">
            지금 시대에 어울리는 일 세&nbsp;가지는{" "}
            <span className="inline-block">
              &lsquo;직업·적성&rsquo; 보고서에서 →
            </span>
          </span>
        </Link>

        <p className="mt-5 text-right font-myeongjo text-sm text-ink-soft">
          — 관상감 명과학 훈도 정가, 삼가 적음
        </p>
        <p className="mt-2 text-center text-[11px] text-ink-soft/80">
          사주로 지어 올린 가상의 한평생이옵니다.
        </p>
      </RoyalDoc>
    </>
  );
}
