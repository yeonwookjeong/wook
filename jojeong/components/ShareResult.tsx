"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { fontCss } from "@/lib/cardExport";
import { trackEvent } from "./VisitBeacon";

// The foot of a free result, once it has been read: send the whole result to a friend (a link that opens it as the
// reader saw it, and asks the friend for their own), or keep a card of it as an image for a story. Each tap is
// counted for the page it came from (lib/stats.ts).
export default function ShareResult({
  name,
  file,
  from,
  path,
  text,
  card,
}: {
  name: string;
  file: string;
  from: string;
  path: string;
  text: string;
  // The card of the result, drawn only once it is asked for.
  card: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [showCard, setShowCard] = useState(false);
  const [state, setState] = useState<"idle" | "making" | "error" | "copied">("idle");

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

  async function save() {
    trackEvent("save_image", from);
    setShowCard(true);
    setState("making");
    try {
      // The card has to be on the page to be drawn into an image.
      await new Promise((r) => setTimeout(r, 120));
      const node = box.current?.firstElementChild as HTMLElement | null;
      if (!node) throw new Error("no card");
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
    <section className="doc-paper mt-6 px-5 py-6 text-center">
      <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">傳 達</p>
      <h2 className="mt-1 font-myeongjo text-lg font-extrabold">다 읽으셨나요? 친구에게 보내 보세요</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        친구가 링크를 열면 {name}님의 무료 결과를 그대로 보고, 자기 생년월일을 넣어 자기 결과도 바로 볼 수 있어요.
      </p>
      <button
        type="button"
        onClick={send}
        className="mt-4 w-full rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14] transition active:translate-y-1 active:shadow-[0_2px_0_#7d1a14]"
      >
        {state === "copied" ? "링크를 복사했어요" : "친구에게 보내기"}
      </button>
      <button
        type="button"
        onClick={save}
        disabled={state === "making"}
        className="mt-3 w-full rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[15px] font-extrabold text-seal disabled:opacity-60"
      >
        {state === "making" ? "카드를 만드는 중…" : "카드 이미지로 저장 · 스토리"}
      </button>
      {state === "error" && <p className="mt-2 text-xs text-seal">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft/80">
        링크에는 이름과 사주 글자, 출생연도가 담겨요. 생년월일은 담기지 않아요.
      </p>
      {showCard && (
        <div ref={box} className="mt-4 text-left">
          {card}
        </div>
      )}
    </section>
  );
}
