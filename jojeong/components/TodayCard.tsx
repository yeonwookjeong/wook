"use client";

import { useState, useSyncExternalStore } from "react";
import MeForm from "./MeForm";
import type { Today } from "@/lib/today";

const RATING = [
  { label: "조심", className: "bg-ink/10 text-ink" },
  { label: "무난", className: "bg-gold/20 text-gold" },
  { label: "좋음", className: "bg-seal text-hanji" },
] as const;

// 오늘의 운세, under the hero. Free, and opened with a tap: a small daily ritual rather than a line that is
// simply there. Opened once, it stays open for the rest of the day in this browser. Without a saved chart
// the tap asks for one (MeForm), then comes back here already open.
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export default function TodayCard({ today, name }: { today: Today; name: string | null }) {
  const key = `jj_today_${today.date}`;
  const [clicked, setClicked] = useState(false);
  // Opened earlier today, or just back from entering a chart for this card (/#today): open from the start.
  const seen = useSyncExternalStore(
    subscribe,
    () => {
      try {
        if (localStorage.getItem(key) === "1") return true;
      } catch {}
      return window.location.hash === "#today" && Boolean(today.personal);
    },
    () => false,
  );
  const open = clicked || seen;

  function reveal() {
    setClicked(true);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  }

  const rating = today.rating === null ? null : RATING[today.rating];

  return (
    <section id="today" className="doc-paper mt-3 scroll-mt-4 px-6 py-5">
      <p className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <span className="font-extrabold text-seal">오늘의 운세</span>
          <span className="rounded-full bg-seal/10 px-2 py-0.5 text-[10px] font-extrabold text-seal">무료</span>
        </span>
        <span className="text-ink-soft">
          {today.date} · <b className="font-myeongjo text-ink">{today.gz}</b>
        </span>
      </p>

      {!open ? (
        <>
          <p className="mt-3 font-myeongjo text-lg leading-snug font-extrabold">
            {name ? `${name}님, 오늘은 어떤 날일까요?` : "오늘, 나한테는 어떤 날일까요?"}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">매일 바뀌는 오늘의 기운을 내 사주에 비춰 봐요</p>
          {name ? (
            <button
              type="button"
              onClick={reveal}
              className="mt-4 w-full rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji shadow-[0_5px_0_#7d1a14]"
            >
              무료로 오늘 운세 보기
            </button>
          ) : (
            <details className="group mt-4">
              <summary className="block w-full cursor-pointer list-none rounded-2xl bg-seal py-3.5 text-center font-myeongjo font-extrabold text-hanji shadow-[0_5px_0_#7d1a14] group-open:hidden [&::-webkit-details-marker]:hidden">
                무료로 오늘 운세 보기
              </summary>
              <p className="mb-4 text-center text-sm text-ink-soft">한 번만 넣어 두면 매일 바로 볼 수 있어요</p>
              <MeForm next="/#today" submit="오늘 내 운 보기" />
            </details>
          )}
        </>
      ) : (
        <div className="animate-rise">
          <p className="mt-3 flex items-center gap-2">
            {rating && <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-extrabold ${rating.className}`}>{rating.label}</span>}
            <span className="font-myeongjo text-lg leading-snug font-extrabold">{today.image}</span>
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{today.advice}</p>
          {today.personal && (
            <p className="mt-3 rounded-xl bg-seal/8 px-3 py-2 text-[14px] leading-relaxed">
              <b className="text-seal">{name}님에게는</b> {today.personal}
            </p>
          )}
          {today.lucky && (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
              {[
                ["행운의 색", today.lucky.color],
                ["좋은 방향", today.lucky.direction],
                ["좋은 시간", today.lucky.time],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-seal/15 bg-white/50 px-1.5 py-2">
                  <dt className="text-[10px] text-ink-soft">{k}</dt>
                  <dd className="mt-0.5 font-bold leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-3 text-center text-[11px] text-ink-soft">내일 또 새로운 운세가 열려요</p>
        </div>
      )}
    </section>
  );
}
