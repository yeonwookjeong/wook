import { EL_STYLE } from "@/components/SajuChart";
import { chartOf, BRANCH_EL, stemEl } from "@/lib/myeongri";
import { BRANCHES, STEMS, type Pillars } from "@/lib/saju";
import { ANIMALS_EN, STEMS_EN } from "@/lib/en/chart";
import { ELEMENT_EN, MOOD_EN, perHundredEn, type EnFree } from "@/lib/en/free";

// The Korean free screen (components/ChartIntro.tsx + components/FreeReading.tsx) in English, block for block and in
// the same order, each block opening with one plain line on what it is. Numbers and verdicts come from lib/en/free.ts,
// which computes them exactly as the Korean screen does.

const BRANCHES_EN = ["Ja", "Chuk", "In", "Myo", "Jin", "Sa", "O", "Mi", "Sin", "Yu", "Sul", "Hae"];
const POS_EN: Record<string, { name: string; role: string }> = {
  시: { name: "Hour", role: "children, later life" },
  일: { name: "Day", role: "you, your partner" },
  월: { name: "Month", role: "parents, work" },
  연: { name: "Year", role: "roots, childhood" },
};
const POWER_COLOR: Record<string, string> = { 인성: "#b3261e", 비겁: "#a87a22", 관성: "#222d3b", 재성: "#6b7f5a", 식상: "#8a6e9e" };
const MOOD_STYLE = {
  활짝: { cls: "bg-seal text-hanji", bar: "#b3261e", w: 100 },
  기회: { cls: "bg-seal/80 text-hanji", bar: "#c9645a", w: 80 },
  무난: { cls: "bg-gold/25 text-ink", bar: "#c9a13b", w: 60 },
  다지기: { cls: "bg-ink/10 text-ink", bar: "#8b95a1", w: 40 },
  버티기: { cls: "bg-ink/20 text-ink", bar: "#4d5966", w: 20 },
} as const;

function Card({ hanja, title, intro, children }: { hanja: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="doc-paper px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{hanja}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">{title}</h2>
      {intro && <p className="mx-auto mt-1.5 max-w-[34ch] text-center text-[12.5px] leading-relaxed text-ink-soft">{intro}</p>}
      {children}
    </section>
  );
}

function Cell({ hanja, roman, el }: { hanja: string | null; roman: string; el: number | null }) {
  if (hanja === null || el === null) return <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-ink/20 text-[11px] text-ink-soft">unknown</div>;
  return (
    <div className={`flex aspect-square flex-col items-center justify-center rounded-lg ${EL_STYLE[el]}`}>
      <span className="font-myeongjo text-xl leading-none font-extrabold">{hanja}</span>
      <span className="mt-0.5 text-[10.5px] leading-none opacity-85">
        {roman}, {ELEMENT_EN[el]}
      </span>
    </div>
  );
}

function Donut({ powers }: { powers: EnFree["powers"] }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const shown = powers.filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct);
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((a, x) => a + x.pct, 0));
  const top = shown[0];
  return (
    <svg viewBox="0 0 180 180" className="mx-auto mt-3 block size-44" role="img" aria-label={shown.map((x) => `${x.name} ${x.pct}%`).join(", ")}>
      {shown.map((x, i) => (
        <circle
          key={x.group}
          r={R}
          cx="90"
          cy="90"
          fill="none"
          stroke={POWER_COLOR[x.group]}
          strokeWidth="28"
          strokeDasharray={`${Math.max(0, (C * x.pct) / 100 - (shown.length > 1 ? 1.5 : 0))} ${C}`}
          strokeDashoffset={(-C * starts[i]) / 100}
          transform="rotate(-90 90 90)"
        />
      ))}
      <text x="90" y="80" textAnchor="middle" fontSize="11" fill="#62564c">
        Strongest
      </text>
      <text x="90" y="97" textAnchor="middle" fontSize="12" fontWeight="800" fill="#211b17">
        {top.name}
      </text>
      <text x="90" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={POWER_COLOR[top.group]}>
        {top.pct}%
      </text>
    </svg>
  );
}

// `name`: the reader's first name. `locked`: the full reading is not theirs yet, so as on the Korean screen the
// second finding and the decades' words (all but the present one) are kept for it.
export default function FreeEn({ name, pillars, r, locked = true }: { name: string; pillars: Pillars; r: EnFree; locked?: boolean }) {
  const slots = chartOf(pillars);
  const dayStem = pillars.dayStem;
  return (
    <div className="flex flex-col gap-4">
      <Card hanja="讀 法" title={`How we read ${name}'s chart`} intro="Your birth year, month, day and hour, each written as two characters: a heavenly one on top, an earthly one below. Eight in all.">
        <div className="mt-4 grid grid-cols-4 items-end gap-x-1.5 gap-y-1 text-center">
          {slots.map((s) => (
            <span key={`p${s.pos}`} className="text-[11px] font-bold">
              {POS_EN[s.pos].name}
            </span>
          ))}
          {slots.map((s) => (
            <span key={`r${s.pos}`} className="self-start text-[10.5px] leading-tight text-ink-soft">
              {POS_EN[s.pos].role}
            </span>
          ))}
          {slots.map((s) => (
            <Cell key={`s${s.pos}`} hanja={s.stem === null ? null : STEMS[s.stem]} roman={s.stem === null ? "" : STEMS_EN[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
          ))}
          {slots.map((s) => (
            <span key={`m${s.pos}`} className="text-[11px] font-bold text-seal">
              {s.pos === "일" ? "YOU" : " "}
            </span>
          ))}
          {slots.map((s) => (
            <Cell key={`b${s.pos}`} hanja={s.branch === null ? null : BRANCHES[s.branch]} roman={s.branch === null ? "" : BRANCHES_EN[s.branch]} el={s.branch === null ? null : BRANCH_EL[s.branch]} />
          ))}
          {slots.map((s) => (
            <span key={`a${s.pos}`} className="text-[10.5px] text-ink-soft">
              {s.branch === null ? " " : ANIMALS_EN[s.branch]}
            </span>
          ))}
        </div>
        <p className="mt-3 rounded-xl bg-seal/5 px-3 py-2 text-[13px] leading-relaxed">
          The top character of the day, <b>{STEMS[dayStem]} {STEMS_EN[dayStem]}</b>, is <b>you</b>: your Day Master, born as {ELEMENT_EN[stemEl(dayStem)]}. Every other character is read by how it treats this one.
        </p>

        {r.ilju && (
          <>
            <h3 className="mt-5 text-sm font-extrabold">Same day pillar, not the same person</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed">
              Your day pillar, {STEMS_EN[dayStem]} {BRANCHES_EN[pillars.dayBranch]} ({STEMS[dayStem]}
              {BRANCHES[pillars.dayBranch]}), is one of 60. But the season you were born in, the frame your birth month sets, and which energy weighs most make very different people. You are <b>{r.ilju.build}</b>: only <b>about {r.ilju.rate}%</b> of people with your day pillar share this build.
            </p>
          </>
        )}

        {(r.patterns.length > 0 || r.extremes.length > 0) && (
          <>
            <h3 className="mt-5 text-sm font-extrabold">What is rare in your chart</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {r.patterns.map((x) => (
                <li key={x.id} className="flex items-start justify-between gap-3 border-b border-seal/10 pb-1.5 text-[14px] last:border-b-0">
                  <b className="min-w-0">{x.plain}</b>
                  <span className="shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{perHundredEn(x.rate)}</span>
                </li>
              ))}
            </ul>
            {r.extremes.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {r.extremes.map((x) => (
                  <span key={x.label} className="rounded-full border border-seal/30 px-2.5 py-0.5 text-[11px] font-bold text-seal">
                    {x.label} {x.pct}%, {x.side === "high" ? "top" : "bottom"} {x.rank}%
                  </span>
                ))}
              </p>
            )}
            {r.sowhat.length > 0 && (
              <div className="mt-4 rounded-2xl border-l-[3px] border-seal bg-seal/5 px-4 py-3">
                <p className="text-xs font-extrabold text-seal">So, {name}</p>
                {r.sowhat.map((x, i) =>
                  locked && i > 0 ? (
                    <p key={x.id} className="mt-1.5 text-[13px] text-ink-soft italic">
                      One more finding is waiting in your full Life Reading.
                    </p>
                  ) : (
                    <p key={x.id} className="mt-1.5 text-[15px] leading-relaxed">
                      {x.meaning}
                    </p>
                  ),
                )}
              </div>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">&ldquo;In 100&rdquo; compares your chart with all 258,600 charts born 1950 to 2008, counted one by one.</p>
          </>
        )}
      </Card>

      <Card hanja="性 向" title={`${name}'s personality map`} intro="Leave yourself out, and the other seven characters fall into five roles around you. This is how big each role is in your chart.">
        <Donut powers={r.powers} />
        <ul className="mt-4 flex flex-col gap-2">
          {[...r.powers]
            .sort((a, b) => b.pct - a.pct)
            .map((x) => (
              <li key={x.group} className={`text-[13px] ${x.pct ? "" : "text-ink-soft"}`}>
                <span className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-[3px]" style={x.pct ? { background: POWER_COLOR[x.group] } : { border: `1.5px dashed ${POWER_COLOR[x.group]}` }} />
                  <span className={x.pct ? "font-bold" : ""}>{x.name}</span>
                  <span className={`ml-auto tabular-nums ${x.pct ? "font-extrabold" : ""}`}>{x.pct ? `${x.pct}%` : "none"}</span>
                  <span className="w-20 shrink-0 text-right text-[11px] font-bold text-seal">{x.rank ?? ""}</span>
                </span>
                <span className="block pl-5 text-[11px] text-ink-soft">{x.what}</span>
              </li>
            ))}
        </ul>
        <div className="mt-4 grid gap-2 text-[14px] leading-relaxed">
          <p className="rounded-xl bg-seal/5 px-3 py-2">
            <b className="text-seal">Strongest: {r.strong.name}</b>
            <br />
            {r.strong.line}
          </p>
          <p className="rounded-xl bg-ink/5 px-3 py-2">
            <b>Weakest: {r.weak.name}</b>
            <br />
            {r.weak.line}
          </p>
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">Top and bottom are against every other chart.</p>
      </Card>

      <Card hanja="神 殺" title={`The stars in ${name}'s chart`} intro="Saju names special combinations of characters, a little like aspects in Western astrology. These are the ones your chart holds, and how common each is.">
        {r.sals.length ? (
          <ul className="mt-3 flex flex-col divide-y divide-seal/10">
            {r.sals.map((s) => (
              <li key={s.name} className="py-2.5">
                <p className="flex items-baseline gap-2">
                  <b className="font-myeongjo">{s.plain}</b>
                  <span className="text-[11px] text-ink-soft">{s.name}</span>
                  {s.rate !== null && <span className="ml-auto shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{perHundredEn(s.rate)}</span>}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink/85">{s.line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-center text-[14px] leading-relaxed">No special stars stand out: a clean, simple chart. That means fewer swings, and what you build yourself lasts.</p>
        )}
      </Card>

      {r.domains.length > 0 && (
        <Card hanja="三 事" title="Money, love, work: one line each" intro="One verdict for each, worked out from the same eight characters.">
          <ul className="mt-3 flex flex-col gap-2">
            {r.domains.map((x) => (
              <li key={x.domain} className="flex items-start gap-3 rounded-2xl border border-seal/20 bg-white/50 px-4 py-3">
                <span className="w-14 shrink-0 font-myeongjo text-[15px] font-extrabold text-seal">{x.topic}</span>
                <span className="min-w-0 flex-1">
                  <b className="block font-myeongjo">{x.type}</b>
                  <span className="block text-[12.5px] leading-snug text-ink-soft">{x.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card hanja="運 路" title={`${name}'s life in ten-year seasons`} intro="Every ten years a new pair of characters arrives and changes the weather of your life. The longer the bar, the more it lifts you.">
        {r.flow ? (
          <>
            <ol className="mt-4 flex flex-col gap-1.5">
              {r.flow.map((f) => (
                <li key={f.from} className={`rounded-xl px-3 py-2 ${f.now ? "border-2 border-seal bg-seal/5" : "border border-transparent"} ${f.past ? "opacity-75" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="w-[4.4rem] shrink-0 text-[12px] leading-tight">
                      <b className="block">{f.age ? `Age ${f.age}` : `${f.from}`}</b>
                      <span className="text-[11px] text-ink-soft">
                        {f.from}–{f.to}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        {f.young ? (
                          <span className="w-[5.6rem] shrink-0 rounded-md bg-ink/5 py-0.5 text-center text-[11px] font-bold text-ink-soft">Growing up</span>
                        ) : (
                          <span className={`w-[5.6rem] shrink-0 rounded-md py-0.5 text-center text-[11px] font-bold ${MOOD_STYLE[f.mood].cls}`}>{MOOD_EN[f.mood].mark}</span>
                        )}
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5" aria-hidden="true">
                          <span className="block h-full rounded-full" style={{ width: f.young ? "0%" : `${MOOD_STYLE[f.mood].w}%`, background: MOOD_STYLE[f.mood].bar }} />
                        </span>
                        {f.now && <span className="shrink-0 text-[11px] font-extrabold text-seal">NOW</span>}
                      </span>
                      {(!locked || f.now) && f.line && <span className="mt-1 block text-[13px] leading-snug">{f.line}</span>}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            <dl className="mt-3 grid gap-1 text-[11px] leading-relaxed text-ink-soft">
              {(Object.keys(MOOD_EN) as (keyof typeof MOOD_EN)[]).map((m) => (
                <div key={m} className="flex gap-2">
                  <dt className="w-24 shrink-0 font-bold text-ink">{MOOD_EN[m].mark}</dt>
                  <dd>{MOOD_EN[m].means}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">A season turns around your birthday, not on 1 January, so the year either side of a change feels like a mix of both.</p>
            {locked && <p className="mt-2 text-[12.5px] font-bold text-seal">What each decade brings, and when, is in your full Life Reading.</p>}
          </>
        ) : (
          <p className="mt-3 text-center text-[14px] leading-relaxed">Add your gender and we can draw your ten-year seasons (it sets which way they turn).</p>
        )}
      </Card>
    </div>
  );
}
