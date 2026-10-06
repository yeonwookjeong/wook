import type { Metadata } from "next";
import Link from "next/link";
import { cityById } from "@/lib/cities";
import { ANIMAL_EN, BRANCH_RO, ELEMENT_EN, enReading, MOOD_EN, STEM_RO } from "@/lib/en/saju";
import { BRANCH_EL } from "@/lib/myeongri";
import { computeProfile, type Gender } from "@/lib/profile";
import { BRANCHES, computePillars, resolveBirthTime, STEMS, type BirthInput } from "@/lib/saju";

export const metadata: Metadata = { title: "Your four pillars" };

// The English free reading, from ?d=YYYY-MM-DD[&t=HH:MM&c=cityId][&g=f|m]: the chart, the Day Master and its
// strength, the lucky element, the classic scene, the five elements and powers as they are *to you*, this year,
// and (with sex at birth) the ten-year luck periods. Same engine and verdicts as the Korean site.
const HOUR_RANGE = ["11 PM–1 AM", "1–3 AM", "3–5 AM", "5–7 AM", "7–9 AM", "9–11 AM", "11 AM–1 PM", "1–3 PM", "3–5 PM", "5–7 PM", "7–9 PM", "9–11 PM"];
const clock = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;

function chartFor(d: string, t: string, c: string, g: string) {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  let input: BirthInput = { year: +m[1], month: +m[2], day: +m[3], calendar: "solar", hourBranch: null };
  let note: string | null = null;
  const tm = t.match(/^(\d{2}):(\d{2})$/);
  if (tm && c) {
    const city = cityById(c);
    const res = resolveBirthTime(input, { hour: +tm[1], minute: +tm[2] }, { lon: city.lon, tz: city.tz });
    input = res.input;
    const k = res.correction;
    note =
      `Born at ${clock(+tm[1], +tm[2])} in ${city.en}` +
      (k.summer ? " (daylight saving time)" : "") +
      `, which was ${clock(k.local.hour, k.local.minute)} by the sun there` +
      ` (${k.shift >= 0 ? "+" : "−"}${Math.abs(k.shift)} min). That falls in the ${ANIMAL_EN[k.hourBranch]} hour, ${HOUR_RANGE[k.hourBranch]} sun time.`;
  }
  try {
    const pillars = computePillars(input);
    const gender: Gender | null = g === "f" || g === "m" ? g : null;
    return { pillars, profile: computeProfile(input, gender), note };
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

function Sec({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <section className="doc-paper mt-3 px-5 py-5">
      <p className="text-xs font-extrabold tracking-[0.2em] text-seal">{tag}</p>
      {children}
    </section>
  );
}

const MOOD_STYLE: Record<string, string> = {
  활짝: "bg-seal text-hanji",
  기회: "bg-seal/75 text-hanji",
  무난: "bg-gold/25 text-ink",
  다지기: "bg-ink/10 text-ink",
  버티기: "bg-ink/25 text-ink",
};
const MOOD_WIDTH: Record<string, number> = { 활짝: 100, 기회: 80, 무난: 60, 다지기: 40, 버티기: 20 };

export default async function EnReadingPage({ searchParams }: PageProps<"/en/reading">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => String(Array.isArray(v) ? v[0] : (v ?? ""));
  const chart = chartFor(one(sp.d), one(sp.t), one(sp.c), one(sp.g));
  const r = chart && enReading(chart.pillars, chart.profile);
  if (!chart || !r)
    return (
      <section className="doc-paper mt-8 px-5 py-6 text-center">
        <p className="font-myeongjo text-lg font-extrabold">Hundo couldn&rsquo;t read that date</p>
        <p className="mt-2 text-[14px] text-ink-soft">Please check the date (1920–2025) and try again.</p>
        <Link href="/en" className="mt-4 inline-block rounded-full bg-seal px-5 py-2.5 font-bold text-hanji">Back</Link>
      </section>
    );
  const dmEl = ELEMENT_EN[r.dayMaster.element];
  const lucky = ELEMENT_EN[r.lucky.element];
  const max = Math.max(...r.elements.map((e) => e.count), 1);
  return (
    <>
      {/* The chart. */}
      <section className="doc-paper mt-6 px-5 py-5">
        <p className="text-center text-xs font-extrabold tracking-[0.3em] text-seal">YOUR FOUR PILLARS · 四柱</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {r.pillars.map((x) => (
            <div key={x.label}>
              <p className="mb-1 text-center text-[11px] font-bold text-ink-soft">{x.label}</p>
              <Cell stem={x.stem} branch={x.branch} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">
          Read right to left, the way Joseon scholars wrote: year, month, day, hour.
          {!r.hourKnown && " Without a birth time the hour pillar stays open; the other six characters are read in full."}
        </p>
        {chart.note && <p className="mt-2 rounded-lg bg-white/50 px-3 py-2 text-[12px] leading-relaxed text-ink-soft">⏱ {chart.note}</p>}
      </section>

      {/* Who you are, and how strong. */}
      <Sec tag="YOUR DAY MASTER · 日干">
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
        <div className="mt-4 rounded-xl border border-ink/10 bg-white/50 px-3 py-3">
          <p className="flex items-baseline justify-between">
            <b className="text-[15px]">{r.strength.label} Day Master</b>
            <span className="text-[12px] text-ink-soft tabular-nums">{r.strength.support}% of your chart backs you</span>
          </p>
          <span className="mt-2 block h-2.5 overflow-hidden rounded bg-hanji-deep">
            <span className="block h-full rounded" style={{ width: `${r.strength.support}%`, background: dmEl.color }} />
          </span>
          <p className="mt-2 text-[13.5px] leading-relaxed">{r.strength.line}</p>
        </div>
        <p className="mt-3 text-[11.5px] text-ink-soft">
          Your Day Master is the stem of the day you were born, the &ldquo;I&rdquo; of the chart: the closest thing saju has to a sun sign.
        </p>
      </Sec>

      {/* The classic scene. */}
      <Sec tag="YOUR CHART IN ONE PICTURE">
        <p className="mt-2 font-myeongjo text-[26px] font-extrabold">{r.scene.hanja}</p>
        <p className="font-myeongjo text-[17px] font-extrabold">{r.scene.en[0].toUpperCase() + r.scene.en.slice(1)}</p>
        <p className="mt-2 text-[14px] leading-[1.75]">{r.scene.line}</p>
        <p className="mt-2 text-[11.5px] text-ink-soft">Saju masters gave classic four-character names to charts like yours.</p>
      </Sec>

      {/* What lifts you. */}
      <section className="mt-3 rounded-2xl px-5 py-5 text-hanji" style={{ background: lucky.color }}>
        <p className="text-xs font-extrabold tracking-[0.2em] opacity-80">YOUR LUCKY ELEMENT · 用神</p>
        <p className="mt-1 font-myeongjo text-[30px] font-extrabold">
          {lucky.hanja} {lucky.name}
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed opacity-90">
          The element that balances your chart. Koreans call it <b>yongsin (용신)</b>, &ldquo;the useful god&rdquo;. {ELEMENT_EN[r.lucky.helper].name} helps it.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="opacity-75">Colours</dt>
          <dd>{r.lucky.colors}</dd>
          <dt className="opacity-75">Direction</dt>
          <dd>{r.lucky.direction}</dd>
          <dt className="opacity-75">Season</dt>
          <dd>{r.lucky.season}</dd>
          <dt className="opacity-75">Numbers</dt>
          <dd>{r.lucky.numbers}</dd>
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed">
          <b>Bring it in:</b> {r.lucky.use}.
        </p>
      </section>

      {/* The elements, as they are to you. */}
      <Sec tag="FIVE ELEMENTS · 五行">
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
          In saju each element means something different depending on your Day Master. Here is what they are to a {dmEl.name} person.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {r.elements.map((e) => (
            <div key={e.name}>
              <div className="grid grid-cols-[5.2em_1fr_1.5em] items-center gap-2 text-[13px]">
                <span>
                  <span className="font-myeongjo">{e.hanja}</span> {e.name}
                </span>
                <span className="h-3 overflow-hidden rounded bg-hanji-deep">
                  <span className="block h-full rounded" style={{ width: `${(e.count / max) * 100}%`, background: e.color }} />
                </span>
                <span className="text-right tabular-nums">{e.count}</span>
              </div>
              <p className="ml-[5.7em] text-[11.5px] text-ink-soft">
                <b className="text-ink">{e.powerName}</b>: {e.is}
              </p>
            </div>
          ))}
        </div>
        {r.missing.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2 text-[13.5px] leading-relaxed">
            {r.missing.map((x) => (
              <li key={x.el}>{x.line}</li>
            ))}
          </ul>
        )}
      </Sec>

      {/* The five powers. */}
      <Sec tag="YOUR FIVE POWERS · 十星">
        <div className="mt-3 flex flex-col gap-2">
          {[...r.powers].sort((a, b) => b.pct - a.pct).map((x) => (
            <div key={x.group} className="grid grid-cols-[6.5em_1fr_5.2em] items-center gap-2 text-[13px]">
              <span>
                <b>{x.name}</b>
                <span className="block text-[10.5px] text-ink-soft">{x.korean}</span>
              </span>
              <span className="h-3 overflow-hidden rounded bg-hanji-deep">
                <span className="block h-full rounded bg-seal/80" style={{ width: `${x.pct}%` }} />
              </span>
              <span className="text-right tabular-nums">
                {x.pct}%{x.rank && <span className="block text-[10.5px] font-bold text-seal">{x.rank}</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed">
          <b>Strongest, {r.strongest.name}:</b> {r.strongest.line}
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed">
          <b>Weakest, {r.weakest.name}:</b> {r.weakest.line}
        </p>
        <p className="mt-2 text-[11px] text-ink-soft">&ldquo;top 10%&rdquo; compares your share with charts across all birth dates.</p>
      </Sec>

      {/* This year. */}
      <Sec tag={`${r.year.year} · ${STEMS[r.year.stem]}${BRANCHES[r.year.branch]}`}>
        <p className="mt-1 font-myeongjo text-[20px] font-extrabold">
          The year of the {ELEMENT_EN[Math.floor(r.year.stem / 2)].name} {ANIMAL_EN[r.year.branch]}
        </p>
        <p className="mt-2 flex items-center gap-2">
          <span className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-bold ${MOOD_STYLE[r.year.mood]}`}>{MOOD_EN[r.year.mood].name}</span>
          <span className="text-[12.5px] text-ink-soft">{MOOD_EN[r.year.mood].line}</span>
        </p>
        <p className="mt-2 text-[14px] leading-[1.75]">{r.year.brings}</p>
      </Sec>

      {/* Ten-year luck. */}
      <Sec tag="TEN-YEAR LUCK · 大運">
        {r.flow ? (
          <>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
              Saju reads life in ten-year seasons called <b>daeun (대운)</b>. Each brings a new pair of characters into your chart.
            </p>
            <ol className="mt-3 flex flex-col gap-1.5">
              {r.flow.map((f) => (
                <li key={f.from} className={`rounded-lg px-2 py-2 ${f.now ? "bg-seal/10 ring-1 ring-seal/40" : ""}`}>
                  <div className="grid grid-cols-[5.6em_1fr_6.4em] items-center gap-2 text-[12.5px]">
                    <span className="tabular-nums">
                      <b>{f.from}–{String(f.to).slice(2)}</b>
                      {f.age && <span className="block text-[10.5px] text-ink-soft">{f.age}</span>}
                    </span>
                    <span className="h-2.5 overflow-hidden rounded bg-hanji-deep">
                      {!f.young && <span className="block h-full rounded bg-seal/80" style={{ width: `${MOOD_WIDTH[f.mood]}%` }} />}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-center text-[11px] font-bold ${f.young ? "bg-ink/5 text-ink-soft" : MOOD_STYLE[f.mood]}`}>
                      {f.young ? "Growing up" : MOOD_EN[f.mood].name}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-soft">
                    {f.now && <b className="mr-1 text-seal">Now ·</b>}
                    {f.theme}
                  </p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-2 text-[13.5px] leading-relaxed">
            Your ten-year seasons run forward or backward depending on your sex at birth, so we need it to draw them.{" "}
            <Link href="/en" className="font-bold text-seal underline">Add it on the form</Link>.
          </p>
        )}
      </Sec>

      <Sec tag="YOUR ZODIAC ANIMAL · 띠">
        <p className="mt-1 font-myeongjo text-[22px] font-extrabold">The {r.animal}</p>
        <p className="mt-1 text-[12.5px] text-ink-soft">From your year pillar. In saju it is only one of eight characters, not the whole story.</p>
      </Sec>

      <section className="mt-4 rounded-xl border border-ink/15 bg-white/50 px-5 py-4 text-center">
        <p className="font-myeongjo text-[17px] font-extrabold">Coming soon from Hundo</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">Your full life reading, love and compatibility, and each year ahead in detail.</p>
      </section>
      <Link href="/en" className="mt-4 block text-center text-[13px] font-bold text-seal underline">
        Read another chart
      </Link>
    </>
  );
}
