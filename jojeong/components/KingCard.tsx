import RoyalDoc from "./RoyalDoc";
import { kingLinkText } from "@/lib/kings";
import { KING_TYPES } from "@/lib/kingTypes";
import { sillok } from "@/lib/sillok";
import { STEMS, STEMS_KO, type Pillars } from "@/lib/saju";

// 어진(御眞) frame: the king's portrait hung in front of the 일월오봉도, with the 오조룡 roundel of the royal robe in
// place of a face until the portrait art arrives. The roundel carries the day stem the whole reading hangs on.
function Eojin({ stem }: { stem: number }) {
  return (
    <div className="relative mx-auto w-[220px] rounded-md border-[5px] border-[#b8862f] bg-[#1d2b3a] p-1 shadow-[0_8px_20px_rgb(0_0_0/0.35)]">
      <div className="relative overflow-hidden rounded-sm border border-[#e2bc68]/60">
        <svg viewBox="0 0 200 230" className="block w-full" aria-hidden>
          <rect width="200" height="230" fill="#1d2b3a" />
          <circle cx="40" cy="36" r="15" fill="#d23b2a" />
          <circle cx="160" cy="36" r="15" fill="#f3ead0" />
          <path d="M0 230 L0 150 L30 110 L60 140 L100 80 L140 140 L170 110 L200 150 L200 230 Z" fill="#2f6b5f" />
          <path d="M0 230 L0 175 L30 140 L60 165 L100 115 L140 165 L170 140 L200 175 L200 230 Z" fill="#244f47" />
          <path d="M0 205 Q25 195 50 205 T100 205 T150 205 T200 205 L200 230 L0 230 Z" fill="#3c6f8f" />
        </svg>
        {/* 곤룡포 가슴의 오조룡 보(補): gold roundel with the day stem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-[104px] flex-col items-center justify-center rounded-full border-[3px] border-[#e2bc68] bg-[radial-gradient(circle_at_40%_35%,#c0392b,#7d1a14)] shadow-[0_0_0_4px_rgb(29_43_58),0_0_0_6px_#b8862f]">
            <span className="font-myeongjo text-[44px] leading-none font-extrabold text-[#f7d58a]">{STEMS[stem]}</span>
            <span className="mt-1 text-[11px] font-bold tracking-widest text-[#f7e3ad]/90">{STEMS_KO[stem]} 일간</span>
          </div>
        </div>
      </div>
      <p className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-sm border border-[#b8862f] bg-[#1c1712] px-3 py-0.5 font-myeongjo text-[11px] font-extrabold tracking-[0.3em] whitespace-nowrap text-[#f1cf7a]">
        御 眞
      </p>
    </div>
  );
}

export default function KingCard({ kingName, pillars }: { kingName: string; pillars: Pillars }) {
  const type = KING_TYPES[pillars.dayStem];
  const s = sillok(pillars, { kingName });
  const { link, short } = kingLinkText(pillars);

  return (
    <RoyalDoc paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">卽 位 敎 書</p>
      <div className="mt-5">
        <Eojin stem={pillars.dayStem} />
      </div>
      <p className="mt-7 text-center text-sm text-ink-soft">{kingName} 전하는</p>
      <p className="mt-1 text-center font-myeongjo text-4xl font-extrabold">{type.title}</p>
      {!s.deposed && (
        <p className="mt-2 text-center text-sm">
          훗날 올릴 존호 <b className="font-myeongjo text-base text-gold">{s.epithet}</b>
        </p>
      )}
      <p className="mt-1 text-center text-xs font-bold text-gold">{type.symbol}</p>
      <p className="mt-3 text-center text-[15px] break-keep">&ldquo;{type.tagline}&rdquo;</p>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{type.style}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          ["강점", type.strength],
          ["약점", type.weakness],
          ["곁에 둘 신하", type.keep],
          ["경계할 신하", type.beware],
        ].map(([k, v]) => (
          <div key={k} className="border border-seal/20 px-3 py-2">
            <dt className={`text-xs font-bold ${k === "경계할 신하" || k === "약점" ? "text-seal" : "text-gold"}`}>{k}</dt>
            <dd className="mt-0.5 leading-snug">{v}</dd>
          </div>
        ))}
      </dl>

      {link.kind !== "none" && (
        <p className="mt-4 border-t border-seal/20 pt-3 text-center text-[12px] leading-relaxed text-ink-soft">
          실록 속 조선 왕 가운데 <b className="text-ink">{short}</b>
        </p>
      )}
    </RoyalDoc>
  );
}
