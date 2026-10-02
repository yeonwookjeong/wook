"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { fontCss } from "@/lib/cardExport";

// The day's cards as real 1080×1440 PNGs, made in the browser from the slides drawn above them (each one a
// [data-card] frame), then handed to the phone's share sheet ("이미지 n개 저장") or downloaded. Fonts are
// inlined by lib/cardExport.ts.

type State = { kind: "idle" } | { kind: "making"; done: number } | { kind: "ready"; files: File[]; urls: string[] } | { kind: "error"; message: string };

export default function CardSaver({ date, count, kind = "card", children }: { date: string; count: number; kind?: "card" | "reel"; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function make() {
    const nodes = [...(box.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [])];
    if (!nodes.length) return;
    setState({ kind: "making", done: 0 });
    try {
      await document.fonts.ready;
      const fontEmbedCSS = await fontCss(nodes);
      const opts = {
        pixelRatio: 1,
        fontEmbedCSS,
        style: { position: "relative", inset: "auto", left: "0", top: "0", zIndex: "auto" },
      };
      // Safari draws the first pass before the inlined images and fonts decode; a throwaway pass first.
      // Each at its own size: 1080×1440 for a card, 1080×1920 for a reel.
      const sized = (n: HTMLElement) => ({ ...opts, width: n.offsetWidth, height: n.offsetHeight });
      await toBlob(nodes[0], sized(nodes[0])).catch(() => null);
      const files: File[] = [];
      for (const [i, n] of nodes.entries()) {
        const blob = await toBlob(n, sized(n));
        if (!blob) throw new Error("이미지를 만들지 못했어요");
        files.push(new File([blob], `hundosaju-${date}${kind === "reel" ? "-reel" : ""}-${i + 1}.png`, { type: "image/png" }));
        setState({ kind: "making", done: i + 1 });
      }
      setState({ kind: "ready", files, urls: files.map((f) => URL.createObjectURL(f)) });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function save(files: File[], urls: string[]) {
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    // No share sheet (a computer): download them one by one.
    for (const [i, url] of urls.entries()) {
      const a = document.createElement("a");
      a.href = url;
      a.download = files[i].name;
      a.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return (
    <div>
      <div ref={box} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {children}
      </div>
      <div className="mt-3">
        {state.kind === "ready" ? (
          <>
            <button type="button" onClick={() => save(state.files, state.urls)} className="w-full rounded-xl bg-seal py-3 text-sm font-bold text-white">
              앨범에 저장 ({state.files.length}장)
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-soft">저장 창이 안 뜨면 아래 이미지를 길게 눌러 하나씩 저장하세요</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {state.urls.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt={`${i + 1}번 카드`} className="w-full rounded border border-seal/20" />
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={make}
            disabled={state.kind === "making"}
            className="w-full rounded-xl border border-seal bg-white/70 py-3 text-sm font-bold text-seal disabled:opacity-60"
          >
            {state.kind === "making" ? `이미지 만드는 중… ${state.done}/${count}` : `${kind === "reel" ? "릴스" : "카드"} 이미지 ${count}장 만들기`}
          </button>
        )}
        {state.kind === "error" && <p className="mt-2 text-center text-xs text-seal">만들지 못했어요: {state.message}</p>}
      </div>
    </div>
  );
}
