"use client";

import { useState } from "react";
import type { Month } from "@/lib/month";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MARK_LABEL = { "◎": "좋은 날", "○": "무난한 날", "△": "조심할 날" } as const;

// The month grid and the day under the finger. Scores stay off the grid (a 51 △ next to a 53 ○ reads as an error):
// a day's number shows only when it is opened.
export default function CalendarView({ month: m }: { month: Month }) {
  const [sel, setSel] = useState(() => m.days.find((d) => d.today)?.date ?? 1);
  const day = m.days[sel - 1];
  const lead = m.days[0].dow;
  const dayName = (d: number) => `${m.month}월 ${d}일 ${DOW[m.days[d - 1].dow]}요일`;

  return (
    <>
      {m.top ? (
        <button
          type="button"
          onClick={() => setSel(m.top!.date)}
          className="mt-5 block w-full rounded-2xl bg-jjok px-5 py-5 text-left text-hanji"
        >
          <span className="block text-[13px] font-bold text-[#d9b465]">이번 달 남은 날 중 최고의 날</span>
          <span className="mt-1 block font-myeongjo text-[24px] font-extrabold">{m.top.today ? `오늘, ${dayName(m.top.date)}` : dayName(m.top.date)}</span>
          <span className="mt-1 block text-[14px] leading-relaxed text-hanji/85">{m.top.personal}</span>
        </button>
      ) : (
        <div className="mt-5 rounded-2xl bg-jjok px-5 py-5 text-hanji">
          <p className="text-[13px] font-bold text-[#d9b465]">이번 달 남은 날</p>
          <p className="mt-1 text-[15px] leading-relaxed">남은 날은 쉬어 가며 정리하기 좋은 때예요. 다음 달 달력은 1일에 열려요.</p>
        </div>
      )}

      <div className="doc-paper mt-5 px-3 py-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-ink-soft">
          {DOW.map((w, i) => (
            <div key={w} className={`pb-2 pt-1 ${i === 0 ? "text-seal" : ""}`}>
              {w}
            </div>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => (
            <li key={`b${i}`} aria-hidden />
          ))}
          {m.days.map((d) => {
            const top = m.top?.date === d.date;
            const tone = top ? "bg-seal text-white" : d.mark === "◎" ? "bg-[#f6dcd6]" : d.mark === "△" ? "bg-[#ebe6dc]" : "";
            const markTone = top ? "text-white" : d.mark === "◎" ? "text-seal font-bold" : d.mark === "△" ? "text-ink-soft" : "text-[#9a8d78]";
            return (
              <li key={d.date}>
                <button
                  type="button"
                  onClick={() => setSel(d.date)}
                  aria-label={`${dayName(d.date)}, ${MARK_LABEL[d.mark]}`}
                  aria-pressed={sel === d.date}
                  className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg ${tone} ${d.past ? "opacity-50" : ""} ${
                    sel === d.date ? "outline outline-2 -outline-offset-2 outline-ink" : ""
                  }`}
                >
                  <span className="text-[15px] font-medium leading-none">{d.date}</span>
                  <span className={`text-[14px] leading-none ${markTone}`}>{d.mark}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-3 flex justify-center gap-4 text-[13px] text-ink-soft">
        <span>
          <b className="text-seal">◎</b> 좋은 날
        </span>
        <span>○ 무난한 날</span>
        <span>△ 조심할 날</span>
      </p>
      <p className="mt-1 text-center text-[14px] text-ink-soft">
        {m.month}월은 좋은 날 {m.good}일, 조심할 날 {m.hard}일이에요
      </p>

      <section className="mt-4 rounded-2xl border border-hanji-deep bg-[#fffaf0] px-5 py-5" aria-live="polite">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-myeongjo text-[19px] font-extrabold">
            {dayName(day.date)}
            {day.today ? ", 오늘" : ""}
          </h2>
          <span className="text-[13px] text-ink-soft">{day.gz}</span>
        </div>
        <p className="mt-2 flex items-baseline gap-1.5">
          <b className="font-myeongjo text-[36px] font-extrabold leading-none">{day.score}</b>
          <span className="text-[14px] text-ink-soft">
            점, {day.mark} {MARK_LABEL[day.mark]}
          </span>
        </p>
        <dl className="mt-3 text-[14px]">
          <Row k="한 줄">{day.personal}</Row>
          {day.best && <Row k="잘 풀리는">{day.best}</Row>}
          {day.hour && <Row k="좋은 시간">{day.hour}</Row>}
          {day.avoid && <Row k="피할 것">{day.avoid}</Row>}
        </dl>
        {day.hour && <p className="mt-1 text-[12px] text-ink-soft">좋은 시간은 태어난 시각과 상관없이 그날 기운으로 골랐어요</p>}
        {day.hundo && <p className="mt-3 font-myeongjo text-[15px] leading-relaxed text-gold">&ldquo;{day.hundo}&rdquo;</p>}
      </section>

      {m.days.some((d) => d.mark === "◎" && !d.past) && (
        <>
          <a
            href="/calendar/ics"
            className="mt-5 flex h-[52px] items-center justify-center rounded-[10px] bg-seal text-[16px] font-bold text-white"
          >
            남은 좋은 날 {m.days.filter((d) => d.mark === "◎" && !d.past).length}일, 내 휴대폰 달력에 넣기
          </a>
          <p className="mt-2 text-center text-[13px] text-ink-soft">날짜와 한 줄만 들어가요. 생일은 저장하지 않아요</p>
        </>
      )}
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-hanji-deep py-2.5">
      <dt className="w-16 flex-none text-ink-soft">{k}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  );
}
