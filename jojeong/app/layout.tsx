import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

// Headings: Hahmlet, a modern Korean serif (variable weight), for 정 훈도's Joseon-meets-now voice.
const myeongjo = Hahmlet({
  variable: "--font-heading",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} · ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: "평생 사주, 궁합, 2026 운세, 연애·재물·직업까지. 같은 일주라도 다 다른 당신만의 사주를 정 훈도가 풀어 드려요.",
};

export const viewport: Viewport = {
  themeColor: "#f4ecdb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${myeongjo.variable} h-full antialiased`}>
      <head>
        {/* Pretendard for body text, split by character range so a page loads only the glyphs it uses. */}
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-8">
          <SiteHeader />
          {children}
          <SiteFooter />
        </main>
      </body>
    </html>
  );
}
