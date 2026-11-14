import type { ReactNode } from "react";
import { ROLES } from "@/lib/roles";
import type { RoleKey } from "@/lib/saju";

export type BoardSeat = { role: RoleKey; name: string; score?: number };

// 조정도, drawn as 근정전 and its yard (2026-11-14 개편, 대표님 "너무 단순한데" 뒤 2판): the two-roofed hall with its
// 단청 band, latticed doors and, in the middle bay, the throne before the 일월오봉도; the 월대 with its railings and the
// 답도 stair; the stone yard of 박석 with the three-lane 어도, flanked by the 행각 corridors; each office at its 품계석,
// the closer to the throne the higher; 간신 in the shade of the 행각, the exiled outside 근정문.
// The posts carry no 東班/西班 label: the offices sit by rank, not by the real civil-east, military-west split
// (대표님 안 A). Everything is flat SVG in the brand colors, plus a muted 단청 green kept to the drawings.
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
const GREEN = "#3d6b5a";
const ROOF = "#2b2522";
const PILLAR = "#9e2a22";
const WALL = "#efe6d2";

const names = (list: BoardSeat[]) => (list.length ? list[0].name + (list.length > 1 ? ` 외 ${list.length - 1}` : "") : "");

function Dancheong({ id }: { id: string }) {
  return (
    <pattern id={id} width="14" height="8" patternUnits="userSpaceOnUse">
      <rect width="14" height="8" fill={GREEN} />
      <circle cx="7" cy="4" r="2.2" fill="#b3261e" />
      <circle cx="7" cy="4" r="1" fill="#f4ecdb" />
    </pattern>
  );
}

// 근정전: two roofs, the 단청 band, latticed doors, and the throne before the 일월오봉도 in the middle bay.
function Hall() {
  return (
    <svg viewBox="0 0 360 192" aria-hidden className="block h-auto w-full">
      <defs>
        <Dancheong id="cb-dc" />
        <pattern id="cb-lat" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#c9a865" />
          <path d="M0 3H6M3 0V6" stroke="#86601a" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="112" y="14" width="136" height="7" rx="2" fill={ROOF} />
      <path d="M106 12 l8 -8 l4 9 Z M254 12 l-8 -8 l-4 9 Z" fill={ROOF} />
      <path d="M44 50 Q70 46 92 21 L268 21 Q290 46 316 50 Q322 52 326 46 L322 56 Q180 40 38 56 L34 46 Q38 52 44 50 Z" fill={ROOF} />
      <path d="M54 52 Q180 40 306 52" stroke="#4a403a" strokeWidth="2" fill="none" />
      <rect x="86" y="55" width="188" height="9" fill="url(#cb-dc)" />
      <rect x="86" y="64" width="188" height="18" fill={WALL} />
      <g fill={PILLAR}>
        {[86, 132, 178, 223, 269].map((x) => (
          <rect key={x} x={x} y="64" width="5" height="18" />
        ))}
      </g>
      <rect x="166" y="66" width="28" height="12" fill="#0f2236" stroke="#d9b465" strokeWidth="1" />
      <text x="180" y="75.5" textAnchor="middle" className="font-myeongjo" fontSize="7.5" fontWeight="700" fill="#d9b465">
        勤政殿
      </text>
      <path d="M6 106 Q34 102 60 82 L300 82 Q326 102 354 106 Q358 107 360 100 L356 113 Q180 94 4 113 L0 100 Q2 107 6 106 Z" fill={ROOF} />
      <path d="M18 108 Q180 92 342 108" stroke="#4a403a" strokeWidth="2" fill="none" />
      <rect x="26" y="111" width="308" height="10" fill="url(#cb-dc)" />
      <rect x="26" y="121" width="308" height="56" fill={WALL} />
      <g fill="url(#cb-lat)">
        <rect x="34" y="125" width="40" height="52" />
        <rect x="82" y="125" width="44" height="52" />
        <rect x="234" y="125" width="44" height="52" />
        <rect x="286" y="125" width="40" height="52" />
      </g>
      <rect x="134" y="121" width="92" height="56" fill="#0f2236" />
      <circle cx="205" cy="133" r="5.5" fill="#b3261e" />
      <circle cx="155" cy="133" r="5.5" fill="#f4ecdb" />
      <g fill="#22324a" stroke="#d9b465" strokeWidth=".8" strokeOpacity=".8">
        <path d="M134 162 L148 146 L160 160 Z" />
        <path d="M150 162 L166 142 L180 158 Z" />
        <path d="M164 162 L180 128 L196 162 Z" />
        <path d="M180 158 L194 142 L210 162 Z" />
        <path d="M200 160 L212 146 L226 162 Z" />
      </g>
      <path d="M134 167 q6 -4 11.5 0 t11.5 0 t11.5 0 t11.5 0 t11.5 0 t11.5 0 t11.5 0 t11.5 0" stroke="#d9b465" strokeOpacity=".6" fill="none" strokeWidth=".8" />
      <rect x="166" y="160" width="28" height="17" rx="2" fill="#86601a" />
      <rect x="170" y="156" width="20" height="6" rx="1" fill="#b3261e" />
      <g fill={PILLAR}>
        {[
          [26, 7],
          [75, 7],
          [126, 8],
          [226, 8],
          [278, 7],
          [327, 7],
        ].map(([x, w]) => (
          <rect key={x} x={x} y="121" width={w} height="56" />
        ))}
      </g>
      <rect x="14" y="177" width="332" height="10" fill="#b9ad95" />
      <rect x="14" y="187" width="332" height="3" fill="#a39780" />
      <g fill="#5a4a32">
        <path d="M20 168 h14 l-2 9 h-10 Z" />
        <path d="M326 168 h14 l-2 9 h-10 Z" />
      </g>
    </svg>
  );
}

// 월대: two railed terraces and the 답도 stair with its phoenix stone in the middle.
function Woldae() {
  const posts = (from: number, to: number, step: number, y: number) =>
    Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => <rect key={`${y}-${i}`} x={from + i * step} y={y} width="3" height="8" />);
  return (
    <svg viewBox="0 0 360 62" aria-hidden className="-mt-0.5 block h-auto w-full">
      <rect x="40" y="8" width="280" height="18" fill="#cbbfa6" />
      <path d="M40 8 H156 M204 8 H320" stroke="#8f846f" strokeWidth="1" />
      <g fill="#a39780">
        {posts(44, 152, 18, 2)}
        {posts(205, 313, 18, 2)}
      </g>
      <rect x="14" y="34" width="332" height="20" fill="#d3c8b0" />
      <g fill="#a39780">
        {posts(18, 138, 20, 28)}
        {posts(219, 339, 20, 28)}
      </g>
      <path d="M14 34 H142 M218 34 H346" stroke="#8f846f" />
      <rect x="158" y="8" width="44" height="54" fill="#e2d8c3" />
      <path d="M158 16 H202 M158 24 H202 M158 42 H202 M158 50 H202" stroke="#a39780" />
      <rect x="168" y="27" width="24" height="12" fill="#cbbfa6" stroke="#8f846f" />
      <path d="M174 33 q6 -6 12 0 q-6 6 -12 0" fill="none" stroke="#86601a" strokeWidth="1.2" />
    </svg>
  );
}

// 근정문, the gate the exiled are sent out of.
function Gate() {
  return (
    <svg viewBox="0 0 360 96" aria-hidden className="-mt-0.5 block h-auto w-full">
      <defs>
        <Dancheong id="cb-dc2" />
      </defs>
      <rect x="0" y="0" width="360" height="10" fill="#d6cbb4" />
      <path d="M0 10 H360" stroke={ROOF} strokeWidth="2" />
      <path d="M60 40 Q82 38 98 22 L262 22 Q278 38 300 40 Q304 41 306 36 L303 46 Q180 32 57 46 L54 36 Q56 41 60 40 Z" fill={ROOF} />
      <rect x="120" y="15" width="120" height="6" rx="2" fill={ROOF} />
      <rect x="76" y="45" width="208" height="7" fill="url(#cb-dc2)" />
      <rect x="76" y="52" width="208" height="36" fill={WALL} />
      <g fill="#211b17" opacity=".75">
        <rect x="92" y="58" width="44" height="30" />
        <rect x="146" y="56" width="68" height="32" />
        <rect x="224" y="58" width="44" height="30" />
      </g>
      <g fill={PILLAR}>
        {[76, 138, 216, 278].map((x) => (
          <rect key={x} x={x} y="52" width="6" height="36" />
        ))}
      </g>
      <rect x="166" y="47" width="28" height="10" fill="#0f2236" stroke="#d9b465" strokeWidth=".8" />
      <text x="180" y="54.5" textAnchor="middle" className="font-myeongjo" fontSize="6.5" fontWeight="700" fill="#d9b465">
        勤政門
      </text>
      <rect x="60" y="88" width="240" height="6" fill="#b9ad95" />
    </svg>
  );
}

// 품계석: a round-topped stone on its base, the rank carved down it.
function Post({ text }: { text: string }) {
  return (
    <svg width="28" height="74" viewBox="0 0 30 74" aria-hidden className="block shrink-0">
      <path d="M5 62 V14 Q5 4 15 4 Q25 4 25 14 V62 Z" fill="#b5a98f" stroke="#8f846f" />
      <rect x="1" y="62" width="28" height="10" rx="1.5" fill="#a39780" />
      {text.split("").map((c, i) => (
        <text key={i} x="15" y={24 + i * 13} textAnchor="middle" className="font-myeongjo" fontSize="11" fontWeight="700" fill="#3e352d">
          {c}
        </text>
      ))}
    </svg>
  );
}

function Seat({ role, here, best, side }: { role: RoleKey; here: BoardSeat[]; best: boolean; side: "w" | "e" }) {
  const top = here.reduce<number | undefined>((m, s) => (s.score === undefined ? m : Math.max(m ?? 0, s.score)), undefined);
  return (
    <div className={`flex items-end gap-1.5 ${side === "w" ? "flex-row-reverse" : ""}`}>
      <Post text={POST[role] ?? ""} />
      <div
        className={`min-w-0 flex-1 rounded-lg px-2 py-2 ${
          here.length
            ? best
              ? "border-t-[3px] border-seal bg-[#fbf6ea] shadow-[inset_0_0_0_1.5px_#b3261e]"
              : "border-t-[3px] border-[#3d6b5a] bg-[#fbf6ea] shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_rgb(33_27_23/0.1)]"
            : "border-t-[3px] border-dashed border-ink/30 bg-[#fbf6ea]/45 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.18)]"
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

// The 행각 corridor along each side of the yard: a roof edge and red pillars.
const HANGGAK = {
  background: "linear-gradient(#2b2522,#2b2522) top/100% 6px no-repeat, repeating-linear-gradient(180deg,#9e2a22 0 4px,#efe6d2 4px 30px)",
  borderLeft: "2px solid #2b2522",
  borderRight: "2px solid #2b2522",
};
// 박석: irregular paving stones, drawn as a light line pattern.
const BAKSEOK = {
  backgroundColor: "#d6cbb4",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='72'%3E%3Cg fill='none' stroke='%23211b17' stroke-opacity='.13'%3E%3Cpath d='M0 14 L22 10 L40 18 L62 12 L96 16M0 40 L18 36 L44 42 L70 36 L96 40M0 62 L30 58 L52 66 L78 60 L96 64M22 10 L18 36M40 18 L44 42M62 12 L70 36M18 36 L30 58M44 42 L52 66M70 36 L78 60M86 15 L84 38M8 39 L6 60'/%3E%3C/g%3E%3C/svg%3E\")",
};

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
      <Hall />

      {/* 어좌 */}
      <div className="relative mx-2 -mt-3.5 rounded-xl bg-[#0f2236] px-4 pt-3.5 pb-4 text-hanji shadow-[inset_0_0_0_1px_rgb(217_180_101/0.4)]">
        {throne ?? (
          <>
            <p className="font-myeongjo text-[12px] font-bold tracking-[0.2em] text-[#d9b465]">御 座</p>
            <p className="mt-1 font-myeongjo text-[24px] leading-tight font-extrabold">{kingName} 전하</p>
          </>
        )}
      </div>

      <Woldae />

      {/* 행각 사이 박석 마당과 삼도 */}
      <div className="-mt-0.5 grid grid-cols-[14px_1fr_14px]">
        <div aria-hidden style={HANGGAK} />
        <div className="relative px-2.5 pt-4 pb-5" style={BAKSEOK}>
          <div aria-hidden className="absolute inset-y-0 left-1/2 grid w-11 -translate-x-1/2 grid-cols-[9px_1fr_9px]">
            <i className="block border-x border-ink/10 bg-[#ddd2bc]" />
            <i className="block bg-[#e9e0cc] shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]" />
            <i className="block border-x border-ink/10 bg-[#ddd2bc]" />
          </div>
          <p className="relative text-center font-myeongjo text-[12px] font-bold tracking-[0.4em] text-[#4a4038]">朝 廷 圖</p>
          {bestRole && (
            <p className="relative mx-auto mt-2 w-fit rounded-md bg-[#e9e0cc] px-2 py-1 text-center text-[12px] text-[#4a4038]">
              붉은 테가 전하와 가장 잘 맞는 신하이옵니다
            </p>
          )}
          {ROWS.map(([w, e]) => (
            <div key={e} className="relative mt-3.5 grid grid-cols-[1fr_44px_1fr] items-end">
              {w ? <Seat role={w} here={at(w)} best={bestRole === w} side="w" /> : <div />}
              <div />
              <Seat role={e} here={at(e)} best={bestRole === e} side="e" />
            </div>
          ))}

          {/* 행각 그늘: 간신 */}
          <div
            className="relative mt-5 rounded-lg px-3 py-2.5 text-hanji"
            style={{ background: "repeating-linear-gradient(90deg,#3a332e 0 46px,#9e2a22 46px 50px)" }}
          >
            <p className="w-fit rounded bg-[#3a332e] px-1.5 py-0.5 text-[14px] leading-snug">
              <b className="font-myeongjo text-[#f1d892]">간신</b> {names(gansin)}
              <span className="block text-[13px] text-hanji/80">
                {gansin.length ? "행각 기둥 뒤에서 엿듣는 자리" : "아직 행각 기둥 뒤에 숨은 자가 없사옵니다"}
              </span>
            </p>
          </div>
        </div>
        <div aria-hidden style={HANGGAK} />
      </div>

      <Gate />
      <p className="mt-2 text-center text-[14px] leading-relaxed text-ink-soft">
        <b className="font-myeongjo text-ink">궐문 밖, 유배 자리</b>
        <br />
        {yubae.length ? `${names(yubae)}, 먼 섬으로 떠났사옵니다` : "아직 아무도 쫓겨나지 않았사옵니다"}
      </p>
      {caption && <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">{caption}</p>}
    </section>
  );
}
