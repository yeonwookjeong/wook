"use client";

import { useState } from "react";

// Above a bought report: its permanent link, to keep or open on another device.
export default function OrderLink({
  id,
  others = [],
}: {
  id: string;
  others?: { href: string; title: string }[];
}) {
  const [copied, setCopied] = useState(false);
  const path = `/r/${id}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-[13px]">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 leading-snug">
          <b className="block text-gold">결제한 보고서예요</b>
          <span className="text-ink-soft">
            이 링크로 다른 기기에서도 다시 볼 수 있어요
          </span>
        </p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-hanji"
        >
          {copied ? "복사했어요" : "링크 복사"}
        </button>
      </div>
      {others.length > 0 && (
        <p className="mt-2 border-t border-gold/30 pt-2 text-[12px]">
          <span className="text-ink-soft">세트의 다른 보고서 </span>
          {others.map((o) => (
            <a
              key={o.href}
              href={o.href}
              className="mr-2 font-bold text-seal underline"
            >
              {o.title}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
