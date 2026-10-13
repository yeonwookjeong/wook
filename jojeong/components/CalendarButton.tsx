"use client";

import { useState } from "react";
import { trackEvent } from "./VisitBeacon";

// The days a bought report names (택일's best days, the 신년운세's good and careful months), as an .ics file the
// phone's calendar adds in one tap. All-day events, nothing about the person but the names they gave.
export type CalEvent = { date: string; title: string; note?: string };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const day = (iso: string) => iso.replaceAll("-", "");
const next = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

function ics(events: CalEvent[], name: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hundosaju//ko",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(name)}`,
    ...events.flatMap((e, i) => [
      "BEGIN:VEVENT",
      `UID:${day(e.date)}-${i}-${Math.random().toString(36).slice(2, 10)}@hundosaju.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day(e.date)}`,
      `DTEND;VALUE=DATE:${day(next(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${esc(e.note)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function CalendarButton({
  events,
  name,
  file,
  label = "휴대폰 달력에 넣기",
}: {
  events: CalEvent[];
  name: string;
  file: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  if (!events.length) return null;
  const add = () => {
    trackEvent("save_image", "calendar");
    const blob = new Blob([ics(events, name)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setDone(true);
  };
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[15px] font-extrabold text-seal"
      >
        <span aria-hidden>📅</span> {label}
      </button>
      <p className="mt-1 text-center text-[11px] text-ink-soft">
        {done ? "파일을 열면 달력에 들어가요. 안 열리면 내려받은 파일을 눌러 주세요." : `${events.length}개의 날을 달력에 하루 일정으로 넣어 드려요`}
      </p>
    </div>
  );
}
