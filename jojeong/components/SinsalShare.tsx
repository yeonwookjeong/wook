"use client";

import { useRef, useState } from "react";
import { shortShareAction } from "@/app/actions";
import { keepPng, makePng } from "@/lib/cardExport";
import { trackEvent } from "./VisitBeacon";

// The foot of the 신살 도감: send a friend the link (they get the 도감's first screen, then their own cards and the
// 살 the two share, app/s/[kind]/[token]), or keep a card as an image: 4:5 for a feed or chat, 9:16 for a story.
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
    <section className="mt-5 rounded-2xl border border-[#d4af5f]/30 bg-white/[0.04] px-5 py-6 text-center">
      <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-[#d4af5f]">傳 達</p>
      <h2 className="mt-1 font-myeongjo text-lg font-extrabold">친구에게 보내기</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-hanji/70">
        친구에게는 {name}님 결과 대신 유형 테스트 첫 화면이 가요. 친구가 자기 생일을 넣으면 친구 유형이 나오고, 그 아래에 {name}님과 겹치는 살이 나와요.
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
            className="rounded-2xl border-2 border-[#d4af5f] py-3 font-myeongjo text-[14px] font-extrabold text-[#d4af5f] disabled:opacity-60"
          >
            {w === "feed" ? "카드 저장 · 피드" : "카드 저장 · 스토리"}
          </button>
        ))}
      </div>
      {state === "making" && <p className="mt-2 text-xs text-hanji/70">카드를 만드는 중…</p>}
      {state === "error" && <p className="mt-2 text-xs text-[#f0a39c]">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
      <p className="mt-3 text-[11px] text-hanji/50">생년월일은 담기지 않아요. 보낸 링크는 1년간 열려요.</p>
      {shown && made[shown] ? (
        <div className="mt-4">
          <p className="text-[12px] leading-relaxed text-hanji/70">사진첩(다운로드)에 저장했어요. 저장이 안 됐다면 아래 이미지를 길게 눌러 저장해 주세요.</p>
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
