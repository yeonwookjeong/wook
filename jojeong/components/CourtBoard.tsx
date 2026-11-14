import Image from "next/image";
import type { ReactNode } from "react";
import { ROLES } from "@/lib/roles";
import type { RoleKey } from "@/lib/saju";

export type BoardSeat = { role: RoleKey; name: string; score?: number };

// 조정도, as 근정전 and its yard (2026-11-15 3판, 대표님이 뽑아 주신 그림 public/king/*): the hall with the throne
// seen through its open doors, the yard between the 행각 where each office stands at its 품계석 (the closer to the
// throne the higher), 간신 peeking from behind a 행각 pillar, and the exiled in a boat beyond 근정문.
// The posts carry no 東班/西班 label: the offices sit by rank, not by the real civil-east, military-west split (안 A).
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

const names = (list: BoardSeat[]) => (list.length ? list[0].name + (list.length > 1 ? ` +${list.length - 1}` : "") : "");

// 품계석: the stone picture with its rank carved down the face.
function Post({ text }: { text: string }) {
  return (
    <span aria-hidden className="relative block h-[76px] w-[30px] shrink-0">
      <Image src="/king/stone.webp" alt="" width={96} height={242} className="absolute inset-0 size-full object-contain" />
      <span className="absolute inset-x-0 top-[22%] flex flex-col items-center font-myeongjo text-[12px] leading-[1.15] font-bold text-[#4a3f35]">
        {text.split("").map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
    </span>
  );
}

function Seat({ role, here, best, side }: { role: RoleKey; here: BoardSeat[]; best: boolean; side: "w" | "e" }) {
  const top = here.reduce<number | undefined>((m, s) => (s.score === undefined ? m : Math.max(m ?? 0, s.score)), undefined);
  return (
    <div className={`flex items-end gap-1 ${side === "w" ? "flex-row-reverse" : ""}`}>
      <Post text={POST[role] ?? ""} />
      <div
        className={`min-w-0 flex-1 rounded-lg px-2 py-2 ${
          here.length
            ? best
              ? "bg-[#fbf6ea] shadow-[0_2px_6px_rgb(0_0_0/0.25),inset_0_0_0_2px_#b3261e]"
              : "bg-[#fbf6ea]/95 shadow-[0_2px_6px_rgb(0_0_0/0.2)]"
            : "bg-[#fbf6ea]/60 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.35)] outline-1 -outline-offset-4 outline-ink/30 outline-dashed"
        }`}
      >
        <p className="font-myeongjo text-[14px] leading-tight font-bold">{ROLES[role].title}</p>
        <p className="mt-1 flex items-baseline justify-between gap-1 text-[14px] leading-tight">
          <span className={`truncate whitespace-nowrap ${here.length ? "" : "text-ink-soft"}`}>{here.length ? names(here) : "비어 있음"}</span>
          {top !== undefined && <span className={`shrink-0 text-[12px] font-bold ${best ? "text-seal" : "text-gold"}`}>{top}점</span>}
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
      {/* 근정전 */}
      <Image src="/king/hall.webp" alt="열린 문 안으로 어좌가 보이는 근정전" width={1080} height={700} priority className="block h-auto w-full" />

      {/* 어좌 */}
      <div className="relative z-10 mx-2 -mt-4 rounded-xl bg-[#0f2236] px-4 pt-3.5 pb-4 text-hanji shadow-[0_8px_20px_rgb(15_34_54/0.3),inset_0_0_0_1px_rgb(217_180_101/0.4)]">
        {throne ?? (
          <>
            <p className="font-myeongjo text-[12px] font-bold tracking-[0.2em] text-[#d9b465]">御 座</p>
            <p className="mt-1 font-myeongjo text-[24px] leading-tight font-extrabold">{kingName} 전하</p>
          </>
        )}
      </div>

      {/* 행각 사이 마당 */}
      <div
        className="relative -mt-8 overflow-hidden rounded-b-xl px-2.5 pt-28 pb-5"
        style={{ background: "url(/king/yard.webp) top / 100% auto no-repeat, linear-gradient(#f4ecdb 0 64px, #7d6a5a 64px)" }}
      >
        <p className="relative mx-auto w-fit rounded-md bg-[#211b17]/70 px-3 py-1 text-center font-myeongjo text-[12px] font-bold tracking-[0.3em] text-[#f1d892]">
          朝 廷 圖
        </p>
        {bestRole && (
          <p className="relative mx-auto mt-2 w-fit rounded-md bg-[#fbf6ea]/90 px-2 py-1 text-center text-[12px] text-[#4a4038]">
            붉은 테가 전하와 가장 잘 맞는 신하이옵니다
          </p>
        )}
        {ROWS.map(([w, e]) => (
          <div key={e} className="relative mt-3 grid grid-cols-[1fr_40px_1fr] items-end">
            {w ? <Seat role={w} here={at(w)} best={bestRole === w} side="w" /> : <div />}
            <div />
            <Seat role={e} here={at(e)} best={bestRole === e} side="e" />
          </div>
        ))}

        {/* 행각 기둥 뒤: 간신 */}
        <div className="relative mt-5 flex items-end gap-3 overflow-hidden rounded-lg bg-[#211b17]/85 pr-3 text-hanji">
          <Image src="/king/gansin.webp" alt="행각 기둥 뒤에서 엿보는 간신" width={360} height={514} className="-mb-1 h-[104px] w-auto shrink-0" />
          <p className="py-3 text-[14px] leading-snug">
            <b className="font-myeongjo text-[#f1d892]">간신</b> {names(gansin)}
            <span className="block text-[13px] text-hanji/80">
              {gansin.length ? "행각 기둥 뒤에서 엿듣고 있사옵니다" : "아직 기둥 뒤에 숨은 자가 없사옵니다"}
            </span>
          </p>
        </div>
      </div>

      {/* 근정문과 그 밖의 유배 */}
      <Image src="/king/gate.webp" alt="근정문" width={1080} height={452} className="mt-6 block h-auto w-full" />
      <div className="relative mt-2">
        <Image src="/king/exile.webp" alt="유배 가는 배와 섬" width={720} height={392} className="mx-auto block h-auto w-[84%]" />
        <p className="mt-1 text-center text-[14px] leading-relaxed text-ink-soft">
          <b className="font-myeongjo text-ink">궐문 밖, 유배 가는 배</b>
          <br />
          {yubae.length ? `${names(yubae)}, 먼 섬으로 떠났사옵니다` : "아직 아무도 태우지 않았사옵니다"}
        </p>
      </div>
      {caption && <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">{caption}</p>}
    </section>
  );
}
