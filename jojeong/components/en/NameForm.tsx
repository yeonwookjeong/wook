"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { searchCities, type City } from "@/lib/cities";

// The naming form: name, birth date, birth time (optional) with the city of birth, and the feel of the name.
// Date and time are our own dropdowns, not the browser's pickers: those follow the phone's language (a Korean
// phone shows "오후"), and a month written as a word reads the same to a US reader and a UK one.
// Nothing is stored: the answers go to the result page in its address, and the chart is worked out there.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1920 + 1 }, (_, i) => THIS_YEAR - i);
const pad = (n: number) => String(n).padStart(2, "0");
const field = "w-full rounded-lg border border-ink/20 bg-white/80 px-3 py-2.5 text-[15px] font-normal disabled:opacity-40";
const label = "mb-1.5 block text-[13px] font-bold";

function Choice<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-lg border px-2 py-2 text-[13.5px] ${value === v ? "border-seal bg-seal text-hanji" : "border-ink/20 bg-white/70"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function NameForm() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [pm, setPm] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [feel, setFeel] = useState<"f" | "m" | "n">("n");
  const [kind, setKind] = useState<"hanja" | "pure">("hanja");
  // What matters beyond the chart, any combination. "My generation" and "young" pull opposite ways, so one
  // unticks the other; neither ticked means no generation in particular.
  const [sound, setSound] = useState(true);
  const [era, setEra] = useState<"age" | "young" | "any">("age");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => (city && query === city.en ? [] : searchCities(query, 6)), [query, city]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim()) return setError("Please write your first name.");
    if (!month || !day || !year) return setError("Please choose your month, day and year of birth.");
    const m = Number(month), d = Number(day), y = Number(year);
    if (new Date(Date.UTC(y, m - 1, d)).getUTCMonth() !== m - 1) return setError(`${MONTHS[m - 1]} ${y} doesn't have a day ${d}.`);
    if (!noTime && (!hour || minute === "")) return setError("Choose your birth time, or tick “I don’t know my birth time”.");
    // A city typed out in full ("London") counts without tapping the suggestion.
    const typed = searchCities(query, 1)[0];
    const place = city ?? (typed && typed.en.toLowerCase() === query.trim().toLowerCase() ? typed : null);
    if (!noTime && !place) return setError("Pick the city you were born in from the list (or the nearest big city).");
    const q = new URLSearchParams({ f: first.trim().slice(0, 40), d: `${y}-${pad(m)}-${pad(d)}`, g: feel, k: kind, sn: sound ? "1" : "0", ea: era });
    if (last.trim()) q.set("l", last.trim().slice(0, 40));
    if (!noTime) {
      q.set("t", `${pad((Number(hour) % 12) + (pm ? 12 : 0))}:${pad(Number(minute))}`);
      q.set("c", place!.id);
    }
    setBusy(true);
    router.push(`/en/name/result?${q}`);
  }

  return (
    <form onSubmit={submit} className="doc-paper flex flex-col gap-5 px-5 py-6">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="first" className={label}>First name</label>
          <input id="first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" className={field} placeholder="Emily" />
        </div>
        <div>
          <label htmlFor="last" className={label}>Last name</label>
          <input id="last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" className={field} placeholder="Johnson" />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Date of birth</legend>
        <div className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-2">
          <select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className={field}>
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <select aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} className={field}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} className={field}>
            <option value="">Year</option>
            {YEARS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset disabled={noTime}>
        <legend className={label}>Time of birth</legend>
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <select aria-label="Hour" value={hour} onChange={(e) => setHour(e.target.value)} className={field}>
            <option value="">Hour</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Minute" value={minute} onChange={(e) => setMinute(e.target.value)} className={field}>
            <option value="">Min</option>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{pad(i)}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-ink/20 text-[13px]">
            {(["AM", "PM"] as const).map((x) => (
              <button key={x} type="button" onClick={() => setPm(x === "PM")} className={(x === "PM") === pm ? "bg-ink text-hanji" : "bg-white/70"}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-2">
          <input
            aria-label="City of birth"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCity(null);
            }}
            className={field}
            placeholder="City of birth (e.g. New York)"
            autoComplete="off"
          />
          {query && options.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-ink/15 bg-white shadow-md">
              {options.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setQuery(c.en);
                    }}
                    className="block w-full px-3 py-2 text-left text-[14px] hover:bg-hanji"
                  >
                    {c.en}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-1.5 text-[12px] font-normal text-ink-soft">The place and the local clock time where you were born, even if you live somewhere else now.</p>
      </fieldset>
      <label className="-mt-3 flex items-center gap-2 text-[13.5px]">
        <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} className="size-4 accent-seal" />
        I don’t know my birth time
      </label>

      <div>
        <p className={label}>The name should feel</p>
        <Choice value={feel} onChange={setFeel} options={[["f", "Feminine"], ["m", "Masculine"], ["n", "Either"]]} />
      </div>
      <div>
        <p className={label}>Kind of name</p>
        <Choice value={kind} onChange={setKind} options={[["hanja", "With Hanja 漢字"], ["pure", "Pure Korean"]]} />
        <p className="mt-1.5 text-[12px] text-ink-soft">
          {kind === "hanja"
            ? "Most Korean names: each syllable is a Chinese character (Hanja) with its own meaning, chosen to balance your chart."
            : "Native Korean words with no Hanja, like Haneul (sky). The word itself is the meaning."}
        </p>
      </div>

      <fieldset>
        <legend className={label}>What matters to you? (choose any)</legend>
        <div className="flex flex-col gap-2 text-[14px]">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-seal" />
            <span>
              <b>Sounds like my name</b>
              <span className="block text-[12px] text-ink-soft">A Korean name close to the sound of yours. Sarah → Se-ra, Noah → No-a.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={era === "age"} onChange={(e) => setEra(e.target.checked ? "age" : "any")} className="mt-0.5 size-4 shrink-0 accent-seal" />
            <span>
              <b>Fits my generation</b>
              <span className="block text-[12px] text-ink-soft">Korean names have generations. Yours will sound like someone your age, using your birth year.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={era === "young"} onChange={(e) => setEra(e.target.checked ? "young" : "any")} className="mt-0.5 size-4 shrink-0 accent-seal" />
            <span>
              <b>Young &amp; trendy</b>
              <span className="block text-[12px] text-ink-soft">A name popular among Koreans born after 2000, whatever your age.</span>
            </span>
          </label>
          <p className="text-[12px] text-ink-soft">Always: each character is chosen for the balance of your birth chart.</p>
        </div>
      </fieldset>

      {error && <p className="text-[13.5px] font-bold text-seal">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-seal px-5 py-3.5 font-myeongjo text-[17px] font-extrabold text-hanji disabled:opacity-60">
        {busy ? "Reading your chart…" : "Find my Korean name"}
      </button>
      <p className="-mt-2 text-center text-[11.5px] text-ink-soft">Free. Nothing is saved.</p>
    </form>
  );
}
