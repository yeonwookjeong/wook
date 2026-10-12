"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AskLink from "./AskLink";
import { trackEvent } from "./VisitBeacon";

// The opening of 정 훈도에게 묻기 (2026-10-12): a sheet from the bottom, once per browser, a few seconds in.
// Not for members (they are in already), and never over paying, reading a bought report, the room itself or the
// owner's pages. A sheet, not a full-screen cover: it leaves the page readable behind it.
const QUIET = ["/ask", "/pay", "/admin", "/login", "/r/", "/my"];

export default function OpenNote({ member, gift }: { member: boolean; gift: number }) {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (member || QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
    try {
      if (localStorage.getItem("ao")) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem("ao", "1");
        // The note on the renewal said the same "come and see": one is enough.
        localStorage.setItem("rn", "1");
      } catch {}
      setShow(true);
      trackEvent("ask_pop");
    }, 2500);
    return () => clearTimeout(t);
  }, [member, path]);
  if (!show) return null;
  const close = () => setShow(false);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" role="dialog" aria-label="정 훈도에게 묻기 정식 오픈">
      <div className="jjok-box relative w-full max-w-[420px] animate-rise px-5 pt-5 pb-4 shadow-[0_-8px_30px_rgb(33_27_23/0.25)]">
        <button type="button" onClick={close} aria-label="닫기" className="absolute top-2.5 right-3 px-1 text-lg text-hanji/60">
          ✕
        </button>
        <div className="flex items-center gap-3">
          <span className="block size-14 shrink-0 overflow-hidden rounded-full bg-[#f9f1de] shadow-[0_0_0_2px_#d4af5f]">
            <Image src="/hundo-face.png" alt="" width={112} height={112} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0">
            <p className="font-myeongjo text-[11px] font-bold tracking-[0.25em] text-[#d4af5f]">正式 開門 · 정식 오픈</p>
            <p className="font-myeongjo text-[18px] leading-snug font-extrabold">정 훈도에게 묻기</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed opacity-90">
          그대 사주를 펼쳐 놓고, 고민 하나에 답서를 써 드리옵니다.
          <br />
          카카오로 시작만 하셔도 <b className="text-[#d4af5f]">첫 질문 {gift}개를 드리옵니다.</b>
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={close} className="rounded-xl border border-hanji/25 px-4 py-3 text-sm font-bold text-hanji/80">
            다음에
          </button>
          <AskLink from="pop" onClick={close} className="flex-1 rounded-xl bg-[#FEE500] py-3 text-center text-[15px] font-extrabold text-[#191919]">
            첫 질문 받으러 가기
          </AskLink>
        </div>
      </div>
    </div>
  );
}
