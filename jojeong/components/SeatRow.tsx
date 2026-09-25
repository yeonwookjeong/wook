import Link from "next/link";
import DismissButton from "./DismissButton";
import type { Seat } from "@/lib/court";
import { ROLES } from "@/lib/roles";

const TONE: Record<string, string> = {
  gold: "bg-gold text-hanji",
  ink: "bg-ink text-hanji",
  red: "bg-seal text-hanji",
  gray: "bg-ink-soft/70 text-hanji",
};

export default function SeatRow({
  courtId,
  seat,
  mine,
  canDismiss = false,
}: {
  courtId: string;
  seat: Seat;
  mine: boolean;
  canDismiss?: boolean;
}) {
  const role = ROLES[seat.role];
  return (
    <li className="flex items-stretch gap-2">
      <Link
        href={`/court/${courtId}/m/${seat.minister.id}`}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border bg-white/70 px-3 py-3 transition active:scale-[0.99] ${mine ? "border-seal ring-2 ring-seal/30" : "border-ink/10"}`}
      >
        <span
          className={`flex h-12 w-[72px] shrink-0 items-center justify-center rounded-xl font-myeongjo text-[15px] font-extrabold ${TONE[role.tone]}`}
        >
          {role.title}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">
            {seat.minister.name}
            {mine && <span className="ml-1.5 text-xs text-seal">(나)</span>}
            {seat.minister.source === "appointed" && (
              <span className="ml-1.5 rounded bg-ink/5 px-1.5 py-0.5 align-middle text-[10px] font-normal text-ink-soft">
                직접 등용
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-ink-soft">{role.tagline}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-myeongjo text-xl font-extrabold">{seat.match.score}</span>
          <span className="block text-[10px] text-ink-soft">궁합</span>
        </span>
      </Link>
      {canDismiss && <DismissButton courtId={courtId} ministerId={seat.minister.id} name={seat.minister.name} />}
    </li>
  );
}
