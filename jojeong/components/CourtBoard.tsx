import { ROLES } from "@/lib/roles";
import type { RoleKey } from "@/lib/saju";

export type BoardSeat = { role: RoleKey; name: string };

// 조정도, drawn as the courtyard in front of the throne hall: the king on the throne under the 일월오봉도, and the
// officials standing at their rank stones (품계석). Each post sits on the stone of its real rank; 간신 and 유배 stand
// outside the ranks. Shown right after the accession (all empty, so there is something to fill), on the court
// page as friends come in, and as an example on /king.
const ROWS: { stone: string; label: string; roles: RoleKey[] }[] = [
  { stone: "正一品", label: "정1품", roles: ["yeong", "jwa"] },
  { stone: "正二品", label: "정2품", roles: ["daejehak", "byeongjo", "hojo", "yejo"] },
  { stone: "從二品", label: "종2품", roles: ["daesaheon"] },
];
const OUTSIDE: RoleKey[] = ["gansin", "yubae"];

function Throne({ kingName }: { kingName: string }) {
  return (
    <div className="relative mx-auto w-[86%] overflow-hidden rounded-t-xl border-2 border-b-0 border-[#b8862f] bg-[#1d2b3a] pt-2">
      {/* 일월오봉도 in miniature: red sun, white moon, five blue peaks over the water. */}
      <svg viewBox="0 0 300 70" className="block w-full" aria-hidden>
        <circle cx="62" cy="22" r="11" fill="#d23b2a" />
        <circle cx="238" cy="22" r="11" fill="#f3ead0" />
        <path d="M0 70 L40 34 L70 52 L110 18 L150 46 L190 18 L230 52 L260 34 L300 70 Z" fill="#2f6b5f" />
        <path d="M0 70 L40 44 L70 58 L110 32 L150 56 L190 32 L230 58 L260 44 L300 70 Z" fill="#244f47" />
      </svg>
      <div className="absolute inset-x-0 bottom-2 flex justify-center">
        <span className="rounded-full border border-[#e2bc68] bg-[#7d1a14] px-4 py-1 font-myeongjo text-sm font-extrabold whitespace-nowrap text-[#f7e3ad] shadow-[0_2px_6px_rgb(0_0_0/0.4)]">
          {kingName} 전하
        </span>
      </div>
    </div>
  );
}

function Seat({ role, here }: { role: RoleKey; here: BoardSeat[] }) {
  const taken = here.length > 0;
  const outside = OUTSIDE.includes(role);
  const name = taken ? here[0].name + (here.length > 1 ? ` 외 ${here.length - 1}` : "") : "비어 있음";
  return (
    <li
      className={`relative flex min-h-[58px] flex-col items-center justify-center overflow-hidden rounded-md px-1 pt-2.5 pb-1.5 text-center ${
        taken
          ? outside
            ? "border border-seal/60 bg-[#2a211b] text-hanji"
            : "border border-[#b8862f]/60 bg-white/80"
          : "border border-dashed border-ink/25 bg-white/20"
      }`}
    >
      {/* 관복 깃: 당상관의 붉은 옷, 간신과 유배는 품계 밖이라 검은 띠 */}
      {taken && <span className={`absolute inset-x-0 top-0 h-1.5 ${outside ? "bg-seal" : "bg-[#9e2b25]"}`} />}
      <span className={`font-myeongjo text-[13px] leading-tight font-extrabold ${outside ? (taken ? "text-[#f1a59c]" : "text-seal") : ""}`}>
        {ROLES[role].title}
      </span>
      <span className={`mt-1 max-w-full truncate text-[12px] leading-tight ${taken ? "font-bold" : "text-ink-soft/60"}`}>{name}</span>
    </li>
  );
}

export default function CourtBoard({ kingName, seats, caption }: { kingName: string; seats: BoardSeat[]; caption?: string }) {
  const at = (r: RoleKey) => seats.filter((s) => s.role === r);
  const outside = OUTSIDE.filter((r) => r === "gansin" || at(r).length > 0);
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#b8862f]/40 bg-[linear-gradient(#efe4cb,#e6d6b4)] px-3 pt-4 pb-4 shadow-[0_6px_18px_rgb(33_27_23/0.12)]">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">朝 廷 圖</p>
      <div className="mt-3">
        <Throne kingName={kingName} />
        <div className="h-2 rounded-sm bg-[#8a6a3c]" />
      </div>
      {/* 박석 마당: rank stones down the left, officials beside them. */}
      <div className="mt-3 flex flex-col gap-2">
        {ROWS.map((row) => (
          <div key={row.stone} className="flex items-stretch gap-2">
            <div
              className="flex w-9 shrink-0 flex-col items-center justify-center rounded-t-[10px] border border-[#9b927f] bg-[linear-gradient(#d9d3c4,#b7af9c)] py-1 font-myeongjo text-[11px] leading-[1.15] font-extrabold text-[#3d362c] shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)]"
              aria-label={row.label}
            >
              {[...row.stone].map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
            <ul className={`grid flex-1 gap-1.5 ${row.roles.length === 4 ? "grid-cols-4" : row.roles.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {row.roles.map((r) => (
                <Seat key={r} role={r} here={at(r)} />
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-1 flex items-stretch gap-2 border-t border-dashed border-seal/30 pt-2">
          <div className="flex w-9 shrink-0 items-center justify-center font-myeongjo text-[11px] leading-tight font-extrabold text-seal">
            品外
          </div>
          <ul className={`grid flex-1 gap-1.5 ${outside.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {outside.map((r) => (
              <Seat key={r} role={r} here={at(r)} />
            ))}
          </ul>
        </div>
      </div>
      {caption && <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">{caption}</p>}
    </section>
  );
}
