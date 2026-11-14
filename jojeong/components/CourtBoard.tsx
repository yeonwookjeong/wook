import type { ReactNode } from "react";
import { ROLES } from "@/lib/roles";
import type { RoleKey } from "@/lib/saju";

export type BoardSeat = { role: RoleKey; name: string; score?: number };

// 조정도, drawn as the yard in front of 근정전 (2026-11-14 개편): the throne under the sun, moon and five peaks, the
// 월대 steps, then the stone yard where each office stands at its 품계석, the closer to the throne the higher.
// 간신 lurk in the side 행각 and the exiled stand outside the gate. The posts carry no 東班/西班 label: the offices
// sit by rank, not by the real civil-east, military-west split, so naming the sides would be wrong (대표님 안 A).
// `throne`: what sits on the throne (the court page puts the same-day-pillar king there); a plain name otherwise.

// Rows nearest the throne first; each row is [west, east].
const ROWS: [RoleKey | null, RoleKey][] = [
  ["jwa", "yeong"],
  ["hojo", "daejehak"],
  ["byeongjo", "yejo"],
  [null, "daesaheon"],
];
const POST: Partial<Record<RoleKey, string>> = {
  yeong: "正一品",
  jwa: "正一品",
  daejehak: "正二品",
  byeongjo: "正二品",
  hojo: "正二品",
  yejo: "正二品",
  daesaheon: "從二品",
};

const names = (list: BoardSeat[]) => (list.length ? list[0].name + (list.length > 1 ? ` 외 ${list.length - 1}` : "") : "");

export function Peaks() {
  return (
    <svg viewBox="0 0 390 130" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 size-full">
      <circle cx="300" cy="32" r="15" fill="#b3261e" />
      <circle cx="90" cy="32" r="15" fill="#f4ecdb" opacity=".9" />
      <g fill="#22324a" stroke="#d9b465" strokeWidth="1.2" strokeOpacity=".7">
        <path d="M0 106 L48 62 L88 94 Z" />
        <path d="M58 106 L118 50 L170 98 Z" />
        <path d="M140 106 L195 22 L250 106 Z" />
        <path d="M220 98 L272 50 L332 106 Z" />
        <path d="M302 94 L342 62 L390 106 Z" />
      </g>
      <g fill="none" stroke="#d9b465" strokeOpacity=".45" strokeWidth="1.2">
        <path d="M0 114 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
        <path d="M0 126 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
      </g>
    </svg>
  );
}

function Post({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      className="flex h-[68px] w-7 shrink-0 flex-col items-center justify-center rounded-t-lg rounded-b-sm bg-[#b9ad95] text-center font-myeongjo text-[12px] leading-[1.15] font-bold text-[#3e352d] shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)]"
    >
      {text.split("").map((c, i) => (
        <span key={i} className="block">
          {c}
        </span>
      ))}
    </span>
  );
}

function Seat({ role, here, best, side }: { role: RoleKey; here: BoardSeat[]; best: boolean; side: "w" | "e" }) {
  const top = here.reduce<number | undefined>((m, s) => (s.score === undefined ? m : Math.max(m ?? 0, s.score)), undefined);
  return (
    <div className={`flex items-center gap-2 ${side === "w" ? "flex-row-reverse" : ""}`}>
      <Post text={POST[role] ?? ""} />
      <div
        className={`min-w-0 flex-1 rounded-[10px] px-2.5 py-2 ${
          here.length
            ? best
              ? "bg-[#fbf6ea] shadow-[inset_0_0_0_1.5px_#b3261e]"
              : "bg-[#fbf6ea] shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_0_0_1px_rgb(33_27_23/0.08)]"
            : "outline-1 -outline-offset-1 outline-ink/35 outline-dashed"
        }`}
      >
        <p className="font-myeongjo text-[14px] leading-tight font-bold">
          {ROLES[role].title}
          {best && <span className="ml-1 font-sans text-[12px] text-seal">최고 궁합</span>}
        </p>
        <p className="mt-1 flex items-baseline justify-between gap-1 text-[14px] leading-tight">
          <span className={`truncate ${here.length ? "" : "text-ink-soft"}`}>{here.length ? names(here) : "비어 있음"}</span>
          {top !== undefined && <span className="shrink-0 text-[12px] font-bold text-gold">{top}점</span>}
        </p>
      </div>
    </div>
  );
}

export default function CourtBoard({
  kingName,
  seats,
  caption,
  throne,
}: {
  kingName: string;
  seats: BoardSeat[];
  caption?: string;
  throne?: ReactNode;
}) {
  const at = (r: RoleKey) => seats.filter((s) => s.role === r);
  const scored = seats.filter((s) => s.score !== undefined && s.role !== "gansin" && s.role !== "yubae");
  const bestRole = scored.length ? scored.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a)).role : null;
  const gansin = at("gansin");
  const yubae = at("yubae");

  return (
    <section className="mt-5" aria-label={`${kingName} 전하의 조정도`}>
      {/* 어좌 */}
      <div className="overflow-hidden rounded-2xl bg-[#0f2236] text-hanji shadow-[inset_0_0_0_1px_rgb(217_180_101/0.35)]">
        <div className="relative h-[130px]">
          <Peaks />
        </div>
        <div className="relative -mt-12 px-4 pb-4">
          {throne ?? (
            <div className="rounded-xl bg-[#1c2a40] px-4 py-4 shadow-[inset_0_0_0_1px_rgb(217_180_101/0.3)]">
              <p className="font-myeongjo text-[12px] font-bold tracking-[0.2em] text-[#d9b465]">御 座</p>
              <p className="mt-1 font-myeongjo text-[24px] leading-tight font-extrabold">{kingName} 전하</p>
            </div>
          )}
        </div>
      </div>

      {/* 월대 */}
      <div aria-hidden className="-mt-px flex flex-col items-center">
        <i className="block h-2 w-[44%] border-b border-ink/10 bg-[#cbbfa6]" />
        <i className="block h-2 w-[56%] border-b border-ink/10 bg-[#cbbfa6]" />
        <i className="block h-2 w-[68%] border-b border-ink/10 bg-[#cbbfa6]" />
      </div>

      {/* 박석 마당 */}
      <div className="relative rounded-xl bg-[#d9cfbb] bg-[repeating-linear-gradient(0deg,transparent_0_27px,rgb(33_27_23/0.07)_27px_28px),repeating-linear-gradient(90deg,transparent_0_41px,rgb(33_27_23/0.07)_41px_42px)] px-3 pt-5 pb-6">
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 border-x border-ink/10 bg-[#e6dcc7]" />
        <p className="relative text-center font-myeongjo text-[12px] font-bold tracking-[0.4em] text-[#4a4038]">朝 廷 圖</p>
        {ROWS.map(([w, e]) => (
          <div key={e} className="relative mt-3 grid grid-cols-[1fr_36px_1fr] items-center">
            {w ? <Seat role={w} here={at(w)} best={bestRole === w} side="w" /> : <div />}
            <div />
            <Seat role={e} here={at(e)} best={bestRole === e} side="e" />
          </div>
        ))}

        {/* 행각: 간신 */}
        <div className="relative mt-6 flex items-center gap-3 rounded-[10px] bg-[#c9bda4] px-3 py-2.5">
          <span aria-hidden className="text-center font-myeongjo text-[12px] leading-[1.3] font-bold text-[#3e352d]">
            行<br />閣
          </span>
          <p className="text-[14px] leading-snug">
            <b className="font-myeongjo">간신</b> {names(gansin)}
            <span className="block text-[13px] text-[#4a4038]">
              {gansin.length ? "행각 기둥 뒤에서 엿듣는 자리" : "아직 행각 기둥 뒤에 숨은 자가 없사옵니다"}
            </span>
          </p>
        </div>
      </div>

      {/* 궐문 밖: 유배 */}
      <div aria-hidden className="mt-6 flex justify-center">
        <svg viewBox="0 0 180 64" className="h-auto w-[150px]">
          <path d="M8 22 Q90 2 172 22 L160 26 Q90 10 20 26 Z" fill="#211b17" />
          <rect x="28" y="26" width="124" height="6" fill="#86601a" />
          <rect x="34" y="32" width="10" height="30" fill="#b3261e" />
          <rect x="85" y="32" width="10" height="30" fill="#b3261e" />
          <rect x="136" y="32" width="10" height="30" fill="#b3261e" />
          <rect x="44" y="34" width="41" height="28" fill="#62564c" opacity=".35" />
          <rect x="95" y="34" width="41" height="28" fill="#62564c" opacity=".35" />
        </svg>
      </div>
      <p className="mt-2 text-center text-[14px] leading-relaxed text-ink-soft">
        <b className="font-myeongjo text-ink">궐문 밖, 유배 자리</b>
        <br />
        {yubae.length ? `${names(yubae)}, 먼 섬으로 떠났사옵니다` : "아직 아무도 쫓겨나지 않았사옵니다"}
      </p>
      {caption && <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">{caption}</p>}
    </section>
  );
}
