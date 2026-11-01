"use client";

import { useEffect, useState } from "react";

// 즉위 연출: right after the accession (and only then, ?new=1), a short ceremony over the page. A scroll unrolls,
// the decree is read and the royal seal comes down. It leaves on its own after a few seconds; a tap skips it.
// `variant="appoint"` is the same ceremony for a minister receiving their post.
export default function Enthrone({
  kicker,
  title,
  line,
  variant = "king",
}: {
  kicker: string;
  title: string;
  line: string;
  variant?: "king" | "appoint";
}) {
  const [shown, setShown] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Drop ?new=1 so a reload or a shared link does not replay the ceremony.
    const url = new URL(window.location.href);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    const out = window.setTimeout(() => setLeaving(true), 3200);
    const gone = window.setTimeout(() => setShown(false), 3700);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(gone);
    };
  }, []);

  if (!shown) return null;
  const close = () => {
    setLeaving(true);
    window.setTimeout(() => setShown(false), 400);
  };

  return (
    <div
      role="dialog"
      aria-label={`${kicker} ${title}`}
      onClick={close}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#3a2a1c,#120d09_70%)] px-6 transition-opacity duration-400 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="w-full max-w-[340px]">
        <p className="animate-ceremony-fade text-center font-myeongjo text-xs font-extrabold tracking-[0.5em] text-[#e2bc68]">
          {variant === "king" ? "卽 位 式" : "敎 旨 下 賜"}
        </p>
        {/* The scroll: rods at both ends, the paper opens from the middle. */}
        <div className="relative mt-4">
          <div className="h-3 rounded-full bg-[linear-gradient(#80552f,#4a2e17_60%,#2e1c0d)]" />
          <div className="animate-unroll doc-paper relative mx-2 origin-top overflow-hidden px-6 pt-9 pb-20 text-center">
            <p className="animate-ceremony-fade text-sm text-ink-soft [animation-delay:700ms]">{kicker}</p>
            <p className="animate-ceremony-fade mt-2 font-myeongjo text-[34px] leading-tight font-extrabold break-keep [animation-delay:950ms]">
              {title}
            </p>
            <p className="animate-ceremony-fade mt-3 text-[15px] leading-relaxed break-keep [animation-delay:1300ms]">{line}</p>
            <span className="animate-seal-drop absolute right-4 bottom-3 flex size-16 items-center justify-center rounded-lg border-[3px] border-seal bg-seal/5 font-myeongjo text-sm font-extrabold leading-tight text-seal [animation-delay:1900ms]">
              御
              <br />寶
            </span>
          </div>
          <div className="h-3 rounded-full bg-[linear-gradient(#80552f,#4a2e17_60%,#2e1c0d)]" />
        </div>
        <p className="mt-5 text-center text-xs text-[#f3ead0]/60">화면을 누르면 넘어가옵니다</p>
      </div>
    </div>
  );
}
