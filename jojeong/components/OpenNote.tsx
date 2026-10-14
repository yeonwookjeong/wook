"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AskLink from "./AskLink";
import { trackEvent } from "./VisitBeacon";

// The grand opening (lib/members.ts ASK_OPEN, with the new prices and home): one notice, once per browser, a moment
// after arriving. Never over paying, a bought report, the room, the owner's pages, or a reading already on screen:
// on a report's page only while its birth form is still empty-handed (before the result).
const QUIET = ["/ask", "/pay", "/admin", "/login", "/r/", "/my", "/leave", "/logout", "/e/"];
const SEEN = "open1";

// `count`: the charts read during the soft opening (lib/store.ts readingCount), thanked when it means something.
const COUNT_FROM = 100;

export default function OpenNote({ member, gift, count }: { member: boolean; gift: number; count: number }) {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (QUIET.some((q) => path.startsWith(q)) || location.search.includes("order=")) return;
    try {
      if (localStorage.getItem(SEEN)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      // A reading is on screen (no form to fill): not now, maybe on the next page.
      if (path.startsWith("/reports/") && !document.querySelector('input[name="birth"]')) return;
      try {
        localStorage.setItem(SEEN, "1");
        // The earlier notes said part of this: one is enough.
        localStorage.setItem("ao2", "1");
        localStorage.setItem("rn", "1");
      } catch {}
      setShow(true);
      trackEvent("ask_pop");
    }, 1200);
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
  const items: { mark: string; title: string; text: React.ReactNode }[] = [
    {
      mark: "聽心堂",
      title: "정 훈도에게 묻기",
      text: member ? (
        "내 사주를 펼쳐 놓고, 고민 하나에 답서를 써 드려요."
      ) : (
        <>
          내 사주를 펼쳐 놓고, 고민 하나에 답서를 써 드려요. <b className="text-[#e2bc68]">카카오로 로그인하면 첫 질문 {gift}개</b>는 선물이에요.
        </>
      ),
    },
    { mark: "新裝", title: "보고서 새 단장", text: "장마다 그림과 10년 달력, 다 읽고 간직하는 한눈에 카드. 궁합은 두 사람의 10년까지 봐요." },
    { mark: "保管", title: "산 보고서는 계정에", text: "로그인하면 어느 기기에서든 그대로 열려요." },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1118]/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="훈도사주 정식 오픈 안내"
      onClick={close}
    >
      <div
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[400px] animate-rise overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl bg-[#141a22] text-hanji shadow-[0_20px_50px_rgb(0_0_0/0.45),inset_0_0_0_1px_rgb(212_175_95/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[clamp(92px,17dvh,210px)]">
          <Image src="/cards/sarangbang.webp" alt="정 훈도가 사랑방에서 손님을 맞는 모습" fill sizes="400px" className="object-cover object-[50%_32%]" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#141a22]" />
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="absolute top-2.5 right-2.5 size-8 rounded-full bg-[#141a22]/60 text-hanji/90 backdrop-blur-sm"
          >
            ✕
          </button>
        </div>
        <div className="relative -mt-3 px-5 pb-4">
          <p className="text-center font-myeongjo text-[11px] font-bold tracking-[0.3em] text-[#e2bc68]">正式 開門</p>
          <h2 className="mt-1 text-center font-myeongjo text-[20px] leading-snug font-extrabold">훈도사주가 정식으로 문을 열었습니다</h2>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-hanji/85">
            {count >= COUNT_FROM ? (
              <>
                가오픈 동안 사주를 <b className="font-myeongjo text-[15px] text-[#e2bc68]">{count.toLocaleString("ko-KR")}번</b>이나 보러 와 주셨어요.
                <br />
                진심으로 고맙습니다.
              </>
            ) : (
              "가오픈 동안 찾아 주신 모든 분께 진심으로 고맙습니다."
            )}
            <br />
            남겨 주신 이야기를 담아 새 단장을 마쳤어요.
          </p>
          <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#e2bc68]/80">새로 생긴 것</p>
          <ul className="mt-1.5 flex flex-col divide-y divide-[#e2bc68]/15 border-y border-[#e2bc68]/20">
            {items.map((it) => (
              <li key={it.mark} className="flex gap-3 py-2">
                <span className="w-11 shrink-0 pt-0.5 text-center font-myeongjo text-[12px] font-extrabold text-[#e2bc68]">{it.mark}</span>
                <span className="min-w-0 text-[13px] leading-relaxed">
                  <b className="block font-myeongjo text-[14.5px]">{it.title}</b>
                  <span className="text-hanji/80">{it.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <AskLink
            from="pop"
            onClick={close}
            className="mt-3.5 block rounded-2xl bg-[#e2bc68] py-3 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
          >
            {member ? "청심당 둘러보기" : "청심당 가서 첫 질문 받기"}
          </AskLink>
          <div className="mt-3 flex items-center justify-center gap-4 text-[12.5px] text-hanji/60">
            <Link href="/reports" onClick={close} className="underline underline-offset-2">
              새로워진 보고서 보기
            </Link>
            <span aria-hidden>·</span>
            <button type="button" onClick={close}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
