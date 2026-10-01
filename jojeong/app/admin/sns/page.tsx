import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import CopyButton from "@/components/CopyButton";
import { SNS } from "@/lib/snsCalendar";
import { morningPost } from "@/lib/snsMorning";
import { Card } from "../cards/Card";
import CardSaver from "./CardSaver";

export const metadata: Metadata = { title: "SNS", robots: { index: false } };

const DAY = 86400000;
const kst = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);
// Today in Korea, read per request (the page is dynamic: it reads the admin cookie).
const todayKst = () => kst(Date.now());
const shift = (date: string, n: number) => kst(Date.parse(`${date}T00:00:00+09:00`) + n * DAY);
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const label = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d} (${WEEK[new Date(`${date}T12:00:00+09:00`).getUTCDay()]})`;
};
// Preview size: a third of the real card, so a phone shows one and the edge of the next.
const SCALE = 0.3;
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

function Block({ title, time, text, children }: { title: string; time?: string; text?: string; children?: React.ReactNode }) {
  return (
    <section className="doc-paper mt-4 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-myeongjo font-extrabold">
          {title}
          {time && <span className="ml-2 text-[11px] font-normal text-ink-soft">{time}</span>}
        </h2>
        {text && <CopyButton text={text} />}
      </div>
      {text && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/60 px-3 py-3 text-[13px] leading-relaxed">{text}</p>}
      {children}
    </section>
  );
}

// The owner's posting desk: for one day, everything to put up on Instagram and Threads, ready to copy or
// save from a phone. Nothing is posted from here.
export default async function SnsPage({ searchParams }: PageProps<"/admin/sns">) {
  if (!(await isAdmin())) redirect("/admin");
  const today = todayKst();
  const q = String((await searchParams).d ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q) && !Number.isNaN(Date.parse(q)) ? q : today;
  const day = SNS[date];
  const morning = morningPost(date);
  const tabs = [0, 1, 2].map((n) => ({ date: shift(today, n), name: ["오늘", "내일", "모레"][n] }));
  const month = date.slice(0, 7);
  const monthDays = Object.entries(SNS).filter(([d]) => d.startsWith(month));

  return (
    <>
      <section className="mt-6 text-center">
        <p className="text-xs">
          <Link href="/admin" className="text-seal underline">
            ← 관리자
          </Link>
        </p>
        <h1 className="mt-1 font-myeongjo text-2xl font-extrabold">SNS 올릴 것</h1>
        <p className="mt-1 text-[12px] text-ink-soft">복사하고 저장해서 직접 올려요 · 여기서 바로 올라가지는 않아요</p>
      </section>

      <nav className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        {tabs.map((t) => (
          <Link
            key={t.date}
            href={`/admin/sns?d=${t.date}`}
            className={`rounded-xl border px-2 py-2 font-bold ${t.date === date ? "border-seal bg-seal text-white" : "border-seal/30 bg-white/60"}`}
          >
            {t.name}
            <span className="block text-[11px] font-normal">{label(t.date)}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-2 flex justify-between text-xs">
        <Link href={`/admin/sns?d=${shift(date, -1)}`} className="text-seal">
          ◀ {label(shift(date, -1))}
        </Link>
        <b>{label(date)}</b>
        <Link href={`/admin/sns?d=${shift(date, 1)}`} className="text-seal">
          {label(shift(date, 1))} ▶
        </Link>
      </div>

      <section className="mt-4 rounded-xl bg-seal/10 px-4 py-3">
        <p className="text-[11px] font-bold text-seal">이날의 게시물</p>
        <p className="mt-1 font-myeongjo font-extrabold">{day?.title ?? "아직 정하지 않았어요"}</p>
        {day?.note && <p className="mt-1 text-[12px] text-ink-soft">{day.note}</p>}
      </section>

      <Block title="① 아침 일진 글" time="스레드 · 7:30~8:30" text={morning.text}>
        <p className="mt-2 text-[11px] text-ink-soft">날마다 자동으로 바뀌어요. 날을 좋다·나쁘다로 매기지 않아요.</p>
      </Block>

      <Block title="② 카드" time="인스타 · 점심 무렵">
        {day?.cards ? (
          <div className="mt-3">
            <CardSaver date={date} count={day.cards.length}>
              {day.cards.map((qs, i) => (
                <div key={i} className="relative shrink-0 snap-start overflow-hidden rounded-md border border-seal/20" style={{ width: 1080 * SCALE, height: 1440 * SCALE }}>
                  <div style={{ width: 1080, height: 1440, transform: `scale(${SCALE})`, transformOrigin: "0 0", position: "relative" }}>
                    <Card q={Object.fromEntries(new URLSearchParams(qs))} />
                  </div>
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 text-[11px] font-bold text-white">{i + 1}</span>
                </div>
              ))}
            </CardSaver>
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-ink-soft">아직 카드가 없어요.</p>
        )}
      </Block>

      <Block title="③ 인스타 캡션" text={day?.caption}>
        {!day?.caption && <p className="mt-2 text-[13px] text-ink-soft">아직 캡션이 없어요.</p>}
      </Block>

      <Block title="④ 스레드 연결 글" time="점심 12:00~13:00">
        {day?.threads ? (
          <ol className="mt-3 space-y-2">
            {day.threads.map((t, i) => (
              <li key={i} className="rounded-lg bg-white/60 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-myeongjo font-extrabold text-seal">{CIRCLED[i]}</span>
                  <CopyButton text={t} />
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-[13px] text-ink-soft">아직 연결 글이 없어요.</p>
        )}
      </Block>

      <Block title="⑤ 밤 질문 글" time="21:30~23:00" text={day?.night}>
        {!day?.night && <p className="mt-2 text-[13px] text-ink-soft">아직 없어요.</p>}
      </Block>

      <section className="doc-paper mt-4 px-4 py-4">
        <h2 className="font-myeongjo font-extrabold">{Number(month.slice(5))}월 달력</h2>
        <ul className="mt-2 divide-y divide-seal/10 text-[13px]">
          {monthDays.map(([d, x]) => (
            <li key={d}>
              <Link href={`/admin/sns?d=${d}`} className={`flex gap-2 py-2 ${d === date ? "font-bold text-seal" : ""}`}>
                <span className="w-16 shrink-0 text-ink-soft">{label(d)}</span>
                <span className="flex-1">{x.title}</span>
                <span className="shrink-0">{x.cards && x.caption ? "✅" : "·"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
