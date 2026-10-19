"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Notice = { text: string; href: string };

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
    <div className="card mt-3 flex items-center gap-3 rounded-2xl px-4 py-3">
      <span aria-hidden className="shrink-0 rounded-md bg-seal px-1.5 py-0.5 font-myeongjo text-[11px] font-extrabold text-hanji">
        알림
      </span>
      <Link key={i} href={n.href} className="animate-rise min-w-0 flex-1 truncate text-[13.5px] font-bold">
        {n.text}
      </Link>
      {notices.length > 1 && (
        <span aria-hidden className="flex shrink-0 gap-1">
          {notices.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-ink/60" : "w-1.5 bg-ink/20"}`} />
          ))}
        </span>
      )}
    </div>
  );
}
