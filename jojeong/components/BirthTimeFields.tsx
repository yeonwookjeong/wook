"use client";

import { useEffect, useId, useRef, useState } from "react";
import { josa } from "@/lib/josa";
import { cityById, clockLabel, correctBirth, describeCorrection, parseClock, searchCities, type City } from "@/lib/birthtime";

const field = "w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal disabled:opacity-40";

// Birth time (typed however people write it, or unknown) and birthplace (searched by name, anywhere in the
// world), with the reading of both shown back live: the time as understood, and the correction for the
// clock of the day (summer time, old standard time) and the birthplace's longitude.
export default function BirthTimeFields({ unknownLabel }: { unknownLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const cityInput = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [time, setTime] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [city, setCity] = useState<City>(cityById("seoul"));
  const cityRef = useRef(city); // the chosen city, for the blur handler
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [date, setDate] = useState<{ birth: string; calendar: string }>({ birth: "", calendar: "solar" });

  // The date fields live elsewhere in the same form; follow them for the preview.
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const read = () => {
      const data = new FormData(form);
      setDate({ birth: String(data.get("birth") ?? ""), calendar: String(data.get("calendar") ?? "solar") });
    };
    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => {
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
    };
  }, []);

  const clock = unknown ? null : parseClock(time);
  const results = searchCities(query);
  const cityLabel = (c: City) => `${c.name} · ${c.region}`;
  // The search box is left uncontrolled (so typing, including Korean composition, is never fought over);
  // it shows the chosen city when closed and clears for a new search on focus.
  const pick = (c: City) => {
    setCity(c);
    cityRef.current = c;
    setQuery("");
    setOpen(false);
    if (cityInput.current) cityInput.current.value = cityLabel(c);
  };

  let note: { text: string; ok: boolean } | null = null;
  if (!unknown && time.trim()) {
    if (!clock) note = { text: "시각을 알아보지 못했사옵니다. 0930, 21:30, 오후 9시 30분처럼 적어 주시옵소서.", ok: false };
    else {
      const b = date.birth.replace(/\D/g, "");
      const understood = `${josa(clockLabel(clock), "으로/로")} 알아들었사옵니다`;
      if (b.length === 8 && date.calendar === "solar") {
        const c = correctBirth(Number(b.slice(0, 4)), Number(b.slice(4, 6)), Number(b.slice(6, 8)), clock.hour, clock.minute, city);
        note = { text: `${understood}. ${describeCorrection(c, city.name)}`, ok: true };
      } else note = { text: `${understood}. 서머타임과 경도는 날짜에 맞춰 보정하옵니다.`, ok: true };
    }
  }

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink-soft">태어난 시각 (선택)</span>
      <div className="flex items-center gap-2">
        <input
          name="time"
          defaultValue=""
          onChange={(e) => setTime(e.target.value)}
          disabled={unknown}
          autoComplete="off"
          placeholder="예: 0930, 오후 9시 30분"
          aria-label="태어난 시각"
          className={`${field} min-w-0 flex-1`}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
          <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="size-4 accent-seal" />
          {unknownLabel}
        </label>
      </div>

      <span className="mt-2 text-sm font-semibold text-ink-soft">태어난 곳</span>
      <input type="hidden" name="city" value={city.id} />
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-label="태어난 도시 검색"
          ref={cityInput}
          defaultValue={cityLabel(city)}
          onFocus={(e) => {
            e.currentTarget.value = "";
            setOpen(true);
            setQuery("");
            setActive(0);
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            setTimeout(() => {
              setOpen(false);
              el.value = cityLabel(cityRef.current);
            }, 150);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(results[active]);
            }
          }}
          disabled={unknown}
          autoComplete="off"
          placeholder="도시 이름 (예: 부산, 뉴욕, Tokyo)"
          className={field}
        />
        {open && query && (
          <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-ink/15 bg-hanji shadow-lg">
            {results.length ? (
              results.map((c, i) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(c);
                  }}
                  className={`flex cursor-pointer items-baseline justify-between gap-2 px-4 py-2.5 ${i === active ? "bg-seal/10" : ""}`}
                >
                  <span className="font-bold">{c.name}</span>
                  <span className="truncate text-xs text-ink-soft">
                    {c.region} · {c.en}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-2.5 text-sm text-ink-soft">찾는 도시가 없으면 가장 가까운 큰 도시를 골라 주시옵소서.</li>
            )}
          </ul>
        )}
      </div>

      {note ? (
        <p className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${note.ok ? "bg-gold/10 text-ink" : "bg-seal/10 text-seal"}`}>{note.text}</p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-soft">
          출생증명서의 시각 그대로 적으시옵소서. 서머타임과 지역 경도는 소신이 보정하옵니다.
        </p>
      )}
    </div>
  );
}
