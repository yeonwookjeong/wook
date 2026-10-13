import type { YearPreview } from "@/lib/freePreview";
import type { YearRow } from "@/lib/yeonun";

// The free "한눈에" of a year (app/reports/[id], 연운): the year between the one before and after, each area of life
// that year, and the ten years it stands in. All computed (no writer), the same grades the report is told.

const V_STYLE: Record<string, string> = {
  대길: "bg-seal text-hanji",
  길: "bg-seal/20 text-seal",
  평: "bg-ink/10 text-ink",
  조심: "bg-[#d4af5f]/35 text-ink",
  인내: "bg-ink text-hanji",
};
const AREA_W = { 좋음: 92, 보통: 58, 조심: 26 } as const;
const AREA_BAR = { 좋음: "bg-seal", 보통: "bg-seal/45", 조심: "bg-ink/35" } as const;
const AREA_WHAT: Record<string, string> = { 돈: "돈과 재물", 일: "일과 자리", 사랑: "사랑과 인연", 사람: "사람과 귀인", 몸: "몸과 마음" };

export type GlanceDecade = { from: number; to: number; mood: string; theme: string } | null;

export default function YearGlance({ name, y, rows, preview, decade }: { name: string; y: number; rows: YearRow[]; preview: YearPreview | null; decade: GlanceDecade }) {
  const areas = preview?.areas ?? [];
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted.at(-1);
  return (
    <section className="doc-paper mt-4 px-5 pt-6 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">한 눈 에</p>
      <h3 className="mt-1 text-center font-myeongjo text-[17px] font-extrabold">
        {name}님의 {y}년, 한눈에
      </h3>

      {/* The year between its neighbours */}
      {rows.length > 1 && (
        <>
          <p className="mt-5 text-[12px] font-bold text-seal">앞뒤 해와 견주면</p>
          <ol className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            {rows.map((r) => (
              <li key={r.year} className={`rounded-xl px-1.5 py-2.5 ${r.year === y ? "bg-white/70 ring-2 ring-seal/40" : "bg-white/40"}`}>
                <span className={`block font-myeongjo text-[14px] font-extrabold ${r.year === y ? "text-seal" : ""}`}>{r.year}</span>
                <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${V_STYLE[r.verdict]}`}>{r.verdict}</span>
                <span className="mt-1 block text-[11px] leading-tight text-ink-soft">{r.theme}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Each area of life */}
      {areas.length > 0 && (
        <>
          <p className="mt-5 text-[12px] font-bold text-seal">영역마다</p>
          <ul className="mt-2 flex flex-col gap-2">
            {areas.map((a) => (
              <li key={a.area} className="grid grid-cols-[4.6rem_1fr_2.4rem] items-center gap-2 text-[12.5px]">
                <span className="font-bold">{AREA_WHAT[a.area]}</span>
                <span className="h-2.5 rounded-full bg-ink/8">
                  <span className={`block h-2.5 rounded-full ${AREA_BAR[a.grade]}`} style={{ width: `${AREA_W[a.grade]}%` }} />
                </span>
                <span className={`text-right text-[11.5px] font-bold ${a.grade === "좋음" ? "text-seal" : "text-ink-soft"}`}>{a.grade}</span>
              </li>
            ))}
          </ul>
          {best && worst && best.area !== worst.area && (
            <p className="mt-3 rounded-lg bg-seal/5 px-3 py-2 text-[13px] leading-relaxed">
              가장 힘이 붙는 곳은 <b className="text-seal">{AREA_WHAT[best.area]}</b>, 가장 아껴 쓸 곳은 <b>{AREA_WHAT[worst.area]}</b>예요.
            </p>
          )}
        </>
      )}

      {/* The ten years it stands in */}
      {decade && (
        <>
          <p className="mt-5 text-[12px] font-bold text-seal">10년 흐름 속에서</p>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            {y}년은 <b>
              {decade.from}~{decade.to}년
            </b>{" "}
            10년 안에 있어요. 이 10년은 <b className="text-seal">{decade.mood}</b>의 흐름, {decade.theme}
            {/[가-힣]$/.test(decade.theme) && (decade.theme.charCodeAt(decade.theme.length - 1) - 0xac00) % 28 ? "이에요." : "예요."}
          </p>
        </>
      )}

      <p className="mt-4 border-t border-seal/10 pt-3 text-[11px] leading-relaxed text-ink-soft">
        판정과 영역별 표시는 이 사주에 그해 드는 기운을 계산한 결과예요. 왜 그런지, 달마다 무엇을 할지는 아래 보고서에 풀어 드려요.
      </p>
    </section>
  );
}
