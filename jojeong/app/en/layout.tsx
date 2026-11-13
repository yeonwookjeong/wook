import type { Metadata } from "next";
import Link from "next/link";

// The English pages: their own header and footer (the Korean ones are kept off by ChromeGate in the root
// layout). Out of search until launch.
export const metadata: Metadata = {
  title: { default: "Hundo · Korean names and saju", template: "%s · Hundo" },
  description: "A Korean name chosen from the eight characters of your birth, by Hundo, a scholar of fate from Joseon's royal observatory.",
  robots: { index: false, follow: false },
};

export default function EnLayout({ children }: LayoutProps<"/en">) {
  return (
    <div lang="en" className="flex flex-1 flex-col">
      <header className="flex items-center justify-between pt-4">
        <Link href="/en/name" className="flex items-center gap-2">
          <span
            className="flex size-[30px] shrink-0 -rotate-6 flex-col items-center justify-center rounded-[5px] border-2 border-seal font-myeongjo text-[10px] leading-none font-extrabold text-seal"
            aria-hidden="true"
          >
            <span>訓</span>
            <span>導</span>
          </span>
          <span className="font-myeongjo text-[16px] font-extrabold">Hundo</span>
        </Link>
        <Link href="/" className="text-[12px] text-ink-soft underline-offset-2 hover:underline">
          한국어
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mt-12 border-t border-ink/10 pt-4 text-center text-[11px] leading-relaxed text-ink-soft">
        <p>For entertainment and cultural interest. A name from saju is a tradition, not a prediction.</p>
        <p className="mt-1">© Hundo Saju · hundosaju.com</p>
      </footer>
    </div>
  );
}
