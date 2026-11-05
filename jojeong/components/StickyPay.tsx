"use client";

import { useEffect, useState } from "react";

// A thin bar fixed to the foot of a report page before it is bought: the price and one tap down to the payment
// (#report-start, the Paywall). Shown once the reader has scrolled past the first screen, hidden again while the
// Paywall itself is on screen, so it never sits on top of the real buttons.
export default function StickyPay({ main, sub }: { main: string; sub?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const wall = document.getElementById("report-start");
    let wallInView = false;
    const update = () => setShow(window.scrollY > window.innerHeight * 0.6 && !wallInView);
    const io = wall
      ? new IntersectionObserver(([e]) => {
          wallInView = e.isIntersecting;
          update();
        })
      : null;
    if (wall && io) io.observe(wall);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))] transition-transform duration-300 ${show ? "translate-y-0" : "translate-y-[120%]"}`}
      aria-hidden={!show}
    >
      <a
        href="#report-start"
        tabIndex={show ? 0 : -1}
        className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-seal px-4 py-3 text-hanji shadow-[0_6px_20px_rgba(0,0,0,.25)]"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-[15px] leading-snug font-extrabold">{main}</span>
          {sub && <span className="block text-[11.5px] leading-snug text-hanji/80">{sub}</span>}
        </span>
        <span className="shrink-0 rounded-xl bg-hanji px-3 py-2 font-myeongjo text-[14px] font-extrabold text-seal">보기 ↓</span>
      </a>
    </div>
  );
}
