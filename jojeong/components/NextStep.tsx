import type { StepFrom, Steps } from "@/lib/nextStep";
import TrackLink from "./TrackLink";

// The one step out of a free page (lib/nextStep.ts): the question the page leaves, a card that answers it, and
// at most a few plain links beside it. No prices; a free step says so.
export default function NextStep({ from, steps: { ask, main, more = [] } }: { from: StepFrom; steps: Steps }) {
  return (
    <section className="mt-5">
      {ask && <p className="text-center text-[12px] font-bold text-ink-soft">{ask}</p>}
      <TrackLink event="to_saju" from={from} href={main.href} className="doc-paper mt-2 flex items-center gap-4 px-5 py-4">
        {main.seal && (
          <span
            className={`flex size-14 shrink-0 -rotate-3 items-center justify-center border-[3px] border-seal font-myeongjo font-extrabold text-seal ${main.seal.length > 2 ? "text-sm" : "text-xl"}`}
          >
            {main.seal}
          </span>
        )}
        <span className="min-w-0 flex-1">
          {main.kicker && <span className="block text-[11px] font-extrabold text-seal">{main.kicker}</span>}
          <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">{main.title}</span>
          {main.line && <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{main.line}</span>}
        </span>
        <span className="shrink-0 font-myeongjo text-sm font-extrabold text-seal">{main.free ? "무료 →" : "보기 →"}</span>
      </TrackLink>
      {more.length > 0 && (
        <p className="mt-2 flex flex-wrap justify-center gap-x-1 text-[12.5px] text-ink-soft">
          {more.map((m, i) => (
            <span key={m.href}>
              {i > 0 && <span className="mx-1 text-ink-soft/50">·</span>}
              <TrackLink event="to_saju" from={from} href={m.href} className="font-bold text-seal underline underline-offset-2">
                {m.title}
              </TrackLink>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
