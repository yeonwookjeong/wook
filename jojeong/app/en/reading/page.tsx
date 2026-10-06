import type { Metadata } from "next";
import Link from "next/link";
import { cityById } from "@/lib/cities";
import { ANIMAL_EN, BRANCH_RO, ELEMENT_EN, enReading, STEM_RO } from "@/lib/en/saju";
import { BRANCH_EL } from "@/lib/myeongri";
import { BRANCHES, computePillars, resolveBirthTime, STEMS, type BirthInput } from "@/lib/saju";

export const metadata: Metadata = { title: "Your four pillars" };

// The English free reading: the chart, the Day Master, the five elements and the zodiac animal, from
// ?d=YYYY-MM-DD[&t=HH:MM&c=cityId]. The same engine as the Korean site (lib/saju.ts).
function chartFor(d: string, t: string, c: string) {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  let input: BirthInput = { year: +m[1], month: +m[2], day: +m[3], calendar: "solar", hourBranch: null };
  const tm = t.match(/^(\d{2}):(\d{2})$/);
  if (tm && c) {
    const city = cityById(c);
    input = resolveBirthTime(input, { hour: +tm[1], minute: +tm[2] }, { lon: city.lon, tz: city.tz }).input;
  }
  try {
    return computePillars(input);
  } catch {
    return null;
  }
}

function Cell({ stem, branch }: { stem: number | null; branch: number | null }) {
  if (stem === null || branch === null)
    return <div className="grid h-[132px] place-items-center rounded-lg border border-dashed border-ink/25 text-[11px] text-ink-soft">unknown</div>;
  const se = ELEMENT_EN[Math.floor(stem / 2)];
  const be = ELEMENT_EN[BRANCH_EL[branch]];
  return (
    <div className="flex flex-col gap-1">
      <div className="rounded-lg py-2 text-center text-hanji" style={{ background: se.color }}>
        <p className="font-myeongjo text-[26px] leading-none">{STEMS[stem]}</p>
        <p className="mt-1 text-[10.5px]">{STEM_RO[stem]} · {se.name}</p>
      </div>
      <div className="rounded-lg py-2 text-center text-hanji" style={{ background: be.color }}>
        <p className="font-myeongjo text-[26px] leading-none">{BRANCHES[branch]}</p>
        <p className="mt-1 text-[10.5px]">{BRANCH_RO[branch]} · {ANIMAL_EN[branch]}</p>
      </div>
    </div>
  );
}

export default async function EnReadingPage({ searchParams }: PageProps<"/en/reading">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => String(Array.isArray(v) ? v[0] : (v ?? ""));
  const p = chartFor(one(sp.d), one(sp.t), one(sp.c));
  if (!p)
    return (
      <section className="doc-paper mt-8 px-5 py-6 text-center">
        <p className="font-myeongjo text-lg font-extrabold">Hundo couldn&rsquo;t read that date</p>
        <p className="mt-2 text-[14px] text-ink-soft">Please check the date (1920–2025) and try again.</p>
        <Link href="/en" className="mt-4 inline-block rounded-full bg-seal px-5 py-2.5 font-bold text-hanji">Back</Link>
      </section>
    );
  const r = enReading(p);
  const dmEl = ELEMENT_EN[r.dayMaster.element];
  const max = Math.max(...r.elements.map((e) => e.count), 1);
  return (
    <>
      <section className="doc-paper mt-6 px-5 py-5">
        <p className="text-center text-xs font-extrabold tracking-[0.3em] text-seal">YOUR FOUR PILLARS</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {r.pillars.map((x) => (
            <div key={x.label}>
              <p className="mb-1 text-center text-[11px] font-bold text-ink-soft">{x.label}</p>
              <Cell stem={x.stem} branch={x.branch} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] text-ink-soft">
          Read right to left, the way Joseon scholars wrote: year, month, day, hour.
          {!r.hourKnown && " Without a birth time the hour pillar stays open; the other six characters are read in full."}
        </p>
      </section>

      <section className="doc-paper mt-3 px-5 py-5">
        <p className="text-xs font-extrabold tracking-[0.2em] text-seal">YOUR DAY MASTER · 日干</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg font-myeongjo text-3xl text-hanji" style={{ background: dmEl.color }}>
            {STEMS[r.dayMaster.stem]}
          </span>
          <div>
            <h1 className="font-myeongjo text-[22px] font-extrabold leading-tight">{r.dayMaster.image}</h1>
            <p className="text-[12.5px] text-ink-soft">
              {STEM_RO[r.dayMaster.stem]} · {r.dayMaster.yang ? "Yang" : "Yin"} {dmEl.name}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-[1.75]">{r.dayMaster.light}</p>
        <p className="mt-2 text-[14px] leading-[1.75]">
          <span className="mr-1.5 rounded bg-ink px-1.5 text-[11px] font-bold text-hanji">shadow</span>
          {r.dayMaster.shadow}
        </p>
        <p className="mt-3 text-[11.5px] text-ink-soft">
          Your Day Master is the stem of the day you were born, the “I” of the chart. It is the closest thing saju has to a sun sign.
        </p>
      </section>

      <section className="doc-paper mt-3 px-5 py-5">
        <p className="text-xs font-extrabold tracking-[0.2em] text-seal">FIVE ELEMENTS · 五行</p>
        <div className="mt-3 flex flex-col gap-2">
          {r.elements.map((e) => (
            <div key={e.name} className="grid grid-cols-[5.5em_1fr_1.5em] items-center gap-2 text-[13px]">
              <span>
                <span className="font-myeongjo">{e.hanja}</span> {e.name}
              </span>
              <span className="h-3 overflow-hidden rounded bg-hanji-deep">
                <span className="block h-full rounded" style={{ width: `${(e.count / max) * 100}%`, background: e.color }} />
              </span>
              <span className="text-right tabular-nums">{e.count}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[14px] leading-[1.75]">{r.strong}</p>
        <p className="mt-1 text-[14px] leading-[1.75]">{r.weak}</p>
      </section>

      <section className="doc-paper mt-3 px-5 py-5 text-center">
        <p className="text-xs font-extrabold tracking-[0.2em] text-seal">YOUR ZODIAC ANIMAL · 띠</p>
        <p className="mt-1 font-myeongjo text-[22px] font-extrabold">The {r.animal}</p>
        <p className="mt-1 text-[12.5px] text-ink-soft">From your year pillar. In saju it is only one of eight characters, not the whole story.</p>
      </section>

      <section className="mt-4 rounded-xl border border-ink/15 bg-white/50 px-5 py-4 text-center">
        <p className="font-myeongjo text-[17px] font-extrabold">Coming soon from Hundo</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          Your full life reading, love and compatibility, and your ten-year seasons of luck.
        </p>
      </section>
      <Link href="/en" className="mt-4 block text-center text-[13px] font-bold text-seal underline">
        Read another chart
      </Link>
    </>
  );
}
