"use client";

import Link from "next/link";
import { useEffect } from "react";

// What a reader sees when a page breaks, in place of the framework's English screen: try again, or tell us with
// the page and the error number filled in (the contact form adds the device and, if any, the orders itself).
// A browser-side error is sent to the owner's error list once; a server one is already there (instrumentation.ts).
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  useEffect(() => {
    if (error.digest) return;
    fetch("/api/err", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, message: `${error.name}: ${error.message}` }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);
  const code = error.digest ?? "화면 오류";
  const report = `/contact?topic=${encodeURIComponent("오류 신고")}&page=${encodeURIComponent(path)}&code=${encodeURIComponent(code)}`;
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-[440px] flex-col items-center justify-center px-6 py-10 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">訓 導</p>
      <h1 className="mt-3 font-myeongjo text-2xl font-extrabold">잠시 문제가 생겼어요</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        저희 쪽 문제예요. 다시 시도해도 같으면 알려 주세요.
        <br />
        어느 화면이었는지는 저절로 함께 보내져요.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 w-full rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji shadow-[0_5px_0_#7d1a14]"
      >
        다시 시도
      </button>
      <Link href={report} className="mt-3 w-full rounded-2xl border border-seal/40 py-3 text-sm font-bold text-seal">
        이 오류 알리기
      </Link>
      <Link href="/" className="mt-4 text-[13px] text-ink-soft underline">
        처음 화면으로
      </Link>
      <p className="mt-6 text-[11px] text-ink-soft/80">오류 번호 {code}</p>
    </div>
  );
}
