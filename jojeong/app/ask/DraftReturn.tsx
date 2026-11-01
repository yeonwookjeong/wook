"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/components/VisitBeacon";
import { pendingRoom, stepOnce } from "@/lib/askFlow";

// A question written in a room but not sent yet (no questions were left; app/ask/AskForms.tsx keeps it): back to
// that room, where it waits in the box. Shown on /ask, where buying more lands. `bought`: just back from paying;
// a question that was sent with none left (lib/askFlow.ts PENDING) goes back to its room and is sent by itself.
export default function DraftReturn({ rooms, bought = false }: { rooms: string[]; bought?: boolean }) {
  const [room, setRoom] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (bought && stepOnce("bought")) trackEvent("askflow_buy");
      const pending = pendingRoom();
      if (bought && pending && rooms.includes(pending)) {
        window.location.replace(`/ask/${pending}?send=1`);
        return;
      }
      const found = rooms.find((r) => (JSON.parse(localStorage.getItem(`jj_ask_draft:${r}`) ?? "null") as { text?: string } | null)?.text?.trim());
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage
      if (found) setRoom(found);
    } catch {}
  }, [rooms, bought]);
  if (!room) return null;
  return (
    <Link href={`/ask/${room}`} className="jjok-box mt-4 flex items-center gap-3 px-4 py-3.5">
      <span className="min-w-0 flex-1">
        <b className="block font-myeongjo text-[15px]">써 두신 질문이 있어요</b>
        <span className="text-[12px] opacity-75">그 사랑방으로 가서 바로 보내기</span>
      </span>
      <span className="shrink-0 font-bold text-[#d4af5f]">→</span>
    </Link>
  );
}
