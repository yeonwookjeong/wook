import type { Metadata, Viewport } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import { SERVICE_NAME, TAGLINE, siteUrl } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const myeongjo = Nanum_Myeongjo({
  weight: ["400", "800"],
  variable: "--font-nanum-myeongjo",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SERVICE_NAME} · ${TAGLINE}`, template: `%s · ${SERVICE_NAME}` },
  description: "생년월일만 넣으면 전하가 됩니다. 친구를 부르면 사주가 영의정부터 간신까지 관직을 내려드립니다.",
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
