"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { searchCities, type City } from "@/lib/cities";

// Birth date, time (optional) and city. The city sets the time zone and the sun's time at the place of birth,
// so it matters only when the time is known.
// Date and time are our own dropdowns, not the browser's date and time pickers: those follow the phone's
// language (a Korean phone shows "오후"), and a month written as a word reads the same to a US reader
// (month first) and a UK one (day first).
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 2025 - 1920 + 1 }, (_, i) => 2025 - i);
const pad = (n: number) => String(n).padStart(2, "0");
const select = "rounded border border-ink/20 bg-white/70 px-2 py-2 font-normal disabled:opacity-40";
export default function EnBirthForm() {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [pm, setPm] = useState(false);
  const [sex, setSex] = useState<"" | "f" | "m">("");
  const [noTime, setNoTime] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [error, setError] = useState("");
  const options = useMemo(() => (city && query === city.en ? [] : searchCities(query, 6)), [query, city]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!month || !day || !year) return setError("Please choose your month, day and year of birth.");
    const m = Number(month), d = Number(day), y = Number(year);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCMonth() !== m - 1) return setError(`${MONTHS[m - 1]} ${y} doesn't have a day ${d}.`);
    if (!noTime && (!hour || minute === "")) return setError("Choose your birth time, or tick “I don’t know my birth time”.");
    // A city typed out in full ("Busan") counts without tapping the suggestion.
    const typed = searchCities(query, 1)[0];
    const place = city ?? (typed && typed.en.toLowerCase() === query.trim().toLowerCase() ? typed : null);
    if (!noTime && !place) return setError("Pick the city you were born in from the list (or the nearest big city).");
    const date = `${y}-${pad(m)}-${pad(d)}`;
    const time = noTime ? "" : `${pad((Number(hour) % 12) + (pm ? 12 : 0))}:${pad(Number(minute))}`;
    const q = new URLSearchParams({ d: date });
    if (sex) q.set("g", sex);
    if (!noTime) {
      q.set("t", time);
      q.set("c", place!.id);
    }
    router.push(`/en/reading?${q}`);
  }

  return (
    <form onSubmit={submit} className="doc-paper flex flex-col gap-3 px-5 py-5">
      <fieldset className="flex flex-col gap-1 text-[13px] font-bold">
        <legend className="mb-1">Date of birth</legend>
        <div className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-2">
          <select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className={select}>
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <select aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} className={select}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} className={select}>
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-1 text-[13px] font-bold" disabled={noTime}>
        <legend className="mb-1">Time of birth</legend>
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <select aria-label="Hour" value={hour} onChange={(e) => setHour(e.target.value)} className={select}>
            <option value="">Hour</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Minute" value={minute} onChange={(e) => setMinute(e.target.value)} className={select}>
            <option value="">Min</option>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{pad(i)}</option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded border border-ink/20" role="group" aria-label="AM or PM">
            {(["AM", "PM"] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setPm(x === "PM")}
                className={`flex-1 py-2 font-bold disabled:opacity-40 ${pm === (x === "PM") ? "bg-ink text-hanji" : "bg-white/70 text-ink-soft"}`}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] font-normal text-ink-soft">12 AM is midnight, 12 PM is noon.</span>
      </fieldset>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} /> I don&rsquo;t know my birth time
      </label>
      {!noTime && (
        <div className="relative flex flex-col gap-1 text-[13px] font-bold">
          <label htmlFor="en-city">City of birth</label>
          <input
            id="en-city"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCity(null);
            }}
            placeholder="e.g. New York, London, Tokyo"
            autoComplete="off"
            className="rounded border border-ink/20 bg-white/70 px-3 py-2 font-normal"
          />
          {options.length > 0 && (
            <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded border border-ink/15 bg-hanji shadow">
              {options.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setQuery(c.en);
                    }}
                    className="w-full px-3 py-2 text-left font-normal hover:bg-seal/10"
                  >
                    {c.en} <span className="text-[11px] text-ink-soft">{c.tz.replace(/_/g, " ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <span className="text-[11px] font-normal text-ink-soft">Used to correct your birth time to the sun&rsquo;s time where you were born.</span>
        </div>
      )}
      <fieldset className="flex flex-col gap-1 text-[13px] font-bold">
        <legend className="mb-1">
          Sex at birth <span className="font-normal text-ink-soft">(optional)</span>
        </legend>
        <div className="flex overflow-hidden rounded border border-ink/20" role="group" aria-label="Sex at birth">
          {([["f", "Female"], ["m", "Male"], ["", "Skip"]] as const).map(([v, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setSex(v)}
              className={`flex-1 py-2 font-bold ${sex === v ? "bg-ink text-hanji" : "bg-white/70 text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-normal text-ink-soft">Only used to set the direction of your ten-year luck cycles, as tradition does.</span>
      </fieldset>
      {error && <p className="text-[13px] font-bold text-seal">{error}</p>}
      <button type="submit" className="mt-1 rounded-full bg-seal px-5 py-3 font-bold text-hanji">
        Read my four pillars · free
      </button>
    </form>
  );
}
