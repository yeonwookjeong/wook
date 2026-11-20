"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import AskLink from "./AskLink";
import { trackEvent } from "./VisitBeacon";

// The one notice, as soon as a page opens: one of the two free games at random, 왕이 될 사주 or the 신분 감정's 호패
// (대표님 11/20: 접속하면 무조건, 둘 중 랜덤), once per visit (this tab's session). Before: 왕 alone, once per browser. Never
// over paying, a bought report, the room, the owner's pages, a friend's link or a reading on screen, nor on the 도감
// game itself (seeing it counts as seen). `gift`: the questions a Kakao sign-up brings, shown under it to non-members.
// 벼슬길은 팝업 없이 바로 게임으로 (대표님 11/17).
const QUIET = ["/byeoseul", "/ask", "/pay", "/admin", "/login", "/r/", "/my", "/leave", "/logout", "/e/", "/s/"];
// Shown once per visit: kept in sessionStorage, so the next visit (a new tab or a new day) shows it again.
const SEEN = "pop-visit";
type Pick = "king" | "hopae";
const IMG = ["a", "g", "y", "m", "m"] as const;

export default function SinsalNote({ gift }: { gift: number }) {
  const path = usePathname();
  const [show, setShow] = useState<Pick | null>(null);
  useEffect(() => {
    // On a game's own page, only the other one is offered.
    const onKing = path.startsWith("/king") || path.startsWith("/court");
    try {
      if (QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
      if (sessionStorage.getItem(SEEN)) return;
    } catch {
      return;
    }
    const pick: Pick = onKing || Math.random() < 0.5 ? "hopae" : "king";
    // Right as the page opens (대표님 11/14: 홈에 들어오자마자), but never over someone typing: if a field already has
    // the cursor, this visit is skipped and the notice waits for the next one. Never over a reading on screen.
    const t = setTimeout(() => {
      if (path.startsWith("/reports/")) return;
      const el = document.activeElement;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {}
      setShow(pick);
      trackEvent(pick === "king" ? "king_pop" : "hopae_pop");
    }, 700);
    return () => clearTimeout(t);
  }, [path]);
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);
  if (!show) return null;
  const close = () => setShow(null);
  const king = show === "king";
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1118]/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={king ? "왕이 될 사주" : "조선 신분 감정"}
      onClick={close}
    >
      <div
        className="relative w-full max-w-[400px] animate-rise overflow-hidden rounded-3xl bg-[#0f2236] text-hanji shadow-[0_20px_50px_rgb(0_0_0/0.45),inset_0_0_0_1px_rgb(212_175_95/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The throne before the 일월오봉도 as the notice's picture (대표님 11/14: 훈도 말고 왕의 상징; 그림 public/king). */}
        <div className={`relative flex justify-center px-4 pt-5 ${king ? "" : "bg-[radial-gradient(circle_at_50%_30%,#6b3a1c,transparent_70%)]"}`}>
          {king ? (
            <Image src="/king/throne.webp" alt="일월오봉도 앞 어좌" width={1080} height={639} className="h-[clamp(130px,24dvh,210px)] w-auto object-contain" />
          ) : (
            // The five 호패 of 『속대전』, as the 신분 감정's first screen shows them (the small wooden one drawn smaller).
            <div className="flex h-[clamp(130px,24dvh,210px)] items-start justify-center gap-2" aria-label="조선 호패 다섯 가지">
              {IMG.map((f, i) => (
                <Image key={i} src={`/hopae/${f}.webp`} alt="" width={510} height={1000} className={`w-auto drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)] ${i === 3 ? "h-[84%]" : "h-full"}`} />
              ))}
            </div>
          )}
          <button type="button" onClick={close} aria-label="닫기" className="absolute top-2.5 right-2.5 size-8 rounded-full bg-[#0f2236]/60 text-hanji/90 backdrop-blur-sm">
            ✕
          </button>
        </div>
        <div className="relative mt-4 px-5 pb-4 text-center">
          <p className="font-myeongjo text-[12px] font-bold tracking-[0.3em] text-[#d4af5f]">{king ? "無 料, 왕이 될 사주" : "無 料, 조선 신분 감정"}</p>
          <h2 className="mt-1 font-myeongjo text-[21px] leading-snug font-extrabold">{king ? "나랑 같은 일주 왕은 누구일까" : "조선에 태어났다면 나는 어떤 호패를 찼을까"}</h2>
          <p className="mt-2 text-[14px] leading-relaxed break-keep text-hanji/85">
            {king
              ? "조선 왕 27명의 생일을 실록에서 찾았어요. 생일만 넣으면 나와 일주가 같은 왕, 내가 어떤 왕이었을지, 친구 중 누가 가장 잘 맞는지 알려 드려요."
              : "상아부터 나무까지 호패 다섯 가지 중 내 것은 무엇일지, 사주로 신분과 하던 일까지 봐 드려요. 친구 호패도 모아 보세요."}
          </p>
          <Link
            href={king ? "/king" : "/reports/sinbun"}
            onClick={close}
            className="mt-4 block rounded-2xl bg-[#d4af5f] py-3 font-myeongjo text-[16px] font-extrabold text-[#0f2236] shadow-[0_5px_0_#9c7a2e]"
          >
            {king ? "나랑 같은 일주 왕 찾기" : "내 호패 보기"}
          </Link>
          {gift > 0 && (
            <AskLink from="pop" onClick={close} className="mt-3 block rounded-xl border border-[#d4af5f]/30 px-3 py-2 text-[12.5px] leading-snug text-hanji/85">
              카카오 로그인하면 <b className="text-[#d4af5f]">첫 질문 {gift}개 무료</b> →
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
