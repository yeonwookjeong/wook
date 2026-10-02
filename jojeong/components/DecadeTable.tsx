import type { DecadeYear, Domain } from "@/lib/domains";

const TITLE: Record<Domain, string> = { jaemul: "재물", yeonae: "연애·결혼", jikup: "직업" };
const MARK = ["✕", "△", "○", "◎"];
const STYLE = ["bg-ink/10 text-ink", "bg-ink/5 text-ink-soft", "bg-gold/25 text-ink", "bg-seal text-hanji"];
// The calendar starts at this year, so the free taste is the year the reader is in; next year is already the hook.
const FREE_YEARS = 1;

// The ten-year calendar of a deep report, computed year by year (lib/domains.ts). Before purchase only the
// first year shows; the rest are placeholders, so nothing paid is in the page source.
export default function DecadeTable({ name, domain, years, locked }: { name: string; domain: Domain; years: DecadeYear[]; locked: boolean }) {
  if (!years.length) return null;
  const shown = locked ? years.slice(0, FREE_YEARS) : years;
  return (
    <section className="doc-paper mt-4 px-5 pt-6 pb-5">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {TITLE[domain]} 10년 달력
      </h2>
      <p className="mt-1 text-center text-[11px] text-ink-soft">
        {years[0].year}~{years.at(-1)!.year} · 해마다 드는 기운을 {name}님 사주에 비춰 계산했어요 · ◎ 좋음 ○ 무난 △ 잔잔 ✕ 조심
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-seal/10">
        {shown.map((y) => (
          <li key={y.year} className="flex gap-3 py-2.5">
            <span className="w-12 shrink-0">
              <b className="block font-myeongjo">{y.year}</b>
              <span className="text-[11px] text-ink-soft">{y.gz}</span>
            </span>
            <span className={`h-fit shrink-0 rounded-md px-1.5 py-0.5 text-xs font-extrabold ${STYLE[y.grade + 1]}`}>{MARK[y.grade + 1]}</span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14px]">{y.tag}</b>
              <span className="text-[12px] leading-snug text-ink-soft">{y.why.join(" · ") || "특별히 드는 기운이 없는 해예요"}</span>
            </span>
          </li>
        ))}
      </ul>
      {locked && (
        <div className="relative mt-1 overflow-hidden" aria-hidden="true">
          <div className="flex flex-col gap-3 blur-[5px] select-none">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <span className="h-8 w-12 rounded bg-ink/10" />
                <span className="h-5 w-6 rounded bg-seal/20" />
                <span className="h-8 flex-1 rounded bg-ink/10" />
              </div>
            ))}
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-center font-myeongjo text-sm font-extrabold text-seal">
            🔒 {years[FREE_YEARS].year}~{years.at(-1)!.year}년은 결제하면 열려요
          </span>
        </div>
      )}
    </section>
  );
}
