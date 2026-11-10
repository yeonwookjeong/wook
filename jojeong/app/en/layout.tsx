import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";

// The English pages: their own header and footer (the Korean ones are kept off by ChromeGate in the root
// layout). Out of search until launch.
export const metadata: Metadata = {
  title: { default: "Hundo, Korean saju and names", template: "%s | Hundo" },
  description: "A Korean name chosen from the eight characters of your birth, by Hundo, a scholar of fate from Joseon's royal observatory.",
  robots: { index: false, follow: false },
};

export default function EnLayout({ children }: LayoutProps<"/en">) {
  return (
    <div lang="en" className="flex flex-1 flex-col">
      <header className="flex items-center justify-between pt-4">
        <Link href="/en" className="flex items-center gap-2">
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
        <nav className="mb-2 flex justify-center gap-3 text-[12px]">
          <Link href="/en" className="underline-offset-2 hover:underline">Home</Link>
          <Link href="/en/terms" className="underline-offset-2 hover:underline">Terms</Link>
          <Link href="/en/refund" className="underline-offset-2 hover:underline">Refunds</Link>
          <Link href="/en/privacy" className="underline-offset-2 hover:underline">Privacy</Link>
          <a href={`mailto:${BUSINESS.email}`} className="underline-offset-2 hover:underline">Contact</a>
        </nav>
        <p>For entertainment and cultural interest. Saju is a tradition of interpretation, not a prediction.</p>
        <p className="mt-1">
          {BUSINESS.nameEn}, {BUSINESS.ownerEn} | Business registration {BUSINESS.regNo} | Mail-order registration {BUSINESS.mailOrderNo} | {BUSINESS.email}
        </p>
        <p>{BUSINESS.addressEn}</p>
        <p className="mt-1">© Hundo Saju, hundosaju.com</p>
      </footer>
    </div>
  );
}
