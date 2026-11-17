"use client";

import { usePathname } from "next/navigation";

// The Korean site's header, footer and notices stay off the English (/en) and Japanese (/ja) pages, which bring their own.
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/en" || path.startsWith("/en/") || path === "/ja" || path.startsWith("/ja/")) return null;
  return children;
}
