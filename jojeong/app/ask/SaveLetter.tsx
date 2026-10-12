"use client";

import { useState } from "react";
import { keepPng, makePng } from "@/lib/cardExport";

// "답서 이미지로 저장": the whole letter on the page, drawn into one tall PNG (lib/cardExport.ts) for the guest to keep.
export default function SaveLetter({ target, file }: { target: string; file: string }) {
  const [state, setState] = useState<"idle" | "making" | "done" | "error">("idle");

  async function save() {
    const node = document.getElementById(target);
    if (!node) return;
    setState("making");
    try {
      const png = await makePng(node, file);
      const kept = await keepPng(png);
      setState(kept === "aborted" ? "idle" : "done");
    } catch {
      setState("error");
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
