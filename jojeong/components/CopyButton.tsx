"use client";

import { useState } from "react";

// Copies a text (a link, a message) and says so for a moment.
export default function CopyButton({ text, label = "복사", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard permission (an older browser or an insecure page): select through a hidden field.
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button type="button" onClick={copy} className={`rounded-lg border border-seal/30 bg-white/70 px-3 py-1.5 text-[12px] font-bold text-seal ${className}`}>
      {done ? "복사됨 ✓" : label}
    </button>
  );
}
