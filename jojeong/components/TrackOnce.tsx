"use client";

import { useEffect } from "react";
import { trackEvent } from "./VisitBeacon";

// Counts one view of a page state (lib/stats.ts CLIENT_EVENTS) once it is on screen, in the browser so robots and
// the owner are left out like every other count.
export default function TrackOnce({ e }: { e: string }) {
  useEffect(() => trackEvent(e), [e]);
  return null;
}
