"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { fontCss } from "@/lib/cardExport";

// A reader's "카드 저장": the card drawn above the button, made into a 1080px-wide PNG and handed to the phone's
// share sheet (save to photos, post to a story) or downloaded on a computer.
export default function SaveCard({ file, children }: { file: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "making" | "error">("idle");

  async function save() {
    const node = box.current?.firstElementChild as HTMLElement | null;
    if (!node) return;
    setState("making");
    try {
      await document.fonts.ready;
      const opts = { pixelRatio: 1080 / node.offsetWidth, fontEmbedCSS: await fontCss([node]) };
      // Safari draws the first pass before the inlined fonts decode; a throwaway pass first.
      await toBlob(node, opts).catch(() => null);
      const blob = await toBlob(node, opts);
      if (!blob) throw new Error("no image");
      const png = new File([blob], `${file}.png`, { type: "image/png" });
      setState("idle");
      if (navigator.canShare?.({ files: [png] })) {
        try {
          await navigator.share({ files: [png] });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = png.name;
      a.click();
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <div ref={box}>{children}</div>
      <button
        type="button"
        onClick={save}
        disabled={state === "making"}
        className="mt-3 w-full rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[15px] font-extrabold text-seal disabled:opacity-60"
      >
        {state === "making" ? "카드를 만드는 중…" : "내 일주 카드 저장 · 스토리에 올리기"}
      </button>
      {state === "error" && <p className="mt-1 text-center text-xs text-seal">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
    </div>
  );
}
