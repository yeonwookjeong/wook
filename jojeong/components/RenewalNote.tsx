"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RENEWAL_AT, RENEWED_ON } from "@/lib/launch";

// For someone who came before the renewal (lib/launch.ts) and comes back: one line on what is new, once.
// The visit beacon keeps the last day seen in localStorage ("hv"); this runs before it writes today's.
export default function RenewalNote({ preview = false }: { preview?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!preview && Date.now() < RENEWAL_AT) return;
    try {
      if (localStorage.getItem("rn")) return;
      const last = (JSON.parse(localStorage.getItem("hv") ?? "null") as { d?: string } | null)?.d;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage
      if (last && last < RENEWED_ON) {
        // Once: shown on this page, not on the next one.
        localStorage.setItem("rn", "1");
        setShow(true);
      }
    } catch {}
  }, [preview]);
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem("rn", "1");
    } catch {}
    setShow(false);
  };
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-seal/30 bg-seal/10 px-3 py-2 text-[13px]">
      <Link href="/news" onClick={close} className="min-w-0 flex-1 font-bold text-seal">
        훈도사주가 새로워졌사옵니다 · 무엇이 바뀌었나 →
      </Link>
      <button type="button" onClick={close} aria-label="닫기" className="shrink-0 px-1 text-ink-soft">
        ✕
      </button>
    </div>
  );
}
