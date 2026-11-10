import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StarChart } from "@/components/StoreHero";
import { EN_NAME_PRICE, EN_READINGS, enReadingById, usd } from "@/lib/en/readings";

export const metadata: Metadata = {
  title: "Hundo, Korean saju from Joseon's royal observatory",
  description: "Your birth chart read the way Joseon's court astrologers read it: your free saju, 2027, love compatibility and a Korean name.",
};

// The English home, laid out like the Korean one (app/HomeV2.tsx): Hundo on the night stage with one button to the
// free reading, the free things two to a row, next year as the season's flagship, then the readings as questions,
// and what saju is, honestly.

const CHIPS: { href: string; hanja: string; label: string }[] = [
  { href: "/en/reading/life", hanja: "命", label: "My saju, free" },
  { href: "/en/reading/year", hanja: "年", label: "My 2027" },
  { href: "/en/reading/love", hanja: "合", label: "Our match" },
  { href: "/en/name", hanja: "名", label: "My Korean name" },
];

const TOPICS: { href: string; hanja: string; name: string; ask: string; price: number }[] = [
  { href: "/en/reading/life", hanja: "命書", name: "Life Reading", ask: "Who am I, and how will my life unfold?", price: enReadingById("life")!.price },
  { href: "/en/reading/year", hanja: "年運", name: "2027 Year Ahead", ask: "What is coming for me in 2027?", price: enReadingById("year")!.price },
  { href: "/en/reading/love", hanja: "宮合", name: "Love Compatibility", ask: "Do we really fit together?", price: enReadingById("love")!.price },
  { href: "/en/name", hanja: "名", name: "Korean Name", ask: "What would my Korean name be?", price: EN_NAME_PRICE },
];

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) => (
  <div className="mt-9 mb-3 px-1">
    <h2 className="font-myeongjo text-[19px] font-extrabold">{children}</h2>
    {sub && <p className="mt-0.5 text-[12px] text-ink-soft">{sub}</p>}
  </div>
);

export default function EnHome() {
  const year = enReadingById("year")!;
  return (
    <div className="tone-night flex flex-col">
      {/* Hundo on the night stage: one button, to the free reading. */}
      <header className="animate-rise relative mt-3 h-[480px] overflow-hidden rounded-3xl bg-[#0f2236] text-[#f7efd9] shadow-[0_10px_30px_rgb(33_27_23/0.22),inset_0_0_0_1px_rgb(212_175_95/0.35)]">
        <Image src="/cards/gwansanggam.webp" alt="" fill priority sizes="440px" className="object-cover object-bottom opacity-80" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0f2236] via-[#0f2236]/70 to-[#0f2236]/10" />
        <StarChart opacity={0.75} />
        <Image
          src="/cards/hundo-scroll.webp"
          alt="Hundo holding a star-chart scroll"
          width={561}
          height={701}
          priority
          className="absolute -right-9 -bottom-7 w-[232px] drop-shadow-[0_8px_18px_rgb(0_0_0/0.35)]"
        />
        <div className="relative px-6 pt-9">
          <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.35em] text-[#e2bc68]">命課學 訓導</p>
          <h1 className="mt-2.5 font-myeongjo text-[38px] leading-[1.1] font-extrabold drop-shadow-[0_2px_6px_rgb(0_0_0/0.35)]">Hundo Saju</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#f3ead0]/85">
            Not words that fit everyone,
            <br />
            <b className="text-[#f7efd9]">words that fit only you</b>
          </p>
          <Link
            href="/en/reading/life"
            className="mt-6 block w-[205px] rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
          >
            Read my saju, free
          </Link>
          <p className="mt-2 w-[205px] text-center text-[11px] text-[#f3ead0]/70">Just your birth date</p>
        </div>
      </header>

      {/* The free things, two to a row. */}
      <nav aria-label="Free" className="mt-4 grid grid-cols-2 gap-2">
        {CHIPS.map((c) => (
          <Link key={c.href} href={c.href} className="card flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold">
            <span className="font-myeongjo text-[13px] text-gold">{c.hanja}</span>
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
            <span className="text-[11px] text-ink-soft">›</span>
          </Link>
        ))}
      </nav>

      {/* In season: 2027 as the flagship, the contents folded after three lines. */}
      <section className="card mt-6 overflow-hidden">
        <div className="bg-jjok px-5 py-2 text-center text-[12px] font-extrabold tracking-wide text-[#e2bc68]">
          2027, the year of the <span className="text-[#f0a39a]">Red Sheep</span> (丁未)
        </div>
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-gold/70 font-myeongjo text-sm font-extrabold text-gold">
              {year.hanja}
            </span>
            <h2 className="font-myeongjo leading-tight font-extrabold">
              <span className="block text-[12px] font-bold tracking-wide text-gold">2027 Year Ahead</span>
              <span className="text-[21px]">What is 2027 bringing you?</span>
            </h2>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{year.tagline}</p>
          <ol className="mt-3 flex flex-col divide-y divide-ink/10 text-[14px]">
            {year.chapters.slice(0, 3).map((item, i) => (
              <li key={item} className="flex gap-2 py-1.5">
                <span className="w-6 shrink-0 font-myeongjo font-extrabold text-gold">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
          <details className="group">
            <summary className="cursor-pointer list-none py-1.5 text-[13px] font-bold text-ink-soft">
              <span className="group-open:hidden">All {year.chapters.length} chapters ▾</span>
              <span className="hidden group-open:inline">Fold ▴</span>
            </summary>
            <ol className="flex flex-col divide-y divide-ink/10 text-[14px]">
              {year.chapters.slice(3).map((item, i) => (
                <li key={item} className="flex gap-2 py-1.5">
                  <span className="w-6 shrink-0 font-myeongjo font-extrabold text-gold">{i + 4}</span>
                  {item}
                </li>
              ))}
            </ol>
          </details>
          <p className="mt-2 text-[12px] text-ink-soft">See your chart free first; the full year opens as a reading.</p>
          <Link
            href="/en/reading/year"
            className="mt-3 block rounded-2xl bg-jjok py-3.5 text-center font-myeongjo text-[17px] font-extrabold text-[#e2bc68] shadow-[0_4px_0_#131a23,inset_0_0_0_1px_rgb(212_175_95/0.45)]"
          >
            Preview my 2027
          </Link>
        </div>
      </section>

      <SectionTitle sub="See it free first; the deeper reading opens per topic">What would you like to know?</SectionTitle>
      <ul className="grid grid-cols-2 gap-2">
        {TOPICS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="jjok-box flex h-full flex-col px-4 pt-4 pb-3.5">
              <span className="font-myeongjo text-xl text-gold">{t.hanja}</span>
              <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold">{t.name}</span>
              <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">{t.ask}</span>
              <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                <span className="text-hanji/60">{usd(t.price)}</span>
                <span className="text-gold">See →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <SectionTitle>What saju is, honestly</SectionTitle>
      <section className="card flex flex-col gap-2 px-5 py-4 text-[14px] leading-relaxed">
        <p>
          Saju (四柱, &ldquo;four pillars&rdquo;) writes the year, month, day and hour of your birth as eight characters from an old
          calendar. The calendar part is astronomy: we work out the solar terms to the minute for your city.
        </p>
        <p>
          Joseon chose its readers of these charts by a state exam, and those who passed served at the royal observatory as
          myeonggwahak hundo. The reading itself is a centuries-old way of interpreting the characters: a lens for reflection,
          not a prediction.
        </p>
        <p className="text-[13px] text-ink-soft">Your birth date is used once to work out your chart and is never stored.</p>
      </section>
      <p className="mt-6 text-center text-[12px] text-ink-soft">{EN_READINGS.length + 1} readings, each with a free preview</p>
    </div>
  );
}
