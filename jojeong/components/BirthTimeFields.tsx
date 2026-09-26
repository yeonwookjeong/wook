"use client";

import { useEffect, useRef, useState } from "react";
import { CITIES, cityById, correctBirth, describeCorrection } from "@/lib/birthtime";

const field = "rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal disabled:opacity-40";

// Birth time (clock time, or unknown) and birthplace, with the correction shown live: summer time, the
// standard time of the day and the birthplace's longitude, and the 시 that comes out of them.
export default function BirthTimeFields({ unknownLabel }: { unknownLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [city, setCity] = useState<string>(CITIES[0].id);
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

  let preview: string | null = null;
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!unknown && m) {
    const b = date.birth.replace(/\D/g, "");
    if (b.length === 8 && date.calendar === "solar") {
      const c = correctBirth(Number(b.slice(0, 4)), Number(b.slice(4, 6)), Number(b.slice(6, 8)), Number(m[1]), Number(m[2]), cityById(city).lon);
      preview = describeCorrection(c, cityById(city).name);
    } else if (b.length === 8) preview = "음력 날짜는 양력으로 바꾼 뒤 서머타임과 경도를 보정하옵니다.";
  }

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink-soft">태어난 시각과 곳 (선택)</span>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <input
          type="time"
          name="time"
          value={unknown ? "" : time}
          onChange={(e) => setTime(e.target.value)}
          disabled={unknown}
          aria-label="태어난 시각"
          className={field}
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
          <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="size-4 accent-seal" />
          {unknownLabel}
        </label>
      </div>
      <select name="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={unknown} aria-label="태어난 곳" className={field}>
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}에서 태어남
          </option>
        ))}
      </select>
      {preview ? (
        <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs leading-relaxed text-ink">{preview}</p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-soft">
          출생증명서의 시각 그대로 넣으시옵소서. 서머타임과 지역 경도는 소신이 보정하옵니다.
        </p>
      )}
    </div>
  );
}
