import type { Metadata } from "next";
import Link from "next/link";
import { SealHead } from "@/components/en/Deco";
import EnHero from "@/components/en/EnHero";

export const metadata: Metadata = { title: "Saju 101" };

// Saju for someone meeting it for the first time: what it is, where it comes from, how Koreans use it today,
// what it is not, and why the birth hour matters (and how to find it).
const SECTIONS: { h: string; hanja: string; body: React.ReactNode }[] = [
  {
    h: "What is saju?",
    hanja: "四柱",
    body: (
      <>
        <p>
          <b>Saju (사주, “four pillars”)</b> reads a life from the moment it began. The year, month, day and hour of your birth each
          become a pillar of two Chinese characters (Hanja): a <b>heavenly stem</b> on top and an <b>earthly branch</b> below. Four
          pillars, eight characters: Koreans call it <b>palja (팔자)</b>, and “that&rsquo;s my palja” still means “that&rsquo;s my fate.”
        </p>
        <p>
          Every character belongs to one of the <b>five elements</b>: Wood, Fire, Earth, Metal and Water. How they balance, feed and
          check one another is the language saju speaks.
        </p>
      </>
    ),
  },
  {
    h: "Where it comes from",
    hanja: "觀象監",
    body: (
      <p>
        The four pillars grew out of East Asian calendar science and came to Korea centuries ago. In the Joseon dynasty (1392–1910)
        the royal observatory, the <b>Gwansanggam (관상감)</b>, kept the calendar, watched the skies and chose auspicious days for
        the court. Among its officials were teachers of fate-reading called <b>Hundo (훈도)</b>. Our guide takes his name from them.
      </p>
    ),
  },
  {
    h: "How Koreans use it today",
    hanja: "今",
    body: (
      <ul className="list-disc pl-5">
        <li>A New Year reading (신년운세) to see what the year holds.</li>
        <li>Gunghap (궁합): checking compatibility before dating seriously or marrying.</li>
        <li>Taekil (택일): picking a good day to move, sign or marry.</li>
        <li>Saju cafés, where friends get read together over coffee, now a favourite stop for visitors to Seoul.</li>
      </ul>
    ),
  },
  {
    h: "How it differs from Western astrology",
    hanja: "異",
    body: (
      <p>
        Your <b>Day Master</b> (the stem of your birth day) works a little like a sun sign: it is the core of who you are. But saju
        has no planets; it reads the cycles of the calendar and the five elements, and it pays close attention to <b>timing</b>, the
        ten-year seasons of life called <b>daeun (대운)</b>.
      </p>
    ),
  },
  {
    h: "Why your birth hour matters, and how to find it",
    hanja: "時",
    body: (
      <>
        <p>
          The hour gives the fourth pillar, a bit like the rising sign in astrology. Without it you still get three pillars, six of the
          eight characters, and your Day Master, which is the heart of the reading.
        </p>
        <ul className="list-disc pl-5">
          <li>Ask a parent or relative, or look in a baby book.</li>
          <li>In the US, the <b>long-form</b> birth certificate from your state&rsquo;s vital records office usually records the time; the short form usually doesn&rsquo;t.</li>
          <li>Hospital birth records often have it too.</li>
        </ul>
      </>
    ),
  },
  {
    h: "What saju is not",
    hanja: "非",
    body: (
      <p>
        Saju is a tradition and a mirror, not a verdict. Koreans say <b>“the face follows the heart”</b>: what you do with your
        chart matters more than the chart. Enjoy it, reflect on it, and don&rsquo;t use it in place of medical, legal or financial advice.
      </p>
    ),
  },
];

export default function Saju101() {
  return (
    <>
      <EnHero compact title="入門 · SAJU 101" line="" />
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">入 門</p>
        <h1 className="mt-2 font-myeongjo text-[28px] font-extrabold">Saju 101</h1>
        <p className="mt-2 text-[14px] text-ink-soft">A five-minute guide to Korea&rsquo;s way of reading destiny</p>
      </section>
      <div className="mt-6 flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <section key={s.h} className="doc-paper px-5 py-5">
            <h2>
              <SealHead hanja={s.hanja} title={s.h} />
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-[14px] leading-[1.75]">{s.body}</div>
          </section>
        ))}
      </div>
      <Link href="/en" className="mt-6 block rounded-full bg-seal px-5 py-3 text-center font-bold text-hanji">
        Read my four pillars · free
      </Link>
    </>
  );
}
