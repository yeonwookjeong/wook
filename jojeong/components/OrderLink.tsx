"use client";

import { useState } from "react";

// Above a bought report: its permanent link, to keep or open on another device.
export default function OrderLink({
  id,
  others = [],
  gift = false,
}: {
  id: string;
  gift?: boolean;
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
          <b className="block text-gold">{gift ? "선물 받은 보고서예요" : "결제한 보고서예요"}</b>
          <span className="text-ink-soft">
            {gift ? (
              <>이 링크로 언제든 다시 열 수 있어요. 링크를 복사해 두세요</>
            ) : (
              <>
                나중에는 맨 위 <b className="text-ink">내 보고서</b>에서 바로 열 수 있어요. 다른 기기에서는 이 링크로 열어요
              </>
            )}
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
