"use client";

import { useState } from "react";

type Review = { text: string; product: string; rewarded: boolean };

// The home page's reviews (대표님 11/20: 상품과 칼럼 사이에 쭉): the ones the owner picked, as cards flowing sideways
// on their own; a finger on the strip stops it, so a card can be read. Two lengths of the list run side by side
// so the loop has no seam. Reduced motion: a plain sideways scroll. No names, ever. No 질문권 label (대표님 11/20 결정).
// One card (대표님 11/21: 폰트와 빈칸 다시): a fixed, short height so a one-line review does not leave a tall empty
// box; the words sit in the middle in the heading face, a large quote mark behind them, the product as a small tag.
function Card({ r }: { r: Review }) {
  return (
    <li className="relative flex h-[148px] w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#fffaf0] px-4 pb-3 pt-3.5 shadow-[0_1px_0_rgb(134_96_26/0.2),inset_0_0_0_1px_rgb(134_96_26/0.16)]">
      <span aria-hidden className="pointer-events-none absolute -top-3 right-2.5 font-myeongjo text-[72px] leading-none text-gold/20">
        ”
      </span>
      <div className="relative flex flex-1 items-center pr-3">
        <p className="line-clamp-4 font-myeongjo text-[15px] font-semibold leading-[1.55] text-ink">{r.text}</p>
      </div>
      <p className="relative mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
        {r.product && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-ink">{r.product}</span>}
        구매한 손님
      </p>
    </li>
  );
}

export default function ReviewRotator({ items }: { items: Review[] }) {
  const [hold, setHold] = useState(false);
  if (items.length === 0) return null;
  if (items.length < 3)
    return (
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {items.map((r, i) => (
          <Card key={i} r={r} />
        ))}
      </ul>
    );
  // About 6 seconds a card, whatever the count.
  const seconds = items.length * 6;
  return (
    <div
      className="-mx-4 overflow-hidden motion-reduce:overflow-x-auto"
      onPointerDown={() => setHold(true)}
      onPointerUp={() => setHold(false)}
      onPointerLeave={() => setHold(false)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
    >
      <ul
        className="flex w-max gap-3 px-4 pb-1 motion-safe:animate-[reviewflow_linear_infinite]"
        style={{ animationDuration: `${seconds}s`, animationPlayState: hold ? "paused" : "running" }}
      >
        {[...items, ...items].map((r, i) => (
          <Card key={i} r={r} />
        ))}
      </ul>
    </div>
  );
}
