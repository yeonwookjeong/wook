"use client";

import { useEffect } from "react";
import { trackEvent } from "./VisitBeacon";

// Counts a shopper seeing a paid report's page, per line of the owner's sales table (lib/sales.ts), or a reader
// opening a column of 훈도의 사주 이야기 (lib/columns.ts).
export default function TrackView({ sale, column }: { sale?: string; column?: string }) {
  const event = sale ? `view:${sale}` : `cv:${column}`;
  useEffect(() => trackEvent(event), [event]);
  return null;
}
