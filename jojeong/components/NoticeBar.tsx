"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// `fresh`: a small "NEW" mark for something just added.
export type Notice = { text: string; href: string; fresh?: boolean };

// The home page's top strip: a few short notices taking turns, one at a time, so news and events are seen on
// the first screen without pushing the hero down. Holds still for people who ask the system for less motion.
export default function NoticeBar({ notices }: { notices: Notice[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (notices.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % notices.length), 4000);
    return () => clearInterval(t);
  }, [notices.length]);
  if (!notices.length) return null;
  const n = notices[i];
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#0f2236] px-4 py-3 text-hanji shadow-[0_4px_14px_rgb(15_34_54/0.25),inset_0_0_0_1px_rgb(212_175_95/0.45)]">
      {/* Something just added wears a red NEW in place of the plain mark. */}
      <span
        aria-hidden
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${n.fresh ? "bg-[#b3261e] tracking-wide text-hanji" : "bg-[#d4af5f] font-myeongjo text-[#0f2236]"}`}
      >
        {n.fresh ? "NEW" : "알림"}
      </span>
      <Link key={i} href={n.href} className="animate-rise flex min-w-0 flex-1 items-center gap-1 text-[14px] font-bold">
        <span className="min-w-0 truncate">{n.text}</span>
        <span aria-hidden className="shrink-0 text-[#d4af5f]">→</span>
      </Link>
      {notices.length > 1 && (
        <span aria-hidden className="flex shrink-0 gap-1">
          {notices.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-[#d4af5f]" : "w-1.5 bg-hanji/25"}`} />
          ))}
        </span>
      )}
    </div>
  );
}
