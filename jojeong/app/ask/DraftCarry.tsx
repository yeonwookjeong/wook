"use client";

import { useEffect, useState } from "react";
import { CARRY_KEY } from "./AskForms";

// A question brought from a chapter of a bought report (/ask?draft=…): kept in this browser until a room is
// entered, where it waits in the box (app/ask/AskForms.tsx), and shown here so the guest knows it came along.
export default function DraftCarry() {
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
  return (
    <p className="mt-4 rounded-xl border border-[#e2bc68]/40 bg-[#e2bc68]/10 px-3.5 py-2.5 text-left text-[13px] leading-relaxed">
      <b className="block text-[#e2bc68]">가져온 질문</b>
      {text}
      <span className="mt-1 block text-[11.5px] opacity-70">사랑방에 들어가면 질문 칸에 적혀 있어요. 고쳐서 보내셔도 돼요.</span>
    </p>
  );
}
