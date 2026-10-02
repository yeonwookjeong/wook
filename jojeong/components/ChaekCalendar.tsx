import { WEEK, type ChaekDay } from "@/lib/chaek";

// One calendar month of the almanac: lunar date under each day, 손 없는 날 in red, the 절기 named, Sundays and
// public holidays in red numbers, and (with a saved chart) a mark on the days that clash with the reader's.
export default function ChaekCalendar({ days, clash }: { days: ChaekDay[]; clash?: Set<number> }) {
  const cells = [...Array<null>(days[0].wd).fill(null), ...days];
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEK.split("").map((w, i) => (
        <p key={w} className={`pb-1 text-[12px] font-extrabold ${i === 0 ? "text-seal" : i === 6 ? "text-[#1f4e8c]" : "text-ink-soft"}`}>
          {w}
        </p>
      ))}
      {cells.map((x, i) =>
        x ? (
          <div
            key={i}
            className={`relative min-h-[58px] rounded-lg px-0.5 pt-1 pb-1 ${x.son ? "bg-seal text-hanji" : "bg-ink/[0.04]"} ${clash?.has(x.d) ? "ring-2 ring-ink ring-offset-1" : ""}`}
          >
            <b
              className={`block font-myeongjo text-[17px] leading-tight ${x.son ? "" : x.wd === 0 || x.holi ? "text-seal" : x.wd === 6 ? "text-[#1f4e8c]" : ""}`}
            >
              {x.d}
            </b>
            <span className={`block text-[10px] leading-tight ${x.son ? "text-hanji/90" : "text-ink-soft"}`}>{x.lunar}</span>
            {x.son ? (
              <span className="block text-[10px] leading-tight font-extrabold">손 없음</span>
            ) : x.term ? (
              <span className="block text-[10px] leading-tight font-extrabold text-[#a87a22]">{x.term.ko}</span>
            ) : null}
            {clash?.has(x.d) && (
              <span className="absolute -top-1.5 -right-1 rounded-full bg-ink px-1 text-[9px] leading-[14px] font-extrabold text-hanji">충</span>
            )}
          </div>
        ) : (
          <div key={i} />
        ),
      )}
    </div>
  );
}
