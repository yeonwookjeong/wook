"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { searchCities, type City } from "@/lib/cities";

// Birth date, time (optional) and city. The city sets the time zone and the sun's time at the place of birth,
// so it matters only when the time is known.
export default function EnBirthForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [error, setError] = useState("");
  const options = useMemo(() => (city && query === city.en ? [] : searchCities(query, 6)), [query, city]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Please enter your date of birth.");
    const year = Number(date.slice(0, 4));
    if (year < 1920 || year > 2025) return setError("Please enter a birth year between 1920 and 2025.");
    if (!noTime && !time) return setError("Enter your birth time, or tick “I don’t know my birth time”.");
    if (!noTime && !city) return setError("Pick the city you were born in (or the nearest big city).");
    const q = new URLSearchParams({ d: date });
    if (!noTime) {
      q.set("t", time);
      q.set("c", city!.id);
    }
    router.push(`/en/reading?${q}`);
  }

  return (
    <form onSubmit={submit} className="doc-paper flex flex-col gap-3 px-5 py-5">
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        Date of birth
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min="1920-01-01" max="2025-12-31" className="rounded border border-ink/20 bg-white/70 px-3 py-2 font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        Time of birth
        <input type="time" value={time} disabled={noTime} onChange={(e) => setTime(e.target.value)} className="rounded border border-ink/20 bg-white/70 px-3 py-2 font-normal disabled:opacity-40" />
      </label>
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
      {error && <p className="text-[13px] font-bold text-seal">{error}</p>}
      <button type="submit" className="mt-1 rounded-full bg-seal px-5 py-3 font-bold text-hanji">
        Read my four pillars · free
      </button>
    </form>
  );
}
