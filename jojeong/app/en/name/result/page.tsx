import type { Metadata } from "next";
import Link from "next/link";
import { cityById } from "@/lib/cities";
import { computePillars, resolveBirthTime, type BirthInput } from "@/lib/saju";
import { ELEMENTS, suggestNames, type Kind, type NamePick, type Prefs } from "@/lib/naming/engine";
import { SURNAMES, type Feel } from "@/lib/naming/names";

export const metadata: Metadata = { title: "Your Korean name" };

// The free result: one name, whole (Hangul, Hanja, meanings, why it is yours, how it sounds to Koreans).
// The answers come in the address (components/en/NameForm.tsx); nothing is stored.

const STRENGTH: Record<string, string> = {
  극신강: "very strong in its own element",
  신강: "strong in its own element",
  신약: "gentle, with little of its own element",
  극신약: "very gentle, with almost none of its own element",
};
const ELEMENT_NOTE = ["growth and kindness", "warmth and expression", "steadiness and trust", "clarity and resolve", "wisdom and flow"];
const ERA: Record<NamePick["era"], string> = {
  new: "Modern: a name you hear among Koreans born after 2000.",
  mid: "Feels like a Korean born in the 1980s or 90s.",
  old: "Classic: feels like a Korean born in the 1960s or 70s.",
};
const FEEL: Record<Feel, string> = { m: "Masculine to a Korean ear.", f: "Feminine to a Korean ear.", n: "Works for anyone." };

function Problem({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-16 text-center">
      <p className="text-[15px]">{text}</p>
      <Link href="/en/name#start" className="rounded-full bg-seal px-5 py-3 font-myeongjo font-extrabold text-hanji">
        Back to the form
      </Link>
    </div>
  );
}

export default async function NameResult({ searchParams }: PageProps<"/en/name/result">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const first = one("f").slice(0, 40) || "Friend";
  const last = one("l").slice(0, 40);
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(one("d"));
  const time = /^(\d{2}):(\d{2})$/.exec(one("t"));
  const feel = (["m", "f", "n"].includes(one("g")) ? one("g") : "n") as Feel;
  const kind = (one("k") === "pure" ? "pure" : "hanja") as Kind;
  const prefs: Prefs = { sound: one("sn") !== "0", era: one("ea") === "young" ? "young" : one("ea") === "any" ? "any" : "age" };
  if (!date) return <Problem text="That birth date didn't come through." />;

  const base: BirthInput = { year: +date[1], month: +date[2], day: +date[3], calendar: "solar", hourBranch: null };
  let input = base;
  let place = "";
  try {
    if (time && one("c")) {
      const city = cityById(one("c"));
      place = city.en;
      input = resolveBirthTime(base, { hour: +time[1], minute: +time[2] }, { lon: city.lon, tz: city.tz }).input;
    }
  } catch {
    input = base;
  }
  let result: ReturnType<typeof suggestNames> = null;
  try {
    result = suggestNames({ first, last, birthYear: base.year, pillars: computePillars(input), feel, kind, surname: one("s") || undefined, prefs });
  } catch {
    result = null;
  }
  if (!result) return <Problem text="I couldn't read a chart for that date. Please check it and try again." />;
  const { surname, chart, picks, theirSound, targetEra, soundAlt } = result;
  const pick = picks[0];
  if (!pick) return <Problem text="No name fits every rule for this chart yet. Try the other kind of name." />;

  const here = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const other = new URLSearchParams(here);
  other.set("k", kind === "pure" ? "hanja" : "pure");
  const fullHangul = surname.ko + pick.ko;
  const fullHanja = pick.chars ? surname.hanja + pick.chars.map((c) => c.ch).join("") : null;
  const need = `${ELEMENTS[chart.yong]} (${ELEMENT_NOTE[chart.yong]})`;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <p className="text-center text-[13px] text-ink-soft">
        {first}, born {base.year}-{date[2]}-{date[3]}
        {time ? ` at ${time[1]}:${time[2]}${place ? `, ${place}` : ""}` : ", time unknown"}
      </p>

      <section className="doc-paper px-5 py-7 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-gold">YOUR KOREAN NAME</p>
        <p className="mt-3 font-myeongjo text-[52px] leading-none font-extrabold">{fullHangul}</p>
        {fullHanja && <p className="mt-3 font-myeongjo text-[28px] text-seal">{fullHanja}</p>}
        <p className="mt-2 text-[18px] font-bold">
          {surname.en} {pick.roman}
        </p>
        {pick.chars ? (
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            {pick.chars.map((c) => (
              <div key={c.ch} className="rounded-lg bg-white/70 px-3 py-3">
                <p className="font-myeongjo text-[26px] leading-none">
                  {c.ch} <span className="text-[15px] text-ink-soft">{c.ko}</span>
                </p>
                <p className="mt-1.5 text-[13.5px]">“{c.meaning}”</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">{c.el >= 0 ? `brings ${ELEMENTS[c.el]}` : "chosen for its sound and meaning"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[15px]">
            <b>{pick.ko}</b> means “{pick.pure!.en}”. A pure Korean word, with no Hanja.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-myeongjo text-[18px] font-extrabold">Why this name is yours</h2>
        <p className="text-[14.5px] leading-relaxed">
          Your chart is {STRENGTH[chart.strength] ?? "balanced"}. What brings it into balance is <b>{need}</b>, fed by{" "}
          <b>{ELEMENTS[chart.hee]}</b>.{" "}
          {pick.chars
            ? `So ${pick.chars.filter((c) => c.el >= 0).map((c) => `${c.ch} brings ${ELEMENTS[c.el]}`).join(" and ")}.`
            : `“${pick.pure!.en}” belongs to ${ELEMENTS[pick.pure!.el]}.`}
        </p>
        <ul className="mt-1 flex flex-wrap gap-1.5 text-[12px]">
          {pick.soundFlow && <li className="rounded-full bg-jade/10 px-2.5 py-1 text-jade">✓ The sounds flow into each other</li>}
          {pick.suri?.allLucky && <li className="rounded-full bg-jade/10 px-2.5 py-1 text-jade">✓ All four stroke numbers are lucky</li>}
          {pick.suri && !pick.suri.allLucky && <li className="rounded-full bg-jade/10 px-2.5 py-1 text-jade">✓ Lucky stroke numbers</li>}
          {pick.soundsLike && <li className="rounded-full bg-jade/10 px-2.5 py-1 text-jade">✓ Close to the sound of {first}</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-myeongjo text-[18px] font-extrabold">How it sounds to Koreans</h2>
        <ul className="flex flex-col gap-1 text-[14.5px] leading-relaxed">
          {prefs.sound && (
            <li>
              {pick.soundsLike ? "✓ " : "· "}
              <b>{pick.soundsLike ? `Sounds like ${first}.` : `Not far from ${first}.`}</b> {first} in Korean letters is {theirSound}; your name is {pick.ko}.
              {!pick.soundsLike && " No name close enough also fit your chart, so the chart came first."}
            </li>
          )}
          {targetEra && pick.era === targetEra && (
            <li>
              ✓ <b>{prefs.era === "age" ? "Fits your generation." : "Young and current."}</b>{" "}
              {prefs.era === "age" ? `Koreans born around ${base.year} often have names like this.` : "A name heard among Koreans born after 2000."}
            </li>
          )}
          {prefs.era === "young" && base.year < 1990 && (
            <li>· Koreans may hear this as a much younger person&apos;s name. That can be part of the charm.</li>
          )}
          {!(targetEra && pick.era === targetEra) && <li>· {ERA[pick.era]}</li>}
          <li>· {FEEL[pick.feel]}</li>
          <li>· {pick.hard ? "One sound takes a little practice for English speakers." : "Easy to say in English."}</li>
        </ul>
      </section>

      {soundAlt && (
        <section className="rounded-2xl border border-ink/15 bg-white/60 px-5 py-4">
          <p className="text-[11px] font-bold tracking-[0.15em] text-gold">CLOSEST TO {first.toUpperCase()}</p>
          <p className="mt-2 font-myeongjo text-[30px] leading-none font-extrabold">
            {surname.ko}
            {soundAlt.ko}{" "}
            {soundAlt.chars && <span className="text-[20px] font-normal text-seal">{surname.hanja + soundAlt.chars.map((c) => c.ch).join("")}</span>}
          </p>
          <p className="mt-1 text-[15px] font-bold">
            {surname.en} {soundAlt.roman}
          </p>
          {soundAlt.chars && <p className="mt-1 text-[13px] text-ink-soft">{soundAlt.chars.map((c) => `${c.ch} “${c.meaning}”`).join(" · ")}</p>}
          <p className="mt-2 text-[13.5px] leading-relaxed">
            The name that sounds most like {first} ({theirSound}).{" "}
            {soundAlt.chars ? "Its characters carry less of what your chart needs, so it comes second." : "Written in Hangul only, as many Korean names are: no Hanja for it carries what your chart needs."}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-myeongjo text-[18px] font-extrabold">Your family name</h2>
        <p className="text-[14px] leading-relaxed">
          {surname.ko} ({surname.hanja}, {surname.en}){last ? `, chosen for its sound, close to ${last}` : ""}. Korean family
          names are few and old; pick another if you like.
        </p>
        <form action="/en/name/result" className="flex gap-2">
          {[...here.entries()].filter(([k]) => k !== "s").map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <select name="s" defaultValue={surname.ko} aria-label="Family name" className="flex-1 rounded-lg border border-ink/20 bg-white/80 px-3 py-2 text-[14px]">
            {SURNAMES.map((s) => (
              <option key={s.ko} value={s.ko}>
                {s.ko} {s.hanja} · {s.en}
              </option>
            ))}
          </select>
          <button className="rounded-lg border border-ink/20 bg-white/70 px-4 text-[14px] font-bold">Change</button>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-seal/30 bg-white/60 px-5 py-5">
        <p className="text-[11px] font-bold tracking-[0.15em] text-seal">THE FULL NAME REPORT</p>
        <h2 className="mt-1 font-myeongjo text-[19px] font-extrabold">Three names, written by brush</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[14px] leading-relaxed">
          <li>· {picks.length > 1 ? `${picks.length - 1} more names chosen for your chart, each explained` : "More names chosen for your chart, each explained"}</li>
          <li>· Your name in brush calligraphy, ready to print or share</li>
          <li>· Your own name seal (도장), the way Koreans sign</li>
          <li>· How to write it, stroke by stroke</li>
          <li>· Your birth chart on one page</li>
        </ul>
        <button disabled className="mt-4 w-full rounded-full bg-seal/60 py-3.5 font-myeongjo text-[16px] font-extrabold text-hanji">
          Opening soon · $3.99
        </button>
      </section>

      <div className="flex flex-col items-center gap-2 text-[14px]">
        <Link href={`/en/name/result?${other}`} className="font-bold text-seal underline underline-offset-2">
          {kind === "pure" ? "See a name with Hanja instead" : "See a pure Korean name instead"}
        </Link>
        <Link href="/en/name#start" className="text-ink-soft underline underline-offset-2">
          Start again
        </Link>
      </div>
    </div>
  );
}
