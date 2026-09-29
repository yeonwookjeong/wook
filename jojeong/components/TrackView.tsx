"use client";

import { useEffect } from "react";
import { trackEvent } from "./VisitBeacon";

// Counts a shopper seeing a paid report's page, per line of the owner's sales table (lib/sales.ts).
export default function TrackView({ sale }: { sale: string }) {
  useEffect(() => trackEvent(`view:${sale}`), [sale]);
  return null;
}
