"use client";

import { useEffect, useState } from "react";
import { CARRY_KEY } from "./AskForms";
import { GOLD_BUTTON } from "./Hall";

// A question brought from a chapter of a bought report (/ask?draft=…): kept in this browser until a room is
// entered, where it waits in the box (app/ask/AskForms.tsx), and shown here so the guest knows it came along.
// `join`: a guest who came with one sees it first of all, as its own box on top with the way to sign up for the
// first question (2026-10-25 대표님 지시); no price there.
export default function DraftCarry({ join }: { join?: { href: string; label: string } }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const d = url.searchParams.get("draft")?.trim();
      if (d) {
        localStorage.setItem(CARRY_KEY, d.slice(0, 300));
        url.searchParams.delete("draft");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the address and this browser's storage
      setText(localStorage.getItem(CARRY_KEY));
    } catch {}
  }, []);
  if (!text) return null;
  if (join)
    return (
      <section className="mt-3 rounded-2xl border border-[#e2bc68]/50 bg-[#1e1813] px-4 pt-4 pb-4 text-hanji shadow-[0_8px_22px_rgb(0_0_0/0.35)]">
        <h1 className="text-center font-myeongjo text-[19px] leading-snug font-extrabold">
          이 장에서 궁금한 것, <span className="text-[#e2bc68]">정 훈도에게</span>
        </h1>
        <p className="mt-3 rounded-xl bg-[#fbf6ea] px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">{text}</p>
        <p className="mt-1.5 text-center text-[11.5px] text-hanji/60">가입하면 이 질문이 질문 칸에 그대로 적혀 있어요. 고쳐서 보내셔도 돼요.</p>
        <a href={join.href} className={`mt-3 ${GOLD_BUTTON}`}>
          {join.label}
        </a>
      </section>
    );
  return (
    <p className="mt-4 rounded-xl border border-[#e2bc68]/40 bg-[#e2bc68]/10 px-3.5 py-2.5 text-left text-[13px] leading-relaxed">
      <b className="block text-[#e2bc68]">가져온 질문</b>
      {text}
      <span className="mt-1 block text-[11.5px] opacity-70">사랑방에 들어가면 질문 칸에 적혀 있어요. 고쳐서 보내셔도 돼요.</span>
    </p>
  );
}
