"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

// Microsoft Clarity (scroll depth, clicks, replays), only when NEXT_PUBLIC_CLARITY_ID is set in Vercel. Not started
// on a visit that begins on the owner's pages, the questions room, payments or the account pages (Clarity has no
// documented stop, so a visit that moves there later keeps it); the birth forms are masked (data-clarity-mask) and
// the project is set to Strict masking in Clarity, so no typed or shown text is recorded.
const ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const QUIET = ["/admin", "/ask", "/pay", "/my", "/login", "/leave", "/logout", "/r/", "/e/"];

export default function ClarityTag() {
  const path = usePathname();
  if (!ID || !/^[a-z0-9]{6,20}$/.test(ID) || QUIET.some((q) => path.startsWith(q))) return null;
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${ID}");`}
    </Script>
  );
}
