import Link from "next/link";
import type { Today } from "@/lib/today";

// 오늘의 일진, under the hero: today's pillar as an image and advice, personal when the reader's chart is known.
export default function TodayCard({ today, name }: { today: Today; name: string | null }) {
  return (
    <section className="doc-paper mt-3 px-6 py-5">
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
        <Link href="/reports/gukjeong" className="mt-3 block text-[13px] font-bold text-seal">
          내 사주로 보면 오늘이 나에게 어떤 날인지 알려 드려요 →
        </Link>
      )}
    </section>
  );
}
