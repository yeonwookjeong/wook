"use client";

import Link from "next/link";
import type { StepFrom } from "@/lib/nextStep";
import { productById } from "@/lib/products";
import { trackEvent } from "./VisitBeacon";

// A step to a report sold for money; a free report (신분 감정, 무료 풀이) or a free page is not.
const toPaid = (href: string) => {
  const p = productById(/^\/reports\/([a-z]+)/.exec(href)?.[1] ?? "");
  return Boolean(p && !p.free);
};

// A link that also counts as a funnel step on the owner's dashboard (lib/stats.ts CLIENT_EVENTS).
export default function TrackLink({
  event,
  href,
  from,
  className,
  children,
}: {
  event: "own_court" | "to_saju";
  from?: StepFrom;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent(event, from, event === "to_saju" && toPaid(href) ? "paid" : undefined)}>
      {children}
    </Link>
  );
}
