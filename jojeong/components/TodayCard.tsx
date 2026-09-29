"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import Hundo from "./Hundo";
import MeForm from "./MeForm";
import type { Today } from "@/lib/today";

const RATING = [
  { label: "대비", className: "bg-ink/10 text-ink" },
  { label: "무난", className: "bg-gold/20 text-gold" },
  { label: "좋음", className: "bg-seal text-hanji" },
] as const;

const Stars = ({ n }: { n: number }) => (
  <span className="text-[12px] tracking-wider text-gold" aria-label={`별 ${n}개`}>
    {"★".repeat(n) + "☆".repeat(5 - n)}
  </span>
);

// 오늘의 운세, at the top of the main page. Free, and opened with a tap: a small daily ritual rather than a
// line that is simply there. Opened once, it stays open for the rest of the day in this browser. Without a
// saved chart it shows the day and its top three day pillars, and the tap asks for a chart (MeForm), then
// comes back here already open. Each area points to the report that reads it for the whole chart.
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
      return window.location.hash === "#today" && today.score !== null;
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
    <section id="today" className="doc-paper mt-5 scroll-mt-4 px-5 py-5">
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
            {name ? `${name}님, 오늘은 몇 점일까요?` : "오늘, 나한테는 몇 점짜리 날일까요?"}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">오늘의 점수 · 재물·일·연애·건강 별점 · 좋은 시간 · 이번 주 흐름</p>
          {!name && (
            <div className="mt-3 rounded-xl border border-seal/15 bg-white/50 px-3 py-2.5">
              <p className="text-[11px] font-bold text-ink-soft">오늘 기운이 좋은 일주 TOP 3</p>
              <ol className="mt-1.5 flex justify-between gap-1">
                {today.top.map((t, i) => (
                  <li key={t.hanja} className="flex flex-1 flex-col items-center">
                    <span className="font-myeongjo text-xl text-seal">{t.hanja}</span>
                    <span className="text-[11px]">
                      <b className="text-gold">{i + 1}위</b> {t.name}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {name ? (
            <button
              type="button"
              onClick={reveal}
              className="mt-4 w-full rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji shadow-[0_5px_0_#7d1a14]"
            >
              오늘 내 운세 열기
            </button>
          ) : (
            <details className="group mt-4">
              <summary className="block w-full cursor-pointer list-none rounded-2xl bg-seal py-3.5 text-center font-myeongjo font-extrabold text-hanji shadow-[0_5px_0_#7d1a14] group-open:hidden [&::-webkit-details-marker]:hidden">
                내 일주는 오늘 몇 위? 무료로 보기
              </summary>
              <p className="mb-4 text-center text-sm text-ink-soft">한 번만 넣어 두면 매일 바로 볼 수 있어요</p>
              <MeForm next="/#today" submit="오늘 내 운 보기" />
            </details>
          )}
        </>
      ) : today.score === null ? (
        // A chart saved before the month pillar was kept: the day for everyone, and a way to add the rest.
        <div className="animate-rise">
          <p className="mt-3 font-myeongjo text-lg leading-snug font-extrabold">{today.image}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{today.advice}</p>
          <details className="group mt-4">
            <summary className="block cursor-pointer list-none text-center text-[13px] font-bold text-seal underline group-open:hidden [&::-webkit-details-marker]:hidden">
              생년월일을 한 번 더 넣으면 점수와 별점까지 보여 드려요
            </summary>
            <MeForm next="/#today" submit="오늘 내 운 보기" />
          </details>
        </div>
      ) : (
        <div className="animate-rise">
          <div className="mt-3 flex items-center gap-4">
            <p className="flex shrink-0 flex-col items-center">
              <span className={`font-myeongjo text-5xl leading-none font-extrabold ${today.rating === 0 ? "text-ink" : "text-seal"}`}>{today.score}</span>
              <span className="mt-1 text-[11px] text-ink-soft">/ 100점</span>
            </p>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                {rating && <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-extrabold ${rating.className}`}>{rating.label}</span>}
                <span className="font-myeongjo leading-snug font-extrabold">{today.image}</span>
              </p>
              {/* The rank is something to show off, so only a high one is shown; otherwise the day's best area. */}
              {today.rank !== null && today.rank <= 20 ? (
                <p className="mt-1 text-[12px] leading-snug text-ink-soft">
                  {today.ilju}, 60일주 중 오늘 <b className="text-seal">{today.rank}위!</b>
                </p>
              ) : (
                today.best && (
                  <p className="mt-1 text-[12px] leading-snug text-ink-soft">
                    오늘의 무기 <b className="text-ink">{today.best.label}</b> <Stars n={today.best.stars} />
                  </p>
                )
              )}
            </div>
          </div>

          {today.personal && (
            <p className="mt-3 rounded-xl bg-seal/8 px-3 py-2 text-[14px] leading-relaxed">
              <b className="text-seal">{name}님에게는</b> {today.personal}
            </p>
          )}
          {today.watch && (
            <ul className="mt-2 flex flex-col gap-1 rounded-xl border border-seal/15 bg-white/50 px-3 py-2.5 text-[13px] leading-snug">
              <li>
                <b className="text-seal">피할 것</b> {today.watch.avoid}
              </li>
              <li>
                <b className="text-jade">이렇게</b> {today.watch.prep}
              </li>
              <li className="text-ink-soft">
                <b className="text-gold">좋은 점</b> {today.watch.bright}
              </li>
              {today.watch.next && <li className="mt-1 border-t border-seal/10 pt-1.5 font-bold">큰 일은 {today.watch.next}로 미뤄 보세요 ◎</li>}
            </ul>
          )}
          {/* On a hard day the general line (read for everyone) would pull against the advice above. */}
          {!today.watch && (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              <b>하루 전체로는</b> {today.advice}
            </p>
          )}

          {today.areas && (
            <ul className="mt-4 flex flex-col divide-y divide-seal/10 border-y border-seal/15">
              {today.areas.map((a) => (
                <li key={a.key} className="flex items-center gap-3 py-2">
                  <b className="w-8 shrink-0 font-myeongjo">{a.label}</b>
                  <span className="min-w-0 flex-1">
                    <Stars n={a.stars} />
                    <span className="block text-[12.5px] leading-snug">{a.line}</span>
                  </span>
                  {a.href && (
                    <Link href={a.href} className="shrink-0 text-[11px] font-bold text-seal">
                      {a.more} →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}

          {today.hour && today.lucky && (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
              {[
                ["좋은 시간", today.hour.label],
                ["행운의 색", today.lucky.color],
                ["좋은 방향", today.lucky.direction],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-seal/15 bg-white/50 px-1.5 py-2">
                  <dt className="text-[10px] text-ink-soft">{k}</dt>
                  <dd className="mt-0.5 font-bold leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {today.hour && <p className="mt-1 text-center text-[11px] text-ink-soft">{today.hour.why}이에요</p>}

          {today.week && (
            <div className="mt-4">
              <p className="text-[11px] font-bold text-ink-soft">이번 주 흐름</p>
              <ol className="mt-1.5 grid grid-cols-7 gap-1 text-center">
                {today.week.map((w) => (
                  <li key={w.day} className={`rounded-lg py-1.5 ${w.today ? "bg-seal text-hanji" : "bg-white/50"}`}>
                    <span className={`block text-[10px] ${w.today ? "" : "text-ink-soft"}`}>
                      {w.day} {w.date}
                    </span>
                    <span className={`block font-bold ${w.today ? "" : w.mark === "◎" ? "text-seal" : w.mark === "△" ? "text-ink-soft" : "text-gold"}`}>
                      {w.mark}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-right text-[10px] text-ink-soft">◎ 좋음 · ○ 무난 · △ 대비</p>
            </div>
          )}

          {today.hundo && (
            <div className="mt-4">
              <Hundo>{today.hundo}</Hundo>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-ink-soft">
            하루는 일진으로, 한 해는{" "}
            <Link href="/reports/yeonun" className="font-bold text-seal underline">
              연운
            </Link>
            으로 봐요 · 내일 또 새로운 운세가 열려요
          </p>
        </div>
      )}
    </section>
  );
}
