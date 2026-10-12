"use client";

import { useState } from "react";
import { keepPng, makePng } from "@/lib/cardExport";

// "답서 이미지로 저장": the letter on the page, drawn into one tall PNG (lib/cardExport.ts) for the guest to keep.
// The picture also carries what was asked (on top) and where it came from (below), which the page shows elsewhere.
export default function SaveLetter({ target, file, question }: { target: string; file: string; question?: string }) {
  const [state, setState] = useState<"idle" | "making" | "done" | "error">("idle");

  async function save() {
    const letter = document.getElementById(target);
    if (!letter) return;
    setState("making");
    // A frame off screen at the letter's width: the question, a copy of the letter, the address. The holder is what
    // sits off screen; the frame itself stays unplaced, or the picture would be drawn at -10000px too.
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-10000px;top:0";
    const frame = document.createElement("div");
    frame.style.cssText = `width:${letter.offsetWidth + 24}px;padding:16px 12px;background:#f4ecdb`;
    holder.appendChild(frame);
    if (question) {
      const q = document.createElement("p");
      q.style.cssText = "margin:0 4px 12px;padding:10px 14px;border-radius:14px;background:#211b17;color:#f4ecdb;font-size:14px;line-height:1.5";
      q.textContent = `여쭌 말 · ${question}`;
      frame.appendChild(q);
    }
    const copy = letter.cloneNode(true) as HTMLElement;
    copy.removeAttribute("id");
    frame.appendChild(copy);
    const site = document.createElement("p");
    site.style.cssText = "margin:12px 0 0;text-align:center;font-size:12px;color:#62564c";
    site.textContent = "정 훈도에게 묻기 · hundosaju.com";
    frame.appendChild(site);
    document.body.appendChild(holder);
    try {
      const png = await makePng(frame, file);
      const kept = await keepPng(png);
      setState(kept === "aborted" ? "idle" : "done");
    } catch {
      setState("error");
    } finally {
      holder.remove();
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={state === "making"}
      className="mt-2 w-full rounded-xl border border-ink/15 bg-white/60 py-2.5 text-[13px] font-bold text-ink-soft disabled:opacity-60"
    >
      {state === "making" ? "답서를 그리는 중…" : state === "done" ? "저장했어요 · 사진첩(다운로드)을 확인해 주세요" : state === "error" ? "저장하지 못했어요 · 다시 눌러 주세요" : "답서 이미지로 저장"}
    </button>
  );
}
