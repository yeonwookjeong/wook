import { ELEMENT_HANJA, ELEMENT_KO } from "@/lib/myeongri";
import { perHundred, type Distinct } from "@/lib/rarity";

// Before the written report: how the chart was read (weighted, not eight equal letters) and what sets it apart
// from others with the same day pillar, in numbers the engine worked out (lib/rarity.ts).
export default function ChartIntro({ name, d }: { name: string; d: Distinct }) {
  const top = d.patterns.filter((x) => x.rate < 0.3).slice(0, 4);
  return (
    <section className="doc-paper mt-4 px-5 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">讀 法</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">{name}님의 사주를 이렇게 읽었어요</h2>

      <h3 className="mt-5 text-sm font-extrabold">여덟 글자를 똑같이 세지 않아요</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed">
        사주는 여덟 글자지만 무게가 다 달라요. 계절을 쥔 태어난 달의 지지를 가장 무겁게(35%), 나와 가장 가까운 태어난 날의 지지를 그다음(15%)으로,
        나머지는 10%씩 봐요. 계절 보정과 글자끼리의 합(서로 묶이거나 성질이 바뀌는 것)까지 반영하면, 글자 수로만 센 것과 이만큼 달라져요.
      </p>
      <div className="mt-3 flex flex-col gap-1.5" aria-label="오행 비율: 글자 수 기준과 무게 기준">
        {[0, 1, 2, 3, 4].map((e) => (
          <div key={e} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 font-bold">
              {ELEMENT_KO[e]}({ELEMENT_HANJA[e]})
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="h-1.5 rounded-full bg-ink/15" style={{ width: `${Math.max(1, d.weights.simple[e] * 100)}%` }} />
              <span className="h-2 rounded-full bg-seal" style={{ width: `${Math.max(1, d.weights.weighted[e] * 100)}%` }} />
            </span>
            <span className="w-20 shrink-0 text-right text-ink-soft">
              {Math.round(d.weights.simple[e] * 100)}% → <b className="text-ink">{Math.round(d.weights.weighted[e] * 100)}%</b>
            </span>
          </div>
        ))}
        <p className="text-[11px] text-ink-soft">
          <span className="mr-1 inline-block h-1.5 w-3 rounded-full bg-ink/15 align-middle" />
          글자 수로 센 비율 <span className="mr-1 ml-2 inline-block h-2 w-3 rounded-full bg-seal align-middle" />
          자리·계절·합을 반영한 비율
        </p>
      </div>

      {d.ilju && (
        <>
          <h3 className="mt-5 text-sm font-extrabold">같은 {d.ilju.name}일주라도 다 같지 않아요</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed">
            {d.ilju.name}일주는 60가지 일주 가운데 하나예요. 하지만 태어난 계절, 태어난 달이 정하는 사주의 틀(격국), 가장 무거운 기운이 다르면 전혀 다른
            사람이 돼요. {name}님은 <b>{d.ilju.build} {d.ilju.name}일주</b>로, 같은 일주 가운데 <b>약 {Math.max(1, Math.round(d.ilju.rate * 100))}%</b>만 이
            구조예요.
          </p>
        </>
      )}

      {(top.length > 0 || d.extremes.length > 0) && (
        <>
          <h3 className="mt-5 text-sm font-extrabold">{name}님 사주에서 드물게 보이는 것</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {top.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 border-b border-seal/10 pb-1.5 text-[14px] last:border-b-0">
                <span className="min-w-0">
                  <b>{x.plain}</b> <span className="text-[11px] text-ink-soft">{x.term}</span>
                </span>
                <span className="shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{perHundred(x.rate)}</span>
              </li>
            ))}
          </ul>
          {d.extremes.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {d.extremes.slice(0, 3).map((x) => (
                <span key={x.label} className="rounded-full border border-seal/30 px-2.5 py-0.5 text-[11px] font-bold text-seal">
                  {x.label.split("(")[0]} {Math.round(x.value * 100)}% · {x.side === "high" ? "상위" : "하위"} {Math.max(1, Math.round(x.rate * 100))}%
                </span>
              ))}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
            숫자는 1950~2008년의 모든 날, 모든 시간으로 세운 사주 25만여 개와 비교한 값이에요. 아래 보고서는 이 특징들을 바탕으로 썼어요.
          </p>
        </>
      )}
    </section>
  );
}
