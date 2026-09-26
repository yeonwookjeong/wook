import Link from "next/link";
import { ELEMENT_HANJA, ELEMENT_KO } from "@/lib/myeongri";
import type { YearReading } from "@/lib/yearly";
import { MONTHS } from "@/lib/yearly";
import DeepenForm from "./DeepenForm";
import Keep from "./Keep";
import RoyalDoc from "./RoyalDoc";
import SajuChart from "./SajuChart";

const RATING = [
  { mark: "✕", label: "고비", cls: "bg-ink text-hanji" },
  { mark: "△", label: "조심", cls: "bg-ink/10 text-ink" },
  { mark: "○", label: "무난", cls: "bg-gold/15 text-gold" },
  { mark: "◎", label: "좋음", cls: "bg-seal text-hanji" },
] as const;

const VERDICT_STYLE: Record<string, string> = {
  대길: "border-seal text-seal",
  길: "border-seal/80 text-seal",
  평: "border-gold text-gold",
  조심: "border-ink/70 text-ink",
  인내: "border-ink text-ink",
};

const monthLabel = (i: number) => `${MONTHS[i].from.split("/")[0]}월`;

// The free 2026 reading: a cover (verdict, headline, keywords, the year at a glance), then each part as a
// fold-out with a catchy headline, and 정 훈도's reasons in small print under each.
export default function YearReport({
  reading,
  heading,
  deepen,
  query,
}: {
  reading: YearReading;
  heading: string;
  deepen: { courtId: string; who: string } | null;
  query: string;
}) {
  const { verdict, headline, keywords, sections, months, best, worst, lucky, advice, missing } = reading;
  return (
    <>
      <RoyalDoc className="mt-3" paperClassName="px-5">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">國 運</p>
        <h1 className="mt-2 text-center font-myeongjo text-xl font-extrabold">{heading}</h1>

        <div className="mt-5 flex flex-col items-center text-center">
          <span className={`-rotate-3 border-[3px] px-5 py-1 font-myeongjo text-3xl font-extrabold ${VERDICT_STYLE[verdict]}`}>{verdict}</span>
          <p className="mt-4 font-myeongjo text-lg leading-snug font-extrabold">&ldquo;{headline}&rdquo;</p>
          <p className="mt-3 flex flex-wrap justify-center gap-1.5">
            {keywords.map((k) => (
              <span key={k} className="rounded-full border border-seal/30 px-2.5 py-0.5 text-xs font-bold text-seal">
                {k}
              </span>
            ))}
          </p>
        </div>

        {/* The year at a glance */}
        <ol className="mt-5 grid grid-cols-6 gap-1 text-center" aria-label="월별 흐름">
          {months.map((m, i) => (
            <li key={m.from} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-ink-soft">{monthLabel(i)}</span>
              <span className={`flex size-7 items-center justify-center rounded-full text-sm font-bold ${RATING[m.rating].cls}`} aria-label={RATING[m.rating].label}>
                {RATING[m.rating].mark}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-center text-[11px] text-ink-soft">◎ 좋음 · ○ 무난 · △ 조심 · ✕ 고비 (절기 기준 2026년 2월 ~ 2027년 1월)</p>

        <div className="mt-4 grid grid-cols-3 gap-1.5 text-center">
          {[
            ["행운의 색", lucky.color],
            ["행운의 숫자", lucky.numbers],
            ["길한 방위", lucky.dir],
          ].map(([k, v]) => (
            <div key={k} className="border border-seal/25 px-1 py-2">
              <p className="text-[11px] text-ink-soft">{k}</p>
              <p className="mt-0.5 font-myeongjo text-sm font-extrabold">{v}</p>
            </div>
          ))}
        </div>
      </RoyalDoc>

      <p className="mt-6 text-center text-xs text-ink-soft">각 제목을 누르면 풀이가 펼쳐지옵니다</p>
      <div className="mt-2 flex flex-col gap-2">
        {sections.map((s, i) => (
          <details key={s.id} open={i < 2} className="group doc-paper px-5 py-4">
            <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo font-extrabold text-seal">{s.hanja}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-extrabold text-seal">{s.label}</span>
                <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">{s.headline}</span>
              </span>
              <span className="mt-1 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className="mt-3 border-t border-seal/15 pt-3">
              {s.id === "core" && (
                <div className="-mt-1 mb-3">
                  <SajuChart {...reading.chart} kingdom={false} />
                </div>
              )}
              {s.paras.map((t) => (
                <p key={t} className="mt-2 text-[15px] leading-relaxed first:mt-0">
                  {t}
                </p>
              ))}
              {s.basis.length > 0 && (
                <div className="mt-3 bg-ink/5 px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
                  <p className="font-bold">정 훈도가 이렇게 본 까닭</p>
                  {s.basis.map((b) => (
                    <p key={b}>· {b}</p>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}

        {/* Month by month */}
        <details className="group doc-paper px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo font-extrabold text-seal">月</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold text-seal">월별 흐름</span>
              <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">
                승부처는 {best.map(monthLabel).join("과 ")}, 숨 고를 달은 {worst.map(monthLabel).join("과 ")}
              </span>
            </span>
            <span className="mt-1 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <ol className="mt-3 flex flex-col divide-y divide-seal/10 border-t border-seal/15">
            {months.map((m, i) => (
              <li key={m.from} className="flex items-start gap-3 py-2.5">
                <span className="w-14 shrink-0">
                  <span className="block text-sm font-extrabold">{monthLabel(i)}</span>
                  <span className="block text-[11px] text-ink-soft">
                    {i === 11 && "'27 "}
                    {m.from}~ {m.gz}
                  </span>
                </span>
                <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${RATING[m.rating].cls}`}>
                  {RATING[m.rating].mark}
                </span>
                <span className="min-w-0 text-[14px] leading-snug">
                  {m.line}
                  {m.tags.map((t) => (
                    <span key={t} className="ml-1 text-xs font-bold whitespace-nowrap text-seal">
                      #{t}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        </details>

        {/* 개운 */}
        <details className="group doc-paper px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo font-extrabold text-seal">福</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold text-seal">정 훈도의 개운법</span>
              <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">
                <Keep>{`${lucky.color}을 곁에 두고 ${lucky.dir}으로 향하시옵소서`}</Keep>
              </span>
            </span>
            <span className="mt-1 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <p className="mt-3 border-t border-seal/15 pt-3 text-[15px] leading-relaxed">
            그대의 용신은 {ELEMENT_KO[lucky.element]}({ELEMENT_HANJA[lucky.element]})이옵니다. 이 기운을 가까이할수록 올해의 흐름이 그대 쪽으로 기울고,{" "}
            {lucky.avoid}처럼 기신의 색은 큰일 앞에서 멀리하시옵소서.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-1.5 text-sm">
            {[
              ["색", lucky.color],
              ["숫자", lucky.numbers],
              ["방위", lucky.dir],
              ["기운이 도는 곳", lucky.place],
              ["힘이 되는 일", lucky.act],
              ["음식", lucky.food],
            ].map(([k, v]) => (
              <div key={k} className="border border-seal/20 px-3 py-2">
                <dt className="text-[11px] text-ink-soft">{k}</dt>
                <dd className="mt-0.5 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>

      <section className="mt-5 border-l-[3px] border-seal/60 py-1 pl-4">
        <p className="text-xs font-extrabold text-seal">정 훈도의 당부</p>
        <ol className="mt-2 flex flex-col gap-1.5 text-[15px] leading-relaxed">
          {advice.map((a, i) => (
            <li key={a} className="flex gap-2">
              <span className="font-myeongjo font-extrabold text-seal">{"一二三"[i]}</span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-right font-myeongjo text-sm text-ink-soft">— 관상감 명과학 훈도 정가, 삼가 적음</p>
      </section>

      {deepen && (missing.daeun || missing.palaces) && (
        <section className="doc-paper mt-6 px-6 pt-7 pb-6">
          <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">更 深</p>
          <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">더 깊이 보아 드릴 수 있사옵니다</h2>
          <p className="mt-2 mb-4 text-center text-sm leading-relaxed text-ink-soft">
            {missing.daeun && "성별을 알려 주시면 10년 대운과 올해의 자리를, "}
            {missing.palaces && "태어난 시간을 알려 주시면 돈·일·연애·건강 영역별 운을 "}더 정밀하게 풀어 드리옵니다.
          </p>
          <DeepenForm courtId={deepen.courtId} who={deepen.who} needs={missing} />
        </section>
      )}

      <section className="mt-6 text-center">
        <p className="text-sm text-ink-soft">더 깊은 이야기는 비밀 보고서에서</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm font-bold">
          {[
            ["yeonae", "연애·결혼"],
            ["jaemul", "재물"],
            ["jikup", "직업·적성"],
          ].map(([id, label]) => (
            <Link key={id} href={`/reports/${id}?${query}`} className="border border-seal/40 py-2.5 text-seal">
              {label} →
            </Link>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-ink-soft/80">사주로 풀어 올린 한 해의 흐름이옵니다. 큰 결정은 그대의 판단으로 내리시옵소서.</p>
      </section>
    </>
  );
}
