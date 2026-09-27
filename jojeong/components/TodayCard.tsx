import MeForm from "./MeForm";
import type { Today } from "@/lib/today";

// 오늘의 일진, under the hero: today's pillar as an image and advice, personal when the reader's chart is known.
export default function TodayCard({ today, name }: { today: Today; name: string | null }) {
  return (
    <section id="today" className="doc-paper mt-3 scroll-mt-4 px-6 py-5">
      <p className="flex items-baseline justify-between text-xs">
        <span className="font-extrabold text-seal">오늘의 일진</span>
        <span className="text-ink-soft">
          {today.date} · <b className="font-myeongjo text-ink">{today.gz}</b>
        </span>
      </p>
      <p className="mt-2 font-myeongjo text-lg leading-snug font-extrabold">{today.image}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{today.advice}</p>
      {today.personal ? (
        <p className="mt-3 rounded-xl bg-seal/8 px-3 py-2 text-[14px] leading-relaxed">
          <b className="text-seal">{name}님에게는</b> {today.personal}
        </p>
      ) : (
        // Entered right here, then back to this card with the reader's own line.
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-[13px] font-bold text-seal [&::-webkit-details-marker]:hidden">
            오늘, 나한테도 좋은 날일까? <span className="inline-block transition group-open:rotate-90">→</span>
          </summary>
          <div className="mt-4 border-t border-seal/15 pt-4">
            <MeForm next="/#today" submit="오늘 내 운 보기" />
          </div>
        </details>
      )}
    </section>
  );
}
