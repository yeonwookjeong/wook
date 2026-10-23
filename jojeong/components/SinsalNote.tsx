"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent } from "./VisitBeacon";

// The 신살 도감 for those who come back: one notice, once per browser, only to someone who already saw the opening
// note (components/OpenNote.tsx) on an earlier visit, never on the same visit. Quiet where OpenNote is quiet, and
// on the 도감 itself (seeing it counts as seen).
const QUIET = ["/ask", "/pay", "/admin", "/login", "/r/", "/my", "/leave", "/logout", "/e/", "/s/"];
const SEEN = "sinsal1";
const FACES = ["M05", "F18", "M14", "F07"];

export default function SinsalNote() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (path.startsWith("/sinsal")) {
        localStorage.setItem(SEEN, "1");
        return;
      }
      if (QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
      // Returning only: the opening note was seen before, and not on this visit.
      if (!localStorage.getItem("open1") || localStorage.getItem(SEEN) || sessionStorage.getItem("open-now")) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      // A reading is on screen: not now.
      if (path.startsWith("/reports/") && !document.querySelector('input[name="birth"]')) return;
      try {
        localStorage.setItem(SEEN, "1");
      } catch {}
      setShow(true);
      trackEvent("sinsal_pop");
    }, 1500);
    return () => clearTimeout(t);
  }, [path]);
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);
  if (!show) return null;
  const close = () => setShow(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1118]/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="새로 생긴 신살 도감"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[400px] animate-rise overflow-hidden rounded-3xl bg-[#0f2236] text-hanji shadow-[0_20px_50px_rgb(0_0_0/0.45),inset_0_0_0_1px_rgb(212_175_95/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative grid h-[clamp(120px,24dvh,220px)] grid-cols-4">
          {FACES.map((f) => (
            <Image key={f} src={`/sinsal/${f}.webp`} alt="" width={200} height={250} className="h-full w-full object-cover object-top" />
          ))}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#0f2236]" />
          <button type="button" onClick={close} aria-label="닫기" className="absolute top-2.5 right-2.5 size-8 rounded-full bg-[#0f2236]/60 text-hanji/90 backdrop-blur-sm">
            ✕
          </button>
        </div>
        <div className="relative -mt-2 px-5 pb-4 text-center">
          <p className="font-myeongjo text-[11px] font-bold tracking-[0.3em] text-[#d4af5f]">新 刊 · 神 煞 圖 鑑</p>
          <h2 className="mt-1 font-myeongjo text-[21px] leading-snug font-extrabold">나는 무슨 살을 타고났을까</h2>
          <p className="mt-2 text-[13px] leading-relaxed break-keep text-hanji/80">
            도화·역마·화개·괴강… 스무 가지 살을 카드로 그렸어요. 내 카드를 펼치고 친구와 도감을 채워 보세요.
          </p>
          <Link
            href="/sinsal"
            onClick={close}
            className="mt-4 block rounded-2xl bg-[#d4af5f] py-3 font-myeongjo text-[16px] font-extrabold text-[#0f2236] shadow-[0_5px_0_#9c7a2e]"
          >
            내 카드 펼치기
          </Link>
          <button type="button" onClick={close} className="mt-3 text-[12.5px] text-hanji/60">
            다음에 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}
