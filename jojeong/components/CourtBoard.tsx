import { EMPTY_SEATS, ROLES } from "@/lib/roles";
import type { RoleKey } from "@/lib/saju";

export type BoardSeat = { role: RoleKey; name: string };

// 조정도: the king on top and the court's seats below, taken ones with who sits there and empty ones waiting.
// Shown right after the accession (all empty, so there is something to fill) and as an example on /king.
export default function CourtBoard({ kingName, seats, caption }: { kingName: string; seats: BoardSeat[]; caption?: string }) {
  const extra = [...new Set(seats.map((s) => s.role))].filter((r) => !EMPTY_SEATS.includes(r));
  const roles = [...EMPTY_SEATS, ...extra];
  return (
    <section className="doc-paper mt-5 px-4 pt-4 pb-4">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">朝 廷 圖</p>
      <p className="mx-auto mt-2 w-fit rounded-full bg-ink px-4 py-1.5 font-myeongjo text-sm font-extrabold text-hanji">
        {kingName} 전하
      </p>
      <ul className="mt-3 grid grid-cols-4 gap-1.5">
        {roles.map((r) => {
          const here = seats.filter((s) => s.role === r);
          const danger = ROLES[r].tone === "red" || ROLES[r].tone === "gray";
          return (
            <li
              key={r}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-lg px-1 py-2 text-center ${
                here.length
                  ? danger
                    ? "border border-seal/50 bg-seal/10"
                    : "border border-gold/50 bg-white/70"
                  : "border border-dashed border-ink/25"
              }`}
            >
              <span className={`font-myeongjo text-[13px] leading-tight font-extrabold ${danger ? "text-seal" : ""}`}>{ROLES[r].title}</span>
              <span className={`mt-1 text-[12px] leading-tight ${here.length ? "font-bold" : "text-ink-soft/70"}`}>
                {here.length ? here[0].name + (here.length > 1 ? ` 외 ${here.length - 1}` : "") : "?"}
              </span>
            </li>
          );
        })}
      </ul>
      {caption && <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">{caption}</p>}
    </section>
  );
}
