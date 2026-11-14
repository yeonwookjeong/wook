import type { Person } from "./pairToken";
import { todayFor } from "./today";

// 내 운세 달력 (app/calendar): the reader's current month, day by day, from the same engine as 오늘의 운세, so a day
// reads the same on the home card and here. Only this month is shown (2026-11-14 대표님); the coming year is the
// 신년운세.

export type MonthDay = {
  date: number;
  dow: number; // 0 = Sunday
  gz: string;
  mark: "◎" | "○" | "△";
  score: number;
  today: boolean;
  past: boolean;
  personal: string;
  best: string | null;
  hour: string | null;
  avoid: string | null;
  hundo: string | null;
};

export type Month = {
  year: number;
  month: number;
  days: MonthDay[];
  // The best day still ahead (today included), the earliest of equals; only a ◎ day is called the best, so near
  // the month's end it may be null (a middling day named "최고의 날" reads as a broken promise).
  top: MonthDay | null;
  good: number;
  hard: number;
};

const KST = 9 * 3600_000;

export function monthFor(me: Person, now = new Date()): Month {
  const kst = new Date(now.getTime() + KST);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const todayDate = kst.getUTCDate();
  const n = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: MonthDay[] = [];
  for (let date = 1; date <= n; date++) {
    // Noon KST of that day.
    const t = todayFor(me, new Date(Date.UTC(year, month - 1, date, 3)));
    const mark = t.week?.find((w) => w.today)?.mark ?? "○";
    days.push({
      date,
      dow: new Date(Date.UTC(year, month - 1, date)).getUTCDay(),
      gz: t.gz,
      mark,
      score: t.score ?? 0,
      today: date === todayDate,
      past: date < todayDate,
      personal: t.personal ?? "",
      best: t.best?.label ?? null,
      hour: t.hour?.label.replace(/\(.+\)$/, "") ?? null,
      avoid: t.watch?.avoid ?? null,
      hundo: t.hundo,
    });
  }
  const ahead = days.filter((d) => !d.past);
  const top = ahead.reduce<MonthDay | null>((a, d) => (!a || d.score > a.score ? d : a), null);
  return {
    year,
    month,
    days,
    top: top && top.mark === "◎" ? top : null,
    good: days.filter((d) => d.mark === "◎").length,
    hard: days.filter((d) => d.mark === "△").length,
  };
}

// The month's ◎ days still ahead as an iCalendar file for the phone's own calendar: the date and one line each,
// nothing of the chart and no birth date.
export function goodDaysIcs(m: Month, stamp = new Date()): string {
  const pad = (v: number) => String(v).padStart(2, "0");
  const ymd = (d: number) => `${m.year}${pad(m.month)}${pad(d)}`;
  const next = (d: number) => {
    const t = new Date(Date.UTC(m.year, m.month - 1, d + 1));
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
  };
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  // RFC 5545: escape commas, semicolons and backslashes in text; fold is not needed for these short lines.
  const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const events = m.days
    .filter((d) => d.mark === "◎" && !d.past)
    .map((d) =>
      [
        "BEGIN:VEVENT",
        `UID:hundo-${ymd(d.date)}@hundosaju.com`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${ymd(d.date)}`,
        `DTEND;VALUE=DATE:${next(d.date)}`,
        `SUMMARY:${esc("◎ 훈도사주 좋은 날")}`,
        `DESCRIPTION:${esc(`${d.personal}${d.hour ? `\n좋은 시간: ${d.hour}` : ""}\nhttps://www.hundosaju.com/calendar`)}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ].join("\r\n"),
    );
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//hundosaju//calendar//KO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...events, "END:VCALENDAR", ""].join("\r\n");
}
