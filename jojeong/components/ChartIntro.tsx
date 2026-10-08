import { BRANCH_EL, stemEl, type Slot } from "@/lib/myeongri";
import { perHundred, type Distinct } from "@/lib/rarity";
import { BRANCHES, hanjaKo, STEMS } from "@/lib/saju";
import { Cell } from "./SajuChart";
import LockedLine from "./LockedLine";

const POS_ROLE = { 시: "자녀·말년", 일: "나·배우자", 월: "부모·일터", 연: "뿌리·어린 시절" } as const;

// Before the written report: the chart, and what sets it apart
// from others with the same day pillar, in numbers the engine worked out (lib/rarity.ts).
// `chips`: the shares that stand out, left off where the 성향 지도 (FreeReading) shows them anyway.
// `lockHref`: the reader does not own the life report, so only the first "so what" is told; the link goes to it.
export default function ChartIntro({
  name,
  d,
  slots,
  chips = true,
  lockHref = null,
}: {
  name: string;
  d: Distinct;
  slots: Slot[];
  chips?: boolean;
  lockHref?: string | null;
}) {
  const top = d.patterns.filter((x) => x.rate < 0.3).slice(0, 4);
  // "So what": what the rarest features mean in a life, in plain sentences (lib/patterns.ts), no writer
  // involved. A personality one first, then the rarest from another area.
  const lead = top.find((x) => x.area === "성격") ?? top[0];
  const second = lead && top.find((x) => x.id !== lead.id && x.area !== lead.area);
  const sowhat = [lead, second].filter((x): x is (typeof top)[number] => Boolean(x));
  return (
    <section className="doc-paper mt-4 px-5 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">讀 法</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">{name}님의 사주를 이렇게 읽었어요</h2>

      <h3 className="mt-5 text-sm font-extrabold">{name}님의 사주팔자</h3>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
        {slots.map((s) => (
          <div key={s.pos} className="flex flex-col gap-1">
            <span className="text-[11px] font-bold">{s.pos}주</span>
            <span className="text-[10px] leading-tight text-ink-soft">{POS_ROLE[s.pos]}</span>
            <Cell value={s.stem === null ? null : STEMS[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
            <span className="text-[10px] font-bold text-ink-soft">{s.pos === "일" && s.stem !== null ? "나" : "\u00a0"}</span>
            <Cell value={s.branch === null ? null : BRANCHES[s.branch]} el={s.branch === null ? null : BRANCH_EL[s.branch]} />
            <span className="text-[10px] font-bold text-ink-soft">{s.branch === null ? "모름" : "\u00a0"}</span>
          </div>
        ))}
      </div>

      {d.ilju && (
        <>
          <h3 className="mt-5 text-sm font-extrabold">
            같은 {hanjaKo(d.ilju.name)}({d.ilju.name})일주라도 다 같지 않아요
          </h3>
          <p className="mt-1.5 text-[14px] leading-relaxed">
            {hanjaKo(d.ilju.name)}일주는 60가지 일주 가운데 하나예요. 하지만 태어난 계절, 태어난 달이 정하는 사주의 틀(격국), 가장 무거운 기운이 다르면 전혀 다른
            사람이 돼요. {name}님은 <b>
              {d.ilju.build} {hanjaKo(d.ilju.name)}일주
            </b>로, 같은 일주 가운데 <b>약 {Math.max(1, Math.round(d.ilju.rate * 100))}%</b>만 이
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
          {chips && d.extremes.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {d.extremes.slice(0, 3).map((x) => (
                <span key={x.label} className="rounded-full border border-seal/30 px-2.5 py-0.5 text-[11px] font-bold text-seal">
                  {x.label.split("(")[0]} {Math.round(x.value * 100)}% · {x.side === "high" ? "상위" : "하위"} {Math.max(1, Math.round(x.rate * 100))}%
                </span>
              ))}
            </p>
          )}
          {sowhat.length > 0 && (
            <div className="mt-4 rounded-2xl border-l-[3px] border-seal bg-seal/5 px-4 py-3">
              <p className="text-xs font-extrabold text-seal">그래서 {name}님은</p>
              {sowhat.map((x, i) =>
                lockHref && i > 0 ? (
                  <LockedLine key={x.id} href={lockHref} chapter="who" className="mt-1.5" />
                ) : (
                  <p key={x.id} className="mt-1.5 text-[15px] leading-relaxed">
                    {x.meaning}
                  </p>
                ),
              )}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
            숫자는 1950~2008년에 태어날 수 있는 모든 날·시의 사주와 비교한 값이에요. 아래 보고서는 이 특징들을 바탕으로 썼어요.
          </p>
        </>
      )}
    </section>
  );
}
