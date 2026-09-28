"use client";

import { usePathname } from "next/navigation";
import AdSlot from "./AdSlot";

// The one ad in the site footer, on the home page only: under the brand, above the business details. Every
// other page's footer stays clean (the paid reports above all). Renders nothing while ads are off.
export default function FooterAd() {
  return usePathname() === "/" ? <AdSlot className="mt-6 w-full" /> : null;
}
