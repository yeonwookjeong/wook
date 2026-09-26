"use client";

import { useState } from "react";

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  };
  const toast = msg && (
    <div className="fixed inset-x-0 bottom-8 z-50 mx-auto w-fit rounded-full bg-ink px-5 py-2.5 text-sm text-hanji shadow-lg">
      {msg}
    </div>
  );
  return { show, toast };
}

export function ShareLinkButton({
  path,
  text,
  label,
  primary = true,
}: {
  path: string;
  text: string;
  label: string;
  primary?: boolean;
}) {
  const { show, toast } = useToast();

  async function onClick() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      show("링크를 복사했사옵니다. 카톡에 붙여넣으시옵소서!");
    } catch {
      window.prompt("이 링크를 복사해 주시옵소서", url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={
          primary
            ? "w-full rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14] transition active:translate-y-1 active:shadow-[0_2px_0_#7d1a14]"
            : "w-full rounded-2xl border-2 border-ink py-3.5 font-myeongjo text-base font-extrabold text-ink"
        }
      >
        {label}
      </button>
      {toast}
    </>
  );
}

export function SaveImageButton({
  src,
  filename,
  label,
  compact = false,
}: {
  src: string;
  filename: string;
  label: string;
  compact?: boolean;
}) {
  const { show, toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      show("이미지를 저장했사옵니다. 스토리에 올려보시옵소서!");
    } catch {
      show("이미지를 만들지 못했사옵니다. 다시 눌러주시옵소서.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={
          compact
            ? "w-full rounded-xl border-2 border-ink/80 bg-white/50 py-2.5 font-myeongjo text-sm font-extrabold text-ink disabled:opacity-60"
            : "w-full rounded-2xl border-2 border-ink py-3.5 font-myeongjo text-base font-extrabold text-ink disabled:opacity-60"
        }
      >
        {busy ? (compact ? "쓰는 중…" : "교지를 쓰는 중…") : label}
      </button>
      {toast}
    </>
  );
}
