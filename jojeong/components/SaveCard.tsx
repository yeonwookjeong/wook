"use client";

import { useRef, useState } from "react";
import { keepPng, makePng } from "@/lib/cardExport";
import { trackEvent } from "./VisitBeacon";

// The reader's own result as a card to look at, and the two ways to pass it on: "카드 저장" (a 1080px-wide PNG
// made in the browser, handed to the phone's share sheet for the album or a story, or downloaded on a computer)
// and "친구에게 보내기" (the link to the page the friend starts from, with a line to go with it). The card and the
// text carry the result only, never a birth date. Each tap is counted for the page it came from (lib/stats.ts).
export default function SaveCard({
  file,
  from,
  path,
  text,
  children,
}: {
  file: string;
  from: string;
  // Where a friend starts (a free page that asks for their own birth date), and the line sent with it.
  path: string;
  text: string;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "making" | "error" | "copied">("idle");

  async function save() {
    const node = box.current?.firstElementChild as HTMLElement | null;
    if (!node) return;
    trackEvent("save_image", from);
    setState("making");
    try {
      const png = await makePng(node, file);
      setState("idle");
      await keepPng(png);
    } catch {
      setState("error");
    }
  }

  async function send() {
    trackEvent("share_result", from);
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      window.prompt("이 링크를 복사해 주세요", url);
    }
  }

  return (
    <div>
      <div ref={box}>{children}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={save}
          disabled={state === "making"}
          className="rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[15px] font-extrabold text-seal disabled:opacity-60"
        >
          {state === "making" ? "만드는 중…" : "카드 저장 · 스토리"}
        </button>
        <button type="button" onClick={send} className="rounded-2xl bg-seal py-3 font-myeongjo text-[15px] font-extrabold text-hanji shadow-[0_4px_0_#7d1a14] active:translate-y-0.5 active:shadow-[0_2px_0_#7d1a14]">
          {state === "copied" ? "링크를 복사했어요" : "친구에게 보내기"}
        </button>
      </div>
      {state === "error" && <p className="mt-1 text-center text-xs text-seal">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
    </div>
  );
}
