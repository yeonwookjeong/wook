import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";

// A Toss banner ad in an empty slot of its own (never beside a button: the ad policy). The ads SDK is initialised
// once for the whole app. Development builds use the Apps in Toss test id; set VITE_AD_BANNER to the console's
// banner ad group id for release. Outside Toss, or with no id, nothing is shown.
const AD_GROUP_ID = import.meta.env.VITE_AD_BANNER || (import.meta.env.DEV ? "ait-ad-test-banner-id" : "");

let ready: Promise<void> | null = null;
function initOnce() {
  ready ??= new Promise<void>((resolve, reject) => {
    TossAds.initialize({ callbacks: { onInitialized: () => resolve(), onInitializationFailed: (e) => reject(e) } });
  });
  return ready;
}

export function TossBanner() {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AD_GROUP_ID || !TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) return;
    let destroy: (() => void) | null = null;
    let alive = true;
    initOnce()
      .then(() => {
        if (alive && slot.current) destroy = TossAds.attachBanner(AD_GROUP_ID, slot.current, { theme: "light", variant: "card" }).destroy;
      })
      .catch(() => {
        ready = null; // tried again on the next banner
      });
    return () => {
      alive = false;
      destroy?.();
    };
  }, []);

  return <div ref={slot} className="banner" />;
}
