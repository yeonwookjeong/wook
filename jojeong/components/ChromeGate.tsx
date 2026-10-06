"use client";

import { usePathname } from "next/navigation";

// The Korean site's header and footer, left out on the English pages (/en), which carry their own.
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === "/en" || path.startsWith("/en/") ? null : <>{children}</>;
}
