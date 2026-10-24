import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef, useState } from "react";

// The rewarded ad that opens today's full reading. Development builds use the Apps in Toss test id; set
// VITE_AD_REWARDED to the console's ad group id for release. The reward is given only on `userEarnedReward`, never
// on a click or on closing the ad (the ad policy).
const AD_GROUP_ID = import.meta.env.VITE_AD_REWARDED || (import.meta.env.DEV ? "ait-ad-test-rewarded-id" : "");

type State = "loading" | "ready" | "showing" | "unavailable";

export function useRewardedAd(onReward: () => void) {
  const supported = Boolean(AD_GROUP_ID) && loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  const [state, setState] = useState<State>(supported ? "loading" : "unavailable");
  const cleanLoad = useRef<(() => void) | null>(null);
  const cleanShow = useRef<(() => void) | null>(null);
  const rewardRef = useRef(onReward);
  rewardRef.current = onReward;

  const load = useCallback(() => {
    if (!supported) return;
    cleanLoad.current?.();
    setState("loading");
    cleanLoad.current = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (e) => {
        if (e.type === "loaded") setState("ready");
      },
      onError: () => setState("unavailable"),
    });
  }, [supported]);

  const show = useCallback(() => {
    if (state !== "ready") return;
    cleanShow.current?.();
    setState("showing");
    cleanShow.current = showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (e) => {
        if (e.type === "userEarnedReward") rewardRef.current();
        if (e.type === "dismissed") load();
        if (e.type === "failedToShow") setState("unavailable");
      },
      onError: () => setState("unavailable"),
    });
  }, [load, state]);

  useEffect(() => {
    load();
    return () => {
      cleanLoad.current?.();
      cleanShow.current?.();
    };
  }, [load]);

  return { state, show };
}
