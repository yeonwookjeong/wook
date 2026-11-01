"use client";

import { useEffect } from "react";
import { trackEvent } from "./VisitBeacon";

// A free result seen: counted once a day per browser and page (lib/stats.ts FREE_VIEW), so the owner sees which
// free page people actually reach the result of, apart from the one birth-date form they all share.
export default function FreeSeen({ k }: { k: string }) {
  useEffect(() => {
    const key = `fv:${k}`;
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {}
    trackEvent("fv", k);
  }, [k]);
  return null;
}
