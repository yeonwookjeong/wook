import type { Metadata } from "next";
import Link from "next/link";
import EnLang from "@/components/en/EnLang";
import { Obang } from "@/components/en/Deco";

// The English site, in preparation: hidden from search until it opens.
export const metadata: Metadata = {
  title: { default: "Hundo Saju · Korean Four Pillars of Destiny", template: "%s · Hundo Saju" },
  description: "Your Korean saju (Four Pillars of Destiny), read by Hundo, a scholar of the Joseon royal observatory.",
  robots: { index: false, follow: false },
};

function Seal() {
  return (
    <span className="flex h-[30px] w-[30px] shrink-0 -rotate-6 flex-col items-center justify-center rounded-[5px] border-2 border-seal font-myeongjo text-[10px] leading-none font-extrabold text-seal" aria-hidden>
      <span>訓</span>
      <span>導</span>
    </span>
  );
}

export default function EnLayout({ children }: LayoutProps<"/en">) {
  return (
    <>
      <EnLang />
      <header className="flex items-center justify-between pt-4">
        <Link href="/en" className="flex items-center gap-2">
          <Seal />
          <span className="flex flex-col">
            <span className="font-myeongjo text-[15px] leading-tight font-extrabold">Hundo Saju</span>
            <span className="text-[10px] leading-tight text-ink-soft">Korean Four Pillars of Destiny</span>
          </span>
        </Link>
        <Link href="/en/saju-101" className="border border-ink/20 px-2.5 py-1 font-myeongjo text-xs font-extrabold text-ink-soft">
          What is saju?
        </Link>
      </header>
      <Obang className="mt-3" />
      {children}
      <footer className="mt-10 border-t border-ink/10 pt-4 text-center text-[11px] leading-relaxed text-ink-soft">
        <Obang className="mb-3" />
        <p>Hundo Saju · hundosaju.com</p>
        <p>Saju is a centuries-old Korean tradition, offered here for reflection and fun, not as advice for medical, legal or money decisions.</p>
        <p className="mt-1">
          <Link href="/" className="underline">한국어</Link>
        </p>
      </footer>
    </>
  );
}
