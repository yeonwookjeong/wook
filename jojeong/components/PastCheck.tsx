"use client";

import { useState } from "react";
import type { PastHit } from "@/lib/pastHits";
import { trackEvent } from "./VisitBeacon";

// A small game at the top of the free reading: the chart guesses a few of the reader's own past years, and the
// reader answers. Each answer opens why that year was marked; a "no" is taken as plainly as a "yes" (other parts
// of a chart can hold a year steady). The answers are counted, nothing else is kept (lib/stats.ts past_yes/no).
export default function PastCheck({ name, hits }: { name: string; hits: PastHit[] }) {
  const [said, setSaid] = useState<Record<number, "yes" | "no">>({});
  const yes = Object.values(said).filter((v) => v === "yes").length;
  const done = Object.keys(said).length === hits.length;
  function answer(year: number, v: "yes" | "no") {
    if (said[year]) return;
    setSaid((s) => ({ ...s, [year]: v }));
    trackEvent(v === "yes" ? "past_yes" : "past_no");
  }
  return (
    <section className="doc-paper mt-4 px-5 py-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">往 事</p>
      <h2 className="mt-1 text-center font-myeongjo text-xl font-extrabold">{name}님의 지나온 해, 맞혀 볼까요?</h2>
      <p className="mt-1 text-center text-[12.5px] text-ink-soft">사주에 크게 표시된 해예요. 맞는지 눌러 주세요.</p>
      <ol className="mt-4 flex flex-col gap-2.5">
        {hits.map((h) => (
          <li key={h.year} className="rounded-xl border border-seal/15 bg-white/60 px-3.5 py-3">
            <p className="text-[14px] leading-snug">
              <b className="font-myeongjo text-seal">{h.year}년</b> 무렵, {h.ask}
            </p>
            {said[h.year] ? (
              <p className="mt-2 rounded-lg bg-seal/8 px-2.5 py-2 text-[12.5px] leading-relaxed">
                <b>{said[h.year] === "yes" ? "역시 그랬군요." : "그럴 수 있어요."}</b> {h.why}
                {said[h.year] === "no" && " 다른 칸이 받쳐 주면 조용히 지나가기도 해요."}
              </p>
            ) : (
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => answer(h.year, "yes")} className="flex-1 rounded-lg bg-seal py-2 text-[13px] font-bold text-hanji">
                  맞아요
                </button>
                <button type="button" onClick={() => answer(h.year, "no")} className="flex-1 rounded-lg border border-ink/20 py-2 text-[13px] font-bold">
                  아니에요
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      {done && (
        <p className="mt-3 text-center text-[13px] font-bold">
          {hits.length}개 중 {yes}개 맞았어요. {yes >= 2 ? "앞으로 올 해도 아래에서 이어서 볼 수 있어요." : "아래 흐름에서 다른 해도 확인해 보세요."}
        </p>
      )}
    </section>
  );
}
