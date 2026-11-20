"use client";

import { useEffect, useState } from "react";

type Review = { text: string; product: string; rewarded: boolean };

// The home page's last section (대표님 11/20): the reviews the owner picked, one at a time, turning by themselves every
// few seconds. A touch on the dots shows that one; a hand on it pauses the turning. No names, ever.
export default function ReviewRotator({ items }: { items: Review[] }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (items.length < 2 || hold) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length, hold]);
  if (items.length === 0) return null;
  const r = items[i % items.length];
  return (
    <div className="card px-5 py-5" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} aria-live="polite">
      <p className="font-myeongjo text-2xl leading-none text-gold">“</p>
      <p key={i} className="mt-1 min-h-[6.6em] animate-[fadein_.5s_ease] text-[14.5px] leading-relaxed">
        {r.text}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-soft">
        {r.product && <b className="text-ink">{r.product}</b>}
        <span>구매한 손님</span>
        {r.rewarded && <span className="text-[11px]">· 질문권을 받고 남긴 후기</span>}
      </p>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n + 1}번째 후기`}
              onClick={() => setI(n)}
              className={`h-1.5 rounded-full transition-all ${n === i % items.length ? "w-5 bg-seal" : "w-1.5 bg-ink/20"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
