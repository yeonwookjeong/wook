"use client";

import type { ReactNode } from "react";
import type { ChFrom } from "@/lib/stats";
import { trackEvent } from "./VisitBeacon";

// The KakaoTalk channel's add-friend page (or the member's gift box), counted by where it was tapped.
export default function ChannelLink({ href, from, className, children }: { href: string; from: ChFrom; className?: string; children: ReactNode }) {
  const outside = href.startsWith("http");
  return (
    <a href={href} className={className} onClick={() => trackEvent("to_channel", from)} {...(outside && { target: "_blank", rel: "noopener" })}>
      {children}
    </a>
  );
}
