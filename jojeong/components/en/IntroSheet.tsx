"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// First visit only: a short welcome sheet at the bottom of the screen (not a blocking pop-up) saying what the
// site is and what saju is, in three lines. Dismissed for good in this browser; if storage is blocked it just
// shows once per visit.
const KEY = "en-intro-seen";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
let dismissed = false;
const seen = () => {
  if (dismissed) return true;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export default function IntroSheet() {
  const isSeen = useSyncExternalStore(subscribe, seen, () => true);
  if (isSeen) return null;
  const close = () => {
    dismissed = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    listeners.forEach((fn) => fn());
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[440px] px-3 pb-3" role="dialog" aria-label="Welcome">
      <div className="doc-paper px-5 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
        <p className="text-[11px] font-extrabold tracking-[0.3em] text-seal">WELCOME, TRAVELER</p>
        <h2 className="mt-1 font-myeongjo text-xl font-extrabold leading-snug">You have stepped into a Joseon fortune house</h2>
        <ol className="mt-3 flex flex-col gap-2 text-[13.5px] leading-relaxed">
          <li>
            <b>Saju (사주)</b> is how Koreans have read destiny for centuries: the year, month, day and hour of your birth become
            four &ldquo;pillars&rdquo; of eight characters.
          </li>
          <li>
            <b>Hundo (훈도)</b> was a real title: a teacher of fate-reading at Joseon&rsquo;s royal observatory. Ours reads your chart
            for you.
          </li>
          <li>
            <b>Not sure of your birth time?</b> That&rsquo;s fine. Three pillars still tell a lot; add the hour later.
          </li>
        </ol>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={close} className="flex-1 rounded-full bg-seal px-4 py-2.5 font-bold text-hanji">
            Read my saju
          </button>
          <Link href="/en/saju-101" onClick={close} className="rounded-full border border-ink/25 px-4 py-2.5 text-center font-bold text-ink">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
