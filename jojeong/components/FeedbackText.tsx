"use client";

import { useState } from "react";
import { FEEDBACK_MAX, OPENERS, rewardLength as count } from "@/lib/feedbackLimits";

// The line under a bought report: three openers to start from, and the count toward the question (the server
// counts the same way, lib/feedbackLimits.ts rewardLength).

export default function FeedbackText({ min }: { min: number }) {
  const [text, setText] = useState("");
  const n = count(text);
  return (
    <>
      <div className="flex flex-wrap justify-center gap-1.5">
        {OPENERS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setText((t) => (t.startsWith(o) ? t : `${o}: ${t}`))}
            className="rounded-full border border-ink/20 bg-white/60 px-2.5 py-1 text-[12px]"
          >
            {o}
          </button>
        ))}
      </div>
      <textarea
        name="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={FEEDBACK_MAX}
        rows={3}
        placeholder="예: 2장 돈 이야기가 딱 제 얘기였어요"
        className="mt-2 w-full rounded-xl border border-ink/15 bg-white/70 px-3 py-2 text-[13px]"
      />
      <p className="text-right text-[11px] text-ink-soft">
        <b className={n >= min ? "text-seal" : ""}>{n}</b> / {min}자 이상
      </p>
    </>
  );
}
