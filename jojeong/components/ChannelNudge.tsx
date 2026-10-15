"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// For a Kakao member who has not had the channel question: a slim bar at the foot of every page (but 묻기, which
// has its own box, and the owner's pages), until they take it or close it. Closed, it stays away for a week.
const KEY = "jj_channel_nudge";
const WEEK = 7 * 24 * 3600 * 1000;

export default function ChannelNudge({ gift }: { gift: number }) {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let closed = 0;
    try {
      closed = Number(localStorage.getItem(KEY) ?? 0);
    } catch {}
    if (Date.now() - closed < WEEK) return;
    // A moment after the page settles, so it never covers the opening note on a first visit.
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!show || path.startsWith("/ask") || path.startsWith("/admin") || path.startsWith("/pay")) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] px-3 pb-3">
      <div className="flex items-center gap-2 rounded-2xl bg-[#FEE500] px-3.5 py-2.5 text-[#191919] shadow-[0_6px_20px_rgba(0,0,0,.18)]">
        <Link href="/ask#channel" className="min-w-0 flex-1 leading-snug">
          <b className="block text-[13.5px]">카카오톡 채널 추가하면 질문 {gift}개 더</b>
          <span className="block text-[12px] opacity-75">새 소식과 좋은 날 알림도 채널로 받아요 →</span>
        </Link>
        <button type="button" onClick={close} aria-label="닫기" className="shrink-0 px-1.5 text-[18px] leading-none opacity-60">
          ×
        </button>
      </div>
    </div>
  );
}
