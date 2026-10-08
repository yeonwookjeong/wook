"use client";

import { useActionState } from "react";
import { syncThreadsAction } from "./actions";

export default function SyncButton() {
  const [msg, action, pending] = useActionState(syncThreadsAction, "");
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className="rounded-full bg-seal px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "가져오는 중…" : "지금 가져오기"}
      </button>
      {msg && <span className="text-[13px] text-ink-soft">{msg}</span>}
    </form>
  );
}
