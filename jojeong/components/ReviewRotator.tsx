"use client";

import { useState } from "react";

type Review = { text: string; product: string; rewarded: boolean };

// The home page's reviews (대표님 11/20: 상품과 칼럼 사이에 쭉): the ones the owner picked, as cards flowing sideways
// on their own; a finger on the strip stops it, so a card can be read. Two lengths of the list run side by side
// so the loop has no seam. Reduced motion: a plain sideways scroll. No names, ever. No 질문권 label (대표님 11/20 결정).
// One card (대표님 11/21: 폰트와 빈칸 다시): a fixed, short height so a one-line review does not leave a tall empty
// box; the words sit in the middle in the heading face, a large quote mark behind them, the product as a small tag.
// A long review (대표님 11/21: 긴 후기는 어떻게 봐?) says 더 보기, and a tap on any card opens it whole in a sheet.
// About four lines of the card hold this many characters.
const LONG = 56;
function Card({ r, onOpen }: { r: Review; onOpen: () => void }) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())
      }
      className="relative flex h-[148px] w-[240px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#fffaf0] px-4 pb-3 pt-3.5 shadow-[0_1px_0_rgb(134_96_26/0.2),inset_0_0_0_1px_rgb(134_96_26/0.16)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 right-2.5 font-myeongjo text-[72px] leading-none text-gold/20"
      >
        ”
      </span>
      <div className="relative flex flex-1 items-center pr-3">
        <p className="line-clamp-4 font-myeongjo text-[15px] font-semibold leading-[1.55] text-ink">
          {r.text}
        </p>
      </div>
      <p className="relative mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
        {r.product && (
          <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-ink">
            {r.product}
          </span>
        )}
        구매한 손님
        {r.text.length > LONG && (
          <span className="ml-auto font-semibold text-[#86601a]">
            더 보기 ›
          </span>
        )}
      </p>
    </li>
  );
}

function Sheet({ r, onClose }: { r: Review; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#fffaf0] px-6 pb-8 pt-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-1 font-myeongjo text-[84px] leading-none text-gold/20"
        >
          ”
        </span>
        <p className="relative whitespace-pre-line font-myeongjo text-[17px] font-semibold leading-[1.7] text-ink">
          {r.text}
        </p>
        <p className="relative mt-4 flex items-center gap-1.5 text-[12px] text-ink-soft">
          {r.product && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-ink">
              {r.product}
            </span>
          )}
          구매한 손님
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-ink py-3 text-[15px] font-semibold text-[#fffaf0]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function ReviewRotator({ items }: { items: Review[] }) {
  const [hold, setHold] = useState(false);
  const [open, setOpen] = useState<Review | null>(null);
  if (items.length === 0) return null;
  const sheet = open && <Sheet r={open} onClose={() => setOpen(null)} />;
  if (items.length < 3)
    return (
      <>
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {items.map((r, i) => (
            <Card key={i} r={r} onOpen={() => setOpen(r)} />
          ))}
        </ul>
        {sheet}
      </>
    );
  // About 6 seconds a card, whatever the count.
  const seconds = items.length * 6;
  return (
    <>
      <div
        className="-mx-4 overflow-hidden motion-reduce:overflow-x-auto"
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      >
        <ul
          className="flex w-max gap-3 px-4 pb-1 motion-safe:animate-[reviewflow_linear_infinite]"
          style={{
            animationDuration: `${seconds}s`,
            animationPlayState: hold || open ? "paused" : "running",
          }}
        >
          {[...items, ...items].map((r, i) => (
            <Card key={i} r={r} onOpen={() => setOpen(r)} />
          ))}
        </ul>
      </div>
      {sheet}
    </>
  );
}
