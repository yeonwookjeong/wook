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
  const url = () => window.location.origin + path;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  // The phone's share sheet (카카오톡 → 나와의 채팅, 메모, 메일): the surest way to keep the link when the report
  // was bought inside Instagram's or Threads' own browser, whose 내 보고서 the phone's browser never sees.
  async function send() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: "훈도사주 보고서", text: gift ? "선물 받은 훈도사주 보고서 · 이 링크로 언제든 다시 열어요" : "내 훈도사주 보고서 · 이 링크로 언제든 다시 열어요", url: url() });
    } catch {
      // Closed the sheet: nothing to do.
    }
  }
  return (
    <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-4 text-[13px]">
      <p className="leading-snug">
        <b className="block text-gold">{gift ? "선물 받은 보고서예요" : "결제한 보고서예요"}</b>
        <span className="text-ink-soft">
          로그인 없이 <b className="text-ink">이 링크</b>로 어느 기기에서든 다시 열 수 있어요. 지금 한 번 보내 두세요.
        </span>
      </p>
      <p className="mt-2 truncate rounded-lg bg-white/60 px-3 py-2 font-mono text-[12px] text-ink-soft">hundosaju.com{path}</p>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={send} className="rounded-xl bg-ink py-2.5 text-[13px] font-bold text-hanji">
          카톡·메모로 보내 두기
        </button>
        <button type="button" onClick={copy} className="rounded-xl border border-ink/30 bg-white/70 px-4 py-2.5 text-[13px] font-bold">
          {copied ? "복사했어요" : "링크 복사"}
        </button>
      </div>
      {!gift && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
          이 브라우저에서는 맨 위 <b className="text-ink">내 보고서</b>에서도 열려요. 인스타·스레드 안에서 결제하셨다면 꼭 보내 두세요.
        </p>
      )}
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
