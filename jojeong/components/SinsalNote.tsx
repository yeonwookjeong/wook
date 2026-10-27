"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AskLink from "./AskLink";
import { trackEvent } from "./VisitBeacon";

// The one notice (it replaced the grand-opening note): the 신살 유형 테스트, once per browser, a moment after arriving. Never
// over paying, a bought report, the room, the owner's pages, a friend's link or a reading on screen, nor on the 도감
// itself (seeing it counts as seen). `gift`: the questions a Kakao sign-up brings, shown under it to non-members.
const QUIET = ["/ask", "/pay", "/admin", "/login", "/r/", "/my", "/leave", "/logout", "/e/", "/s/"];
// Bumped when the notice changes (2026-10-27: 신살 도감 → 신살 유형 테스트), so those who saw the old one see it once more.
const SEEN = "sinsal2";
const FACES = ["M05", "F18", "M14", "F07"];

export default function SinsalNote({ gift }: { gift: number }) {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (path.startsWith("/sinsal")) {
        localStorage.setItem(SEEN, "1");
        return;
      }
      if (QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
      if (localStorage.getItem(SEEN)) return;
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
      aria-label="새로 생긴 신살 유형 테스트"
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
          <p className="font-myeongjo text-[11px] font-bold tracking-[0.3em] text-[#d4af5f]">新 刊 · 신살 유형 테스트</p>
          <h2 className="mt-1 font-myeongjo text-[21px] leading-snug font-extrabold">나는 어떤 살의 사람일까</h2>
          <p className="mt-2 text-[13px] leading-relaxed break-keep text-hanji/80">
            도화·역마·화개·괴강… 20가지 살 유형 중 내 유형과, 그 유형이 100명 중 몇 명인지 알려 드려요.
          </p>
          <Link
            href="/sinsal"
            onClick={close}
            className="mt-4 block rounded-2xl bg-[#d4af5f] py-3 font-myeongjo text-[16px] font-extrabold text-[#0f2236] shadow-[0_5px_0_#9c7a2e]"
          >
            내 살 유형 보기
          </Link>
          {gift > 0 && (
            <AskLink from="pop" onClick={close} className="mt-3 block rounded-xl border border-[#d4af5f]/30 px-3 py-2 text-[12.5px] leading-snug text-hanji/85">
              고민이 있다면 <b className="text-[#d4af5f]">카카오로 로그인하고 정 훈도에게 첫 질문 {gift}개</b> 선물 받기 →
            </AskLink>
          )}
          <button type="button" onClick={close} className="mt-3 text-[12.5px] text-hanji/60">
            다음에 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}
