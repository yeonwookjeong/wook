import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { adsAccount } from "@/lib/ads";
import { SITE_NAME, SITE_SUMMARY, SITE_TAGLINE, SNS_URLS, siteUrl } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import VisitBeacon from "@/components/VisitBeacon";
import ChromeGate from "@/components/ChromeGate";
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
  // Home-screen app on iPhone (its icon is app/apple-icon.png; Android reads app/manifest.ts).
  appleWebApp: { capable: true, title: "훈도사주", statusBarStyle: "default" },
  // Lets AdSense verify the site once the account is set (lib/ads.ts).
  ...(adsAccount && { other: { "google-adsense-account": adsAccount } }),
  // Search Console and 네이버 서치어드바이저 ownership, from the codes each gives (only the content value).
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
    // 네이버 서치어드바이저 (www.hundosaju.com); the HTML file in public/ proves the same, this tag is the backup.
    other: { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION || "977644dafbe46fe9d6c66f78b9b00d54601b6abb" },
  },
};

// Who the site is, for search engines (schema.org): the name to show, what it does, and its own accounts.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["훈도 사주", "Hundo Saju", "hundosaju"],
      url: `${siteUrl()}/`,
      description: SITE_SUMMARY,
      inLanguage: "ko-KR",
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${siteUrl()}/`,
      logo: `${siteUrl()}/icon.svg`,
      description: SITE_SUMMARY,
      sameAs: SNS_URLS,
    },
  ],
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      </head>
      <body className="min-h-full">
        <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-8">
          <ChromeGate>
            <SiteHeader />
          </ChromeGate>
          {children}
          <ChromeGate>
            <SiteFooter />
          </ChromeGate>
        </main>
        {/* Page views and visitors, cookieless (Vercel Web Analytics; enable it in the Vercel project). */}
        <Analytics />
        {/* The same, counted for the owner's dashboard (/admin). */}
        <VisitBeacon />
      </body>
    </html>
  );
}
