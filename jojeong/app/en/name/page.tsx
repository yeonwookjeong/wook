import type { Metadata } from "next";
import NameForm from "@/components/en/NameForm";

export const metadata: Metadata = {
  title: "Your Korean name from your birth chart",
  description: "Every Korean name has a meaning. Hundo chooses yours from the eight characters of your birth: Hangul, Hanja and why each one is yours.",
};

// A finished example to show before anyone types: a sample person, worked out by the same engine.
const SAMPLE = {
  hangul: "도연우",
  hanja: "都蓮雨",
  roman: "Do Yeon-u",
  chars: [
    { ch: "蓮", ko: "연", meaning: "lotus", el: "Wood" },
    { ch: "雨", ko: "우", meaning: "rain", el: "Water" },
  ],
  why: "A chart short on Water and Wood: rain to fill it, a lotus to grow from it.",
};

export default function NameHome() {
  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hundo-bow.png" alt="Hundo" width={112} height={112} className="size-28 rounded-full border-2 border-gold/40 bg-white object-cover" />
        <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-gold">이름 · YOUR KOREAN NAME</p>
        <h1 className="mt-2 font-myeongjo text-[27px] leading-tight font-extrabold">
          A Korean name,
          <br />
          chosen by your birth chart
        </h1>
        <p className="mt-3 max-w-[340px] text-[14.5px] leading-relaxed text-ink-soft">
          I am Hundo, a scholar of fate at Joseon&apos;s royal observatory. In Korea, a name is chosen, not picked: each
          syllable is a character with a meaning, matched to the eight characters you were born with.
        </p>
      </section>

      <section className="doc-paper px-5 py-5 text-center">
        <p className="text-[11px] font-bold tracking-[0.15em] text-ink-soft">A SAMPLE</p>
        <p className="mt-2 font-myeongjo text-[40px] leading-none font-extrabold">{SAMPLE.hangul}</p>
        <p className="mt-2 font-myeongjo text-[22px] text-seal">{SAMPLE.hanja}</p>
        <p className="mt-1 text-[15px] font-bold">{SAMPLE.roman}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {SAMPLE.chars.map((c) => (
            <div key={c.ch} className="rounded-lg bg-white/70 px-3 py-2.5">
              <p className="font-myeongjo text-[22px] leading-none">
                {c.ch} <span className="text-[14px] text-ink-soft">{c.ko}</span>
              </p>
              <p className="mt-1 text-[13px]">“{c.meaning}”</p>
              <p className="text-[11.5px] text-ink-soft">{c.el}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed">{SAMPLE.why}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-myeongjo text-[19px] font-extrabold">How a Korean name is made</h2>
        <ol className="flex flex-col gap-2.5 text-[14px] leading-relaxed">
          <li>
            <b>1. Three syllables.</b> A family name first (Kim, Lee, Park…), then a given name of two syllables.
          </li>
          <li>
            <b>2. Every syllable means something.</b> Written in Hangul, but most names also carry Hanja, Chinese
            characters chosen for their meaning. The same sound can be many different names.
          </li>
          <li>
            <b>3. Chosen by your saju.</b> Your birth gives eight characters and a balance of five elements: Wood, Fire,
            Earth, Metal, Water. A Korean naming master picks characters that bring the element your chart needs.
          </li>
        </ol>
      </section>

      <section id="start" className="flex flex-col gap-3">
        <h2 className="font-myeongjo text-[19px] font-extrabold">Find your Korean name</h2>
        <NameForm />
      </section>
    </div>
  );
}
