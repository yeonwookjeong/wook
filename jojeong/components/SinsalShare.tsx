"use client";

import { useRef, useState } from "react";
import { shortShareAction } from "@/app/actions";
import { keepPng, makePng } from "@/lib/cardExport";
import { trackEvent } from "./VisitBeacon";

// The foot of the 신살 도감: send a friend the book with the cards hidden (they see them once they enter their own
// chart), or keep a card as an image: 4:5 for a feed or chat, 9:16 for a story.
export default function SinsalShare({ name, path, text, cards }: { name: string; path: string; text: string; cards: { feed: React.ReactNode; story: React.ReactNode } }) {
  const [state, setState] = useState<"idle" | "making" | "error" | "copied">("idle");
  const [shown, setShown] = useState<"feed" | "story" | null>(null);
  const [made, setMade] = useState<Partial<Record<"feed" | "story", string>>>({});
  const box = useRef<HTMLDivElement>(null);

  async function send() {
    trackEvent("share_result", "sinsal");
    let short = path;
    try {
      short = (await shortShareAction(path)) ?? path;
    } catch {}
    const url = new URL(short, window.location.origin).toString();
    // One message, the line and the link together: sent apart, a chat app shows two bubbles and no preview.
    const message = `${text}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      window.prompt("이 링크를 복사해 주세요", url);
    }
  }

  async function save(which: "feed" | "story") {
    trackEvent("save_image", "sinsal");
    setShown(which);
    setState("making");
    try {
      // The card has to be on the page to be drawn into an image.
      await new Promise((r) => setTimeout(r, 150));
      const node = box.current?.firstElementChild as HTMLElement | null;
      if (!node) throw new Error("no card");
      const png = await makePng(node, `hundosaju-sinsal-${which}`);
      setMade((m) => ({ ...m, [which]: URL.createObjectURL(png) }));
      setState("idle");
      await keepPng(png);
    } catch {
      setState("error");
    }
  }

  return (
    <section className="doc-paper mt-6 px-5 py-6 text-center">
      <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">傳 達</p>
      <h2 className="mt-1 font-myeongjo text-lg font-extrabold">친구 사주로 빈칸 채우기</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        친구에게는 {name}님의 카드가 가려진 채로 가요. 친구가 자기 생일을 넣으면 두 사람 카드가 함께 열리고, 합친 도감이 나와요.
      </p>
      <button
        type="button"
        onClick={send}
        className="mt-4 w-full rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14] transition active:translate-y-1 active:shadow-[0_2px_0_#7d1a14]"
      >
        {state === "copied" ? "링크를 복사했어요" : "친구에게 보내기"}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["feed", "story"] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => save(w)}
            disabled={state === "making"}
            className="rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[14px] font-extrabold text-seal disabled:opacity-60"
          >
            {w === "feed" ? "카드 저장 · 피드" : "카드 저장 · 스토리"}
          </button>
        ))}
      </div>
      {state === "making" && <p className="mt-2 text-xs text-ink-soft">카드를 만드는 중…</p>}
      {state === "error" && <p className="mt-2 text-xs text-seal">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
      <p className="mt-3 text-[11px] text-ink-soft/80">생년월일은 담기지 않아요. 보낸 링크는 1년간 열려요.</p>
      {shown && made[shown] ? (
        <div className="mt-4">
          <p className="text-[12px] leading-relaxed text-ink-soft">사진첩(다운로드)에 저장했어요. 저장이 안 됐다면 아래 이미지를 길게 눌러 저장해 주세요.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={made[shown]} alt="내 신살 카드" className="mx-auto mt-2 w-full max-w-[320px] rounded-2xl" />
        </div>
      ) : (
        shown && (
          <div ref={box} className="mx-auto mt-4 w-full max-w-[320px] text-left">
            {cards[shown]}
          </div>
        )
      )}
    </section>
  );
}
