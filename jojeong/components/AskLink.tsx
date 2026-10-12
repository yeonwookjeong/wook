"use client";

import Link from "next/link";
import type { AskFrom } from "@/lib/stats";
import { trackEvent } from "./VisitBeacon";

// A way into 정 훈도에게 묻기 that counts where it was taken (the owner's dashboard, lib/stats.ts ASK_FROM).
export default function AskLink({ from, className, children, onClick }: { from: AskFrom; className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href="/ask"
      className={className}
      onClick={() => {
        trackEvent("to_ask", from);
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
