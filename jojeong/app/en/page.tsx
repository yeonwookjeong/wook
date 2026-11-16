import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EN_FAQ, EN_READINGS, priceLabel } from "@/lib/en/catalog";
import { intlColumns } from "@/lib/intl/columns";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Hundo · Korean saju readings in English" },
  alternates: { canonical: "/en", languages: { ko: "/", en: "/en", ja: "/ja" } },
  description:
    "Saju, the Korean four pillars of destiny, read in plain English by Hundo, a fortune scholar of Joseon's royal observatory. Your life in Joseon, your Korean name, and full readings on love, money, work and the year ahead.",
};

// The English home (2026-11-15): the same shelf as the Korean site, with the newcomer's questions answered first.
export default function EnHome() {
  const free = EN_READINGS.filter((r) => r.free);
  const paid = EN_READINGS.filter((r) => !r.free);
  const guides = intlColumns("en").slice(0, 3);
  return (
    <>
      <section className="-mx-4 mt-4">
        <Image src="/king/hero.webp" alt="Geunjeongjeon, the throne hall of Gyeongbokgung palace, at sunset" width={1080} height={780} priority className="block h-auto w-full" />
      </section>

      <header className="relative -mt-10 rounded-2xl bg-[#0f2236] px-5 pt-5 pb-6 text-hanji shadow-[0_8px_24px_rgb(15_34_54/0.3)]">
        <p className="font-myeongjo text-[12px] font-bold tracking-[0.15em] text-[#d9b465]">SAJU · 四柱 · KOREAN FOUR PILLARS</p>
        <h1 className="mt-2 font-myeongjo text-[28px] leading-tight font-extrabold">Your life, read from the hour you were born</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-hanji/85">
          Koreans have read their lives from the eight characters of their birth for centuries. Hundo, a fortune scholar of Joseon&apos;s royal
          observatory, reads yours in plain English.
        </p>
        <Link href="/en/readings/sinbun" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#d9b465] font-myeongjo text-[16px] font-extrabold text-[#0f2236]">
          Start free: your life in Joseon
        </Link>
      </header>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">How saju works</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {[
            ["Four pillars", "Your birth year, month, day and hour each become two Chinese characters. Eight in all."],
            ["Five elements", "Each character is wood, fire, earth, metal or water. Their balance describes your temperament."],
            ["Timing", "The elements of each year and decade meet your chart, which is how saju reads the timing of a life."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.08)]">
              <span className="font-myeongjo text-[18px] font-extrabold text-seal">{i + 1}</span>
              <p className="text-[15px] leading-relaxed">
                <b className="font-myeongjo">{t}.</b> {d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {guides.length > 0 && (
        <section className="mt-8">
          <h2 className="font-myeongjo text-[22px] font-extrabold">Saju guides</h2>
          <div className="mt-3 flex flex-col gap-3">
            {guides.map((c) => (
              <Link key={c.slug} href={`/en/column/${c.slug}`} className="block rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
                <p className="font-myeongjo text-[17px] leading-snug font-extrabold">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">{c.summary}</p>
              </Link>
            ))}
            <Link href="/en/column" className="text-center text-[14px] font-bold text-seal">
              All guides →
            </Link>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">Start free</h2>
        <div className="mt-3 flex flex-col gap-3">
          {free.map((r) => (
            <Link key={r.id} href={`/en/readings/${r.id}`} className="block rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
              <p className="text-[12px] text-ink-soft">{r.korean}</p>
              <p className="mt-1 font-myeongjo text-[18px] font-extrabold">{r.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{r.tagline}</p>
              <p className="mt-2 text-[14px] font-bold text-seal">Free →</p>
            </Link>
          ))}
          <Link href="/en/name" className="block rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
            <p className="text-[12px] text-ink-soft">한국 이름 · 名</p>
            <p className="mt-1 font-myeongjo text-[18px] font-extrabold">Your Korean Name</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">A Korean name with Chinese characters, chosen to balance the elements of your birth.</p>
            <p className="mt-2 text-[14px] font-bold text-seal">Free →</p>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">Full readings</h2>
        <p className="mt-1 text-[14px] text-ink-soft">The same readings Koreans order on hundosaju.com, written in English for newcomers.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {paid.map((r) => (
            <Link key={r.id} href={`/en/readings/${r.id}`} className="flex flex-col rounded-2xl bg-[#0f2236] px-4 py-4 text-hanji">
              <p className="text-[12px] text-hanji/70">{r.korean}</p>
              <p className="mt-1 font-myeongjo text-[17px] leading-snug font-extrabold">{r.title}</p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-hanji/80">{r.tagline}</p>
              <p className="mt-auto pt-3 text-[13px] font-bold text-[#d9b465]">
                {r.toc.length} chapters · {priceLabel()}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">Questions</h2>
        <div className="mt-3 flex flex-col gap-2">
          {EN_FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.08)]">
              <summary className="cursor-pointer list-none font-myeongjo text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="float-right text-ink-soft transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
