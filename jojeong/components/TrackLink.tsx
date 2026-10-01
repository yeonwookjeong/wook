"use client";

import Link from "next/link";
import type { StepFrom } from "@/lib/nextStep";
import { trackEvent } from "./VisitBeacon";

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
    <Link href={href} className={className} onClick={() => trackEvent(event, from)}>
      {children}
    </Link>
  );
}
