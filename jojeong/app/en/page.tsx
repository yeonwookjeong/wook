import type { Metadata } from "next";
import Link from "next/link";
import { EN_NAME_PRICE, EN_READINGS, usd } from "@/lib/en/readings";

export const metadata: Metadata = {
  title: "Hundo, Korean saju from Joseon's royal observatory",
  description: "Your birth chart read the way Joseon's court astrologers read it: a Korean name, your life, 2027, and your love compatibility.",
};

// The English home: who Hundo is, then the four readings. Each opens with a free preview; the full readings open
// when payment does (the buttons say "Opening soon" until then).
const SHELF = [
  { href: "/en/name", title: "Your Korean Name", hanja: "名", price: EN_NAME_PRICE, line: "A Korean name chosen from the eight characters of your birth: Hangul, Hanja, and why each one is yours." },
  ...EN_READINGS.map((r) => ({ href: `/en/reading/${r.id}`, title: r.title, hanja: r.hanja, price: r.price, line: r.tagline })),
];

export default function EnHome() {
  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hundo-bow.png" alt="Hundo" width={112} height={112} className="size-28 rounded-full border-2 border-gold/40 bg-white object-cover" />
        <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-gold">訓導 HUNDO SAJU</p>
        <h1 className="mt-2 font-myeongjo text-[27px] leading-tight font-extrabold">
          Your birth, read the way
          <br />
          Joseon&apos;s court read it
        </h1>
        <p className="mt-3 max-w-[350px] text-[14.5px] leading-relaxed text-ink-soft">
          Korea&apos;s Joseon kingdom chose its fortune-readers by exam. Those who passed served at the royal observatory as
          myeonggwahak hundo: tutors of fate, who read birth charts and chose the days of royal weddings. I am Hundo.
          Give me your birth date, and I will read your saju for you.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-myeongjo text-[19px] font-extrabold">Readings</h2>
        <ul className="flex flex-col gap-3">
          {SHELF.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="doc-paper flex items-start gap-4 px-4 py-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-seal/60 font-myeongjo text-[20px] text-seal">{p.hanja}</span>
                <span className="flex flex-1 flex-col">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-myeongjo text-[17px] font-extrabold">{p.title}</span>
                    <span className="text-[13px] font-bold text-ink-soft">{usd(p.price)}</span>
                  </span>
                  <span className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{p.line}</span>
                  <span className="mt-2 text-[12.5px] font-bold text-seal">Free preview →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 text-[14px] leading-relaxed">
        <h2 className="font-myeongjo text-[19px] font-extrabold">What saju is, honestly</h2>
        <p>
          Saju (四柱, &ldquo;four pillars&rdquo;) writes the year, month, day and hour of your birth as eight characters from an
          old calendar. The calendar part is astronomy: we work out the solar terms to the minute for your city. The reading
          is a centuries-old way of interpreting those characters, a lens for reflection rather than a prediction.
        </p>
        <p className="text-ink-soft">Your birth date is used once to work out your chart and is never stored.</p>
      </section>
    </div>
  );
}
