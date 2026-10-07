import Link from "next/link";
import EnBirthForm from "@/components/en/EnBirthForm";
import IntroSheet from "@/components/en/IntroSheet";
import InstallPrompt from "@/components/InstallPrompt";
import { Cloud } from "@/components/en/Deco";
import EnHero from "@/components/en/EnHero";

// The English front page: who reads your fate and what you get, then the form. A first visit also gets a short
// welcome sheet (components/en/IntroSheet.tsx); /en/saju-101 tells the whole story.
export default function EnHome() {
  return (
    <>
      <EnHero />
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">四 柱</p>
        <h1 className="mt-2 font-myeongjo text-[28px] font-extrabold leading-tight">Your destiny, read the Korean way</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          For centuries, Koreans have read their lives in <b className="text-ink">saju</b>, the four pillars of birth. Hundo, a
          scholar of the Joseon royal observatory, reads yours.
        </p>
      </section>

      <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[12px]">
        {[
          ["日", "Your Day Master", "who you are at the core"],
          ["五", "Five Elements", "what you have, and lack"],
          ["柱", "Four Pillars", "your chart in Hanja"],
        ].map(([h, t, s]) => (
          <li key={t} className="rounded-xl border border-ink/10 bg-white/50 px-2 py-3">
            <span className="font-myeongjo text-xl text-seal">{h}</span>
            <p className="mt-1 font-bold leading-tight">{t}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{s}</p>
          </li>
        ))}
      </ul>

      <Cloud className="mt-6" />
      <div id="read" className="mt-4 scroll-mt-4">
        <EnBirthForm />
      </div>

      <p className="mt-4 text-center text-[12.5px] text-ink-soft">
        New to saju?{" "}
        <Link href="/en/saju-101" className="font-bold text-seal underline">
          Saju 101: a five-minute guide
        </Link>
      </p>
      <InstallPrompt lang="en" className="mt-6" />
      <IntroSheet />
    </>
  );
}
