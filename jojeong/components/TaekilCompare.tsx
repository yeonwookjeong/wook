"use client";

import { useState } from "react";

// For the reader whose dates are already narrowed down (a hall's open Saturdays, a mover's free days): pick the
// candidates from the searched span and see them ranked. Everything is computed on the server already; this
// only sorts it.
export type CompareDay = { date: string; label: string; grade: 2 | 1 | 0 | -1; score: number; reasons: string[]; warns: string[]; verdict: string };

const MARK = { 2: "◎", 1: "○", 0: "△", [-1]: "✕" } as const;
const MARK_STYLE = { 2: "bg-seal text-hanji", 1: "bg-gold/25 text-ink", 0: "bg-ink/5 text-ink-soft", [-1]: "bg-ink/5 text-ink-soft/60" } as const;
const MAX = 10;

export default function TaekilCompare({ days }: { days: CompareDay[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!days.length) return null;
  const first = days[0].date;
  const last = days.at(-1)!.date;
  const byDate = new Map(days.map((d) => [d.date, d]));

  const add = () => {
    if (!value) return;
    if (!byDate.has(value)) return setError(`${first.replaceAll("-", ".")} ~ ${last.replaceAll("-", ".")} 사이의 날짜만 비교할 수 있어요.`);
    if (picked.length >= MAX) return setError(`후보는 ${MAX}개까지 넣을 수 있어요.`);
    setError(null);
    setPicked((p) => (p.includes(value) ? p : [...p, value]));
  };
  const ranked = picked
    .map((d) => byDate.get(d)!)
    .sort((a, b) => b.grade - a.grade || b.score - a.score || a.date.localeCompare(b.date));

  return (
    <section className="doc-paper mt-4 px-5 pt-6 pb-5">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">내 후보 날짜 비교하기</h2>
      <p className="mt-1 text-center text-[12px] leading-relaxed text-ink-soft">
        식장·업체 사정으로 날짜가 이미 좁혀졌다면, 후보를 넣어 보세요. 가장 나은 날부터 줄 세워 드려요. (최대 {MAX}개)
      </p>
      <div className="mt-4 flex gap-2">
        <input
          type="date"
          min={first}
          max={last}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white/70 px-3 py-2.5 text-base outline-none focus:border-seal"
          aria-label="후보 날짜"
        />
        <button type="button" onClick={add} className="shrink-0 rounded-xl bg-ink px-4 text-sm font-bold text-hanji">
          추가
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-seal">
          {error}
        </p>
      )}
      {ranked.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2">
          {ranked.map((d, i) => (
            <li key={d.date} className={`rounded-2xl border px-4 py-3 ${i === 0 && d.grade >= 1 ? "border-seal bg-seal/5" : "border-seal/20 bg-white/60"}`}>
              <p className="flex items-baseline gap-2">
                <span className="font-myeongjo text-sm font-extrabold text-seal">{i + 1}위</span>
                <b className="font-myeongjo text-[15px]">{d.label}</b>
                {i === 0 && d.grade >= 1 && <span className="text-[11px] font-bold text-seal">후보 중 최선</span>}
                <span className={`ml-auto rounded-md px-1.5 text-xs font-extrabold ${MARK_STYLE[d.grade]}`}>{MARK[d.grade]}</span>
                <button type="button" onClick={() => setPicked((p) => p.filter((x) => x !== d.date))} className="text-xs text-ink-soft" aria-label={`${d.label} 빼기`}>
                  ✕
                </button>
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed">{d.verdict}</p>
              {d.reasons.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1 text-[11px]">
                  {d.reasons.map((r) => (
                    <span key={r} className="rounded-full bg-seal/8 px-2 py-0.5 text-seal">
                      {r}
                    </span>
                  ))}
                  {d.warns.map((w) => (
                    <span key={w} className="rounded-full bg-ink/5 px-2 py-0.5 text-ink-soft">
                      {w}
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {ranked.length > 0 && ranked.every((d) => d.grade < 1) && (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">넣은 후보 가운데 ○ 이상인 날이 없어요. 위의 좋은 날 목록에서 사정에 맞는 날이 있는지 한 번 더 보세요.</p>
      )}
    </section>
  );
}
