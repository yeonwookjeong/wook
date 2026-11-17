import type { Metadata } from "next";
import Link from "next/link";

// 日本語ページ (2026-11-16): 韓国語サイトのヘッダーとフッターは ChromeGate で外し、ここで自前のものを出す。
export const metadata: Metadata = {
  title: { default: "訓導サジュ · 韓国の四柱推命", template: "%s · 訓導サジュ" },
  description: "韓国の四柱推命「サジュ」を、朝鮮王朝の観象監の学者・訓導がやさしい日本語で読み解きます。",
  alternates: { languages: { ko: "/", en: "/en", ja: "/ja" } },
};

export default function JaLayout({ children }: LayoutProps<"/ja">) {
  return (
    // Japanese has no spaces between words: the Korean keep-all (globals.css) would break lines only at punctuation.
    <div lang="ja" className="flex flex-1 flex-col [line-break:strict] [word-break:normal]">
      <header className="flex items-center justify-between pt-4">
        <Link href="/ja" className="flex items-center gap-2">
          <span
            className="flex size-[30px] shrink-0 -rotate-6 flex-col items-center justify-center rounded-[5px] border-2 border-seal font-myeongjo text-[10px] leading-none font-extrabold text-seal"
            aria-hidden="true"
          >
            <span>訓</span>
            <span>導</span>
          </span>
          <span className="font-myeongjo text-[16px] font-extrabold">訓導サジュ</span>
        </Link>
        <nav className="flex gap-3 text-[12px] text-ink-soft">
          <Link href="/ja/column" className="underline-offset-2 hover:underline">
            コラム
          </Link>
          <Link href="/en" className="underline-offset-2 hover:underline">
            English
          </Link>
          <Link href="/" className="underline-offset-2 hover:underline">
            한국어
          </Link>
        </nav>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mt-12 border-t border-ink/10 pt-4 text-center text-[11px] leading-relaxed text-ink-soft">
        <p>サジュは文化と楽しみのためのもので、未来の予言ではありません。</p>
        <p className="mt-1">© Hundo Saju · hundosaju.com</p>
      </footer>
    </div>
  );
}
