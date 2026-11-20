"use client";

import { useState } from "react";

type Review = { text: string; product: string; rewarded: boolean };

// The home page's reviews (대표님 11/20: 상품과 칼럼 사이에 쭉): the ones the owner picked, as cards flowing sideways
// on their own; a finger on the strip stops it, so a card can be read. Two lengths of the list run side by side
// so the loop has no seam. Reduced motion: a plain sideways scroll. No names, ever.
function Card({ r }: { r: Review }) {
  return (
    <li className="flex w-[260px] shrink-0 flex-col rounded-2xl bg-[#fffaf0] px-4 py-4 shadow-[0_1px_0_rgb(134_96_26/0.2),inset_0_0_0_1px_rgb(134_96_26/0.16)]">
      <p className="font-myeongjo text-xl leading-none text-gold">“</p>
      <p className="mt-1 line-clamp-5 flex-1 text-[13.5px] leading-relaxed">{r.text}</p>
      <p className="mt-2.5 text-[11.5px] text-ink-soft">
        {r.product && <b className="text-ink">{r.product}</b>} 구매한 손님
        {r.rewarded && <span className="block text-[10.5px]">질문권을 받고 남긴 후기</span>}
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
