"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CARRY_KEY } from "./AskForms";
import { GOLD_BUTTON } from "./Hall";
import { WORRIES } from "@/lib/worries";

// 고민부터 적고, 보낼 때 로그인 (2026-11-06 대표님 시안 지시): a guest writes the worry first, a chip fills a
// worry in to start from, and only the send asks for signing in. What is written waits in this browser
// (CARRY_KEY) and is in the question box when the room opens. Nothing is sent before signing in.
export default function WorryStart({ loginHref, label, gift }: { loginHref: string; label: string; gift: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    try {
      // A worry card (components/WorryCards.tsx) brings its question in the address.
      const url = new URL(window.location.href);
      const d = url.searchParams.get("draft")?.trim();
      if (d) {
        localStorage.setItem(CARRY_KEY, d.slice(0, 300));
        url.searchParams.delete("draft");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      const kept = localStorage.getItem(CARRY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage
      if (kept) setText(kept);
    } catch {}
  }, []);
  const send = () => {
    const t = text.trim();
    if (t.length < 5) {
      setMissing(true);
      return;
    }
    try {
      localStorage.setItem(CARRY_KEY, t.slice(0, 300));
    } catch {}
    router.push(loginHref);
  };
  return (
    <div className="mt-5">
      <div className="flex flex-wrap justify-center gap-1.5">
        {WORRIES.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => {
              setText(w.draft);
              setMissing(false);
            }}
            className="rounded-full border border-[#e2bc68]/40 bg-[#e2bc68]/10 px-3 py-1 text-[12.5px] text-hanji"
          >
            {w.title}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">고민 적기</span>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, 300));
            setMissing(false);
          }}
          rows={4}
          placeholder="무슨 일인지, 누구와, 언제까지 정해야 하는지 편하게 적어 주세요"
          className="w-full resize-none rounded-xl bg-[#fbf6ea] px-3.5 py-3 text-[14.5px] leading-relaxed text-ink placeholder:text-ink-soft/70"
        />
      </label>
      <p className="mt-0.5 text-right text-[11px] text-hanji/50">{text.length}/300</p>
      {missing && (
        <p role="alert" className="mt-1 text-center text-[12.5px] text-[#f0a08f]">
          고민을 한 줄만 더 적어 주세요
        </p>
      )}
      <button type="button" onClick={send} className={`mt-2 ${GOLD_BUTTON}`}>
        {label}
      </button>
      <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-hanji/60">
        보낼 때 로그인만 한 번 해요. 처음이면 질문 {gift}개를 드려요.
        <br />
        적은 고민은 로그인 뒤 질문 칸에 그대로 있어요.
      </p>
    </div>
  );
}
