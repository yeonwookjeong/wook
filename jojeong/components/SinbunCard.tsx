import Link from "next/link";
import type { Pillars } from "@/lib/saju";
import { sinbunOf } from "@/lib/sinbun";
import Keep from "./Keep";

const RANK_STYLE = {
  양반: "border-gold text-gold",
  중인: "border-[#3d6656] text-[#3d6656]",
  상민: "border-ink/60 text-ink",
  천민: "border-seal text-seal",
} as const;

// Free: who you would have been in Joseon. Ends with a bridge to the paid present-day 직업·적성 report.
export default function SinbunCard({
  pillars,
  heading,
  reportQuery,
}: {
  pillars: Pillars;
  heading: string;
  reportQuery: string;
}) {
  const s = sinbunOf(pillars);
  return (
    <section className="doc-paper mt-6 px-6 pt-8 pb-7">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">身 分 鑑 定</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">{heading}</h2>
      <div className="mt-4 flex flex-col items-center text-center">
        <span className={`border-2 px-3 py-0.5 font-myeongjo text-sm font-extrabold ${RANK_STYLE[s.rank]}`}>{s.rank}</span>
        <p className="mt-2 font-myeongjo text-3xl font-extrabold">{s.job}</p>
        <p className="mt-1 text-sm text-ink-soft">{s.line}</p>
      </div>

      <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1">
        {(["새벽", "낮", "밤"] as const).map((when, i) => (
          <li key={when} className="flex gap-3 py-2 text-[14px] leading-relaxed">
            <span className="w-8 shrink-0 font-myeongjo font-extrabold text-seal">{when}</span>
            <span>{s.day[i]}</span>
          </li>
        ))}
      </ol>

      <div className="mt-3 text-[14px] leading-relaxed">
        <p className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-ink-soft">출세 가능성</span>
          <span aria-label={`5점 만점에 ${s.rise}점`}>
            <span className="text-gold">{"★".repeat(s.rise)}</span>
            <span className="text-ink/15">{"★".repeat(5 - s.rise)}</span>
          </span>
        </p>
        <p className="mt-0.5">{s.riseText}</p>
      </div>

      <Link href={`/reports/jikup?${reportQuery}`} className="mt-4 block border border-seal/30 bg-seal/5 px-4 py-3 text-sm">
        <span className="block font-bold">
          <Keep>{s.now}</Keep>
        </span>
        <span className="mt-1 block text-seal">
          어울리는 일 세 가지는 <span className="inline-block">&lsquo;직업·적성&rsquo; 보고서에서 →</span>
        </span>
      </Link>
    </section>
  );
}
