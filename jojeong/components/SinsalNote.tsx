"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AskLink from "./AskLink";
import { trackEvent } from "./VisitBeacon";

// The one notice: 왕이 될 사주 since its renewal (2026-11-14; before that the 신살 유형 테스트), once per browser, after the first screen has been read. Never
// over paying, a bought report, the room, the owner's pages, a friend's link or a reading on screen, nor on the 도감
// game itself (seeing it counts as seen). `gift`: the questions a Kakao sign-up brings, shown under it to non-members.
const QUIET = ["/ask", "/pay", "/admin", "/login", "/r/", "/my", "/leave", "/logout", "/e/", "/s/"];
// Bumped when the notice changes (2026-10-27: 신살 도감 → 신살 유형 테스트; 2026-11-14: → 왕이 될 사주), so those who saw
// the old one see it once more.
const SEEN = "king1";

export default function SinsalNote({ gift }: { gift: number }) {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (path.startsWith("/king") || path.startsWith("/court")) {
        localStorage.setItem(SEEN, "1");
        return;
      }
      if (QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
      if (localStorage.getItem(SEEN)) return;
    } catch {
      return;
    }
    // Not over the first screen: once the visitor has scrolled past most of it, or after 25 seconds on the page.
    let done = false;
    const pop = () => {
      if (done) return;
      done = true;
      cleanup();
      // Not on a report page at all: a reading on screen, or the birth form being filled in (Clarity 11/10: the
      // notice came up over the free reading's form while people typed, and was closed about one time in seven).
      if (path.startsWith("/reports/") || document.querySelector('input[name="birth"]')) return;
      try {
        localStorage.setItem(SEEN, "1");
      } catch {}
      setShow(true);
      trackEvent("king_pop");
    };
    const onScroll = () => window.scrollY > window.innerHeight * 0.8 && pop();
    const t = setTimeout(pop, 25000);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
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
      aria-label="새로 단장한 왕이 될 사주"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[400px] animate-rise overflow-hidden rounded-3xl bg-[#0f2236] text-hanji shadow-[0_20px_50px_rgb(0_0_0/0.45),inset_0_0_0_1px_rgb(212_175_95/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-[clamp(130px,24dvh,210px)] items-end justify-center bg-[radial-gradient(circle_at_50%_35%,rgb(212_175_95/0.28),transparent_65%)]">
          <Image src="/hundo-decree.png" alt="어명 두루마리를 펼친 정 훈도" width={200} height={200} className="h-[92%] w-auto object-contain" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#0f2236]" />
          <button type="button" onClick={close} aria-label="닫기" className="absolute top-2.5 right-2.5 size-8 rounded-full bg-[#0f2236]/60 text-hanji/90 backdrop-blur-sm">
            ✕
          </button>
        </div>
        <div className="relative -mt-2 px-5 pb-4 text-center">
          <p className="font-myeongjo text-[12px] font-bold tracking-[0.3em] text-[#d4af5f]">新 刊, 왕이 될 사주</p>
          <h2 className="mt-1 font-myeongjo text-[21px] leading-snug font-extrabold">나랑 같은 일주 왕은 누구일까</h2>
          <p className="mt-2 text-[14px] leading-relaxed break-keep text-hanji/85">
            조선 왕 27명의 생일을 실록에서 찾았어요. 생일만 넣으면 나와 일주가 같은 왕, 내가 어떤 왕이었을지, 친구 중 누가 가장 잘 맞는지 알려 드려요.
          </p>
          <Link
            href="/king"
            onClick={close}
            className="mt-4 block rounded-2xl bg-[#d4af5f] py-3 font-myeongjo text-[16px] font-extrabold text-[#0f2236] shadow-[0_5px_0_#9c7a2e]"
          >
            나랑 같은 일주 왕 찾기
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
