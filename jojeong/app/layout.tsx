import type { Metadata, Viewport } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const myeongjo = Nanum_Myeongjo({
  weight: ["400", "800"],
  variable: "--font-nanum-myeongjo",
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
