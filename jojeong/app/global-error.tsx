"use client";

import "./globals.css";
import ErrorScreen from "@/components/ErrorScreen";

// The root layout itself broke: the same screen, with its own page shell.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body className="min-h-full bg-hanji text-ink">
        <ErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
