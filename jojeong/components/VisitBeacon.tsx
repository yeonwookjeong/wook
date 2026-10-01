"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { classify, SRC_COOKIE } from "@/lib/source";

// Reports each page view to /api/stat, and whether this browser is new today, this week, this month or at all.
// The browser remembers only the dates it was last counted; nothing identifies it.
const KST = 9 * 3600000;
const day = (t: number) => new Date(t + KST).toISOString().slice(0, 10);
function week(t: number) {
  const d = new Date(t + KST);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function send(body: object) {
  try {
    // text/plain keeps the beacon a simple request every browser sends; the server reads it as JSON anyway.
    const blob = new Blob([JSON.stringify(body)], { type: "text/plain" });
    if (!navigator.sendBeacon?.("/api/stat", blob)) void fetch("/api/stat", { method: "POST", body: blob, keepalive: true });
  } catch {
    // Counting never gets in the way of the page.
  }
}

// For buttons: which step of the funnel was taken (lib/stats.ts CLIENT_EVENTS), and for a step out of a free
// page, which page it was (lib/nextStep.ts).
export const trackEvent = (e: string, from?: string) => send(from ? { e, from } : { e });

export default function VisitBeacon() {
  const path = usePathname();
  useEffect(() => {
    // The owner's pages and the social card renderer are not visits.
    if (path.startsWith("/admin")) return;
    const now = Date.now();
    const seen = { d: "", w: "", m: "" };
    let ever = true;
    try {
      const raw = localStorage.getItem("hv");
      if (raw) {
        Object.assign(seen, JSON.parse(raw));
        ever = false;
      }
    } catch {}
    const cur = { d: day(now), w: week(now), m: day(now).slice(0, 7) };
    // The road this browser first came by (lib/source.ts), kept a year; a browser counted before this existed
    // gets one on its next visit, but only a first visit is counted by road.
    let src: string | undefined;
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${SRC_COOKIE}=`))) {
      src = classify({ path, referrer: document.referrer, ua: navigator.userAgent, query: location.search });
      document.cookie = `${SRC_COOKIE}=${src}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }
    send({ v: { day: seen.d !== cur.d, week: seen.w !== cur.w, month: seen.m !== cur.m, ever }, ...(ever && src && { src }) });
    try {
      localStorage.setItem("hv", JSON.stringify(cur));
    } catch {}
  }, [path]);
  return null;
}
