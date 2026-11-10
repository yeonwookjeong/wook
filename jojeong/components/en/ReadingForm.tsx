"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { searchCities, type City } from "@/lib/cities";
import { makeReading, type EnPersonInput } from "@/app/en/reading/actions";

// The birth form of the English readings: one person (Life, Year) or two (Love). Our own dropdowns, as in the
// name form, so a Korean phone does not turn the time into "오후". The chart is worked out on the server once
// and only the person token (no birth date) goes into the address.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1920 + 1 }, (_, i) => THIS_YEAR - i);
const pad = (n: number) => String(n).padStart(2, "0");
const field = "w-full rounded-lg border border-ink/20 bg-white/80 px-3 py-2.5 text-[15px] font-normal disabled:opacity-40";
const label = "mb-1.5 block text-[13px] font-bold";

type P = { name: string; gender: string; month: string; day: string; year: string; noTime: boolean; hour: string; minute: string; pm: boolean; query: string; city: City | null };
const EMPTY: P = { name: "", gender: "", month: "", day: "", year: "", noTime: false, hour: "", minute: "", pm: false, query: "", city: null };

function PersonFields({ p, set, title, idp }: { p: P; set: (x: Partial<P>) => void; title?: string; idp: string }) {
  const options = useMemo(() => (p.city && p.query === p.city.en ? [] : searchCities(p.query, 6)), [p.query, p.city]);
  return (
    <div className="flex flex-col gap-4">
      {title && <p className="font-myeongjo text-[16px] font-extrabold">{title}</p>}
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <div>
          <label htmlFor={`${idp}-name`} className={label}>First name</label>
          <input id={`${idp}-name`} value={p.name} onChange={(e) => set({ name: e.target.value })} className={field} placeholder="Emily" maxLength={20} />
        </div>
        <div>
          <label htmlFor={`${idp}-g`} className={label}>Gender</label>
          <select id={`${idp}-g`} value={p.gender} onChange={(e) => set({ gender: e.target.value })} className={field}>
            <option value="">Choose</option>
            <option value="f">Female</option>
            <option value="m">Male</option>
          </select>
        </div>
      </div>
      <fieldset>
        <legend className={label}>Date of birth</legend>
        <div className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-2">
          <select aria-label="Month" value={p.month} onChange={(e) => set({ month: e.target.value })} className={field}>
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <select aria-label="Day" value={p.day} onChange={(e) => set({ day: e.target.value })} className={field}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Year" value={p.year} onChange={(e) => set({ year: e.target.value })} className={field}>
            <option value="">Year</option>
            {YEARS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </fieldset>
      <fieldset disabled={p.noTime}>
        <legend className={label}>Time and city of birth</legend>
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <select aria-label="Hour" value={p.hour} onChange={(e) => set({ hour: e.target.value })} className={field}>
            <option value="">Hour</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select aria-label="Minute" value={p.minute} onChange={(e) => set({ minute: e.target.value })} className={field}>
            <option value="">Min</option>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{pad(i)}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-ink/20 text-[13px]">
            {(["AM", "PM"] as const).map((x) => (
              <button key={x} type="button" onClick={() => set({ pm: x === "PM" })} className={(x === "PM") === p.pm ? "bg-ink text-hanji" : "bg-white/70"}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-2">
          <input aria-label="City of birth" value={p.query} onChange={(e) => set({ query: e.target.value, city: null })} className={field} placeholder="City of birth (e.g. London)" autoComplete="off" />
          {p.query && options.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-ink/15 bg-white shadow-md">
              {options.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => set({ city: c, query: c.en })} className="block w-full px-3 py-2 text-left text-[14px] hover:bg-hanji">
                    {c.en}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>
      <label className="-mt-2 flex items-center gap-2 text-[13.5px]">
        <input type="checkbox" checked={p.noTime} onChange={(e) => set({ noTime: e.target.checked })} className="size-4 accent-seal" />
        I don’t know the birth time
      </label>
    </div>
  );
}

function check(p: P, who: string): EnPersonInput | string {
  if (!p.name.trim()) return `${who}: please write a first name.`;
  if (!p.gender) return `${who}: please choose a gender (it sets the direction of the ten-year cycles).`;
  if (!p.month || !p.day || !p.year) return `${who}: please choose the month, day and year of birth.`;
  const m = Number(p.month), d = Number(p.day), y = Number(p.year);
  if (new Date(Date.UTC(y, m - 1, d)).getUTCMonth() !== m - 1) return `${who}: ${MONTHS[m - 1]} ${y} doesn't have a day ${d}.`;
  if (!p.noTime && (!p.hour || p.minute === "")) return `${who}: choose the birth time, or tick “I don’t know the birth time”.`;
  const typed = searchCities(p.query, 1)[0];
  const place = p.city ?? (typed && typed.en.toLowerCase() === p.query.trim().toLowerCase() ? typed : null);
  if (!p.noTime && !place) return `${who}: pick the city of birth from the list (or the nearest big city).`;
  return {
    name: p.name.trim(),
    gender: p.gender,
    y,
    m,
    d,
    time: p.noTime ? null : `${pad((Number(p.hour) % 12) + (p.pm ? 12 : 0))}:${pad(Number(p.minute))}`,
    city: p.noTime ? null : place!.id,
  };
}

export default function ReadingForm({ id, people, cta }: { id: string; people: 1 | 2; cta: string }) {
  const router = useRouter();
  const [a, setA] = useState<P>(EMPTY);
  const [b, setB] = useState<P>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const list = people === 2 ? [check(a, "You"), check(b, "Your partner")] : [check(a, "You")];
    const bad = list.find((x) => typeof x === "string");
    if (bad) return setError(bad as string);
    setBusy(true);
    setError("");
    makeReading(list as EnPersonInput[])
      .then((r) => {
        if ("error" in r) {
          setBusy(false);
          return setError(r.error);
        }
        const q = new URLSearchParams({ a: r.tokens[0], ...(r.tokens[1] ? { b: r.tokens[1] } : {}) });
        router.push(`/en/reading/${id}/preview?${q}`);
      })
      .catch(() => {
        setBusy(false);
        setError("Something went wrong. Please try again.");
      });
  }

  return (
    <form onSubmit={submit} className="doc-paper flex flex-col gap-6 px-5 py-6">
      <PersonFields p={a} set={(x) => setA((v) => ({ ...v, ...x }))} title={people === 2 ? "You" : undefined} idp="a" />
      {people === 2 && <PersonFields p={b} set={(x) => setB((v) => ({ ...v, ...x }))} title="Your partner" idp="b" />}
      {error && <p className="text-[13.5px] text-seal">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-seal px-5 py-3.5 font-myeongjo text-[17px] font-extrabold text-hanji disabled:opacity-60">
        {busy ? "Reading the chart…" : cta}
      </button>
      <p className="-mt-3 text-center text-[12px] text-ink-soft">Your birth date is used once to work out the chart and is never stored.</p>
    </form>
  );
}
