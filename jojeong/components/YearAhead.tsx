import { ClassicLine } from "@/components/YearReport";
import { CLASSICS } from "@/lib/classics";
import type { AreaGrade, Layers, YearPreview } from "@/lib/freePreview";
import { yearNickname, type YearDetail } from "@/lib/yeonun";

// The coming year on the free screen (still only in the owner's 시안 모드, lib/admin.ts isPreview): its verdict,
// five areas as chips, the chart with the decade and the year stacked on it, and its twelve months as bars.
const GRADE: Record<AreaGrade, { mark: string; cls: string }> = {
  좋음: { mark: "◎ 좋음", cls: "bg-seal text-hanji" },
  보통: { mark: "○ 보통", cls: "bg-gold/25 text-ink" },
  // "다지기", not "조심": a year to build in, which is what the reading says, without the fright.
  조심: { mark: "△ 다지기", cls: "bg-ink/15 text-ink" },
};
// A month's grade (lib/yeonun.ts monthMarks: ◎ 3 · ○ 2 · △ 1 · ✕ 0) as a bar.
const MONTH = [
  { mark: "✕", h: 22, bar: "#4d5966" },
  { mark: "△", h: 45, bar: "#8b95a1" },
  { mark: "○", h: 70, bar: "#c9a13b" },
  { mark: "◎", h: 100, bar: "#b3261e" },
] as const;

// ⑨ The coming year: its verdict, five areas as chips, and its twelve months as bars (grades only).
export default function YearAhead({
  name,
  y,
  d,
  layers,
  mood,
}: {
  name: string;
  y: YearPreview;
  d: YearDetail;
  layers: Layers;
  mood: string | null;
}) {
  const at = (i: number) => d.months[i]?.from;
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">
        {y.hanja.split("").join(" ")}
      </p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {y.year} {y.ko}
      </h2>
      <p className="mt-1 text-center text-[12px] text-ink-soft">
        {yearNickname(y.year)} · 천간 {y.gods[0]} · 지지 {y.gods[1]} · 한 해{" "}
        <b className="text-ink">{y.verdict}</b>
      </p>
      <div className="mt-4 rounded-2xl border-l-[3px] border-seal bg-seal/5 px-4 py-3">
        <p className="font-myeongjo text-[16px] font-extrabold">{d.theme}</p>
        <p className="mt-1 text-[14px] leading-relaxed">{d.themeLine}</p>
        <p className="mt-1.5 text-[13px] font-bold text-seal">{d.line}</p>
      </div>
      <ul className="mt-4 grid grid-cols-5 gap-1.5 text-center">
        {y.areas.map((a) => (
          <li key={a.area} className="flex flex-col gap-1">
            <span className="font-myeongjo text-[15px] font-extrabold">
              {a.area}
            </span>
            <span
              className={`rounded-md py-0.5 text-[11px] font-bold ${GRADE[a.grade].cls}`}
            >
              {GRADE[a.grade].mark}
            </span>
          </li>
        ))}
      </ul>
      <Stack layers={layers} y={y} mood={mood} />
      <h3 className="mt-5 text-sm font-extrabold">12달 흐름</h3>
      <div
        className="mt-2 flex h-28 items-end gap-1"
        role="img"
        aria-label={y.months
          .map((m) => `${m.from} ${MONTH[m.rating].mark}`)
          .join(", ")}
      >
        {y.months.map((m) => (
          <div key={m.from} className="flex h-full flex-1 flex-col justify-end">
            <span
              className="text-center text-[10px] font-bold"
              style={{ color: MONTH[m.rating].bar }}
            >
              {MONTH[m.rating].mark}
            </span>
            <span
              className="block rounded-t-sm"
              style={{
                height: `${MONTH[m.rating].h}%`,
                background: MONTH[m.rating].bar,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-center text-[9.5px] leading-tight text-ink-soft">
        {y.months.map((m) => (
          <span key={m.from} className="flex-1">
            {m.from}
            <span className="block font-myeongjo text-[10px] text-ink">
              {m.gz}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[13px]">
        <b className="text-seal">힘이 붙는 달</b> {d.best.map(at).join(" · ")}
        부터 <span className="mx-1 text-ink-soft">|</span>
        <b>조심할 달</b> {d.worst.map(at).join(" · ")}부터
      </p>
      <h3 className="mt-5 text-sm font-extrabold">
        {y.year}년이 {name}님 사주와 만나는 자리
      </h3>
      <ul className="mt-2 flex flex-col gap-2 text-[14px] leading-relaxed">
        {d.points.map((p) => (
          <li key={p} className="border-b border-seal/10 pb-2 last:border-b-0">
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink-soft">
        달은 절기로 바뀌어요(날짜는 그 달이 시작하는 날). ◎ ○ △ ✕ 네 단계.
      </p>
      <div className="mt-3 bg-ink/5 px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        <ClassicLine c={CLASSICS.세운} />
      </div>
    </section>
  );
}

// A layer's tags, or a note that it meets nothing.
function Tags({ tags }: { tags: string[] }) {
  return tags.length ? (
    <span className="mt-1 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-seal/25 bg-white/60 px-1.5 py-px font-myeongjo text-[10.5px] text-ink-soft"
        >
          {t}
        </span>
      ))}
    </span>
  ) : (
    <span className="mt-1 block text-[11px] text-ink-soft">부딪힘·합 없음</span>
  );
}
function Row({
  step,
  label,
  children,
  tone,
}: {
  step: string;
  label: string;
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <li className={`relative rounded-xl px-3 py-2.5 ${tone}`}>
      <p className="flex items-baseline gap-2">
        <span className="text-[10px] font-extrabold tracking-wider text-seal">
          {step}
        </span>
        <b className="text-[13px]">{label}</b>
      </p>
      {children}
    </li>
  );
}

// 겹쳐 보기: the chart at the bottom, the decade on it, the year on that, the months on top of all (read upward).
function Stack({
  layers,
  y,
  mood,
}: {
  layers: Layers;
  y: YearPreview;
  mood: string | null;
}) {
  return (
    <>
      <h3 className="mt-5 text-sm font-extrabold">
        겹쳐 보기 · 내 사주 위에 {y.year}년을 얹으면
      </h3>
      <p className="mt-0.5 text-[11px] text-ink-soft">
        아래에서 위로 한 층씩 쌓여요. 아래층이 바탕, 위층이 그 위에 부는
        바람이에요.
      </p>
      <ol className="mt-2 flex flex-col-reverse gap-1.5">
        <Row step="1층" label="타고난 사주 (원국)" tone="bg-ink/5">
          <span className="mt-1 flex gap-1.5 font-myeongjo text-[15px] font-extrabold">
            {layers.natal.map((n) => (
              <span
                key={n.pos}
                className="flex flex-col items-center leading-tight"
              >
                {n.gz}
                <span className="font-sans text-[9.5px] font-normal text-ink-soft">
                  {n.pos}주
                </span>
              </span>
            ))}
          </span>
        </Row>
        {layers.daeun ? (
          <Row
            step="2층"
            label={`10년 대운 ${layers.daeun.gz} · ${layers.daeun.from}~${layers.daeun.to}${mood ? ` · ${mood}` : ""}`}
            tone="bg-gold/15"
          >
            <span className="block text-[11px] text-ink-soft">
              원국과 만나는 자리
            </span>
            <Tags tags={layers.daeun.tags} />
          </Row>
        ) : (
          <Row
            step="2층"
            label="10년 대운 · 성별을 넣으면 보여요"
            tone="bg-gold/10"
          >
            {null}
          </Row>
        )}
        <Row
          step="3층"
          label={`${y.year}년 세운 ${layers.year.gz} · ${y.verdict}`}
          tone="bg-seal/10"
        >
          <span className="block text-[11px] text-ink-soft">원국과</span>
          <Tags tags={layers.year.natal} />
          {layers.daeun && (
            <>
              <span className="mt-1.5 block text-[11px] text-ink-soft">
                대운과
              </span>
              <Tags tags={layers.year.daeun} />
            </>
          )}
        </Row>
        <Row
          step="4층"
          label="달마다 (월운) · 아래 12달 흐름"
          tone="border border-seal/30"
        >
          {null}
        </Row>
      </ol>
    </>
  );
}

// The free screen's look at the coming year, kept short: its theme, the twelve months as bars, the months that lift
// and the ones to go easy in, and the way on to the year's own report (the rest of YearAhead is that report's).
export function YearTeaser({ name, y, d, href }: { name: string; y: YearPreview; d: YearDetail; href: string }) {
  const at = (i: number) => d.months[i]?.from;
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{y.hanja.split("").join(" ")}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {y.year}년, 한눈에
      </h2>
      <div className="mt-3 rounded-2xl border-l-[3px] border-seal bg-seal/5 px-4 py-3">
        <p className="font-myeongjo text-[16px] font-extrabold">{d.theme}</p>
        <p className="mt-1 text-[14px] leading-relaxed">{d.themeLine}</p>
      </div>
      <div className="mt-4 flex h-20 items-end gap-1" role="img" aria-label={y.months.map((m) => `${m.from} ${MONTH[m.rating].mark}`).join(", ")}>
        {y.months.map((m) => (
          <div key={m.from} className="flex h-full flex-1 flex-col justify-end">
            <span className="block rounded-t-sm" style={{ height: `${MONTH[m.rating].h}%`, background: MONTH[m.rating].bar }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-center text-[9.5px] text-ink-soft">
        {y.months.map((m) => (
          <span key={m.from} className="flex-1">
            {m.from}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[13px]">
        <b className="text-seal">힘이 붙는 달</b> {d.best.map(at).join(" · ")}부터 <span className="mx-1 text-ink-soft">|</span>
        <b>쉬어 갈 달</b> {d.worst.map(at).join(" · ")}부터
      </p>
      <a href={href} className="mt-4 block rounded-full border-2 border-seal py-2.5 text-center text-[14px] font-bold text-seal">
        {y.year}년 달마다 할 일까지 전체 풀이 보기 →
      </a>
    </section>
  );
}
