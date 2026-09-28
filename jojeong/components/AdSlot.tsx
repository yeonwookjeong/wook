"use client";

import Script from "next/script";
import { useEffect } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsOn } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// One responsive display ad, labelled as such. Renders nothing while ads are off (lib/ads.ts).
export default function AdSlot({ className = "mt-8" }: { className?: string }) {
  useEffect(() => {
    if (!adsOn) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A blocked or not-yet-loaded script leaves the slot empty, which is fine.
    }
  }, []);
  if (!adsOn) return null;
  return (
    <aside className={className} aria-label="광고">
      <p className="mb-1 text-center text-[10px] text-ink-soft/70">광고</p>
      <Script
        id="adsbygoogle"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
