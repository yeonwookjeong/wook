import { ELEMENT_HANJA, ELEMENT_KO } from "@/lib/myeongri";
import { MATERIAL, type HopaeInput } from "@/lib/hopae";
import HopaeFace from "./HopaeFace";
import type { Rank } from "@/lib/sinbun";
import type { FreeReading } from "@/lib/freeReading";

// The cards a reader saves or posts (components/SaveCard.tsx): the same navy frame as the Instagram cards, a
// paper block with the result, 정 훈도 and the address. Results only; never a birth date or the eight characters.

const GOLD = "#d4af5f";
const RANK_COLOR: Record<Rank, string> = { 양반: "#a87a22", 중인: "#3d6656", 상민: "#211b17", 천민: "#b3261e" };
const POWER_COLOR: Record<FreeReading["powers"][number]["group"], string> = { 인성: "#b3261e", 비겁: "#a87a22", 관성: "#222d3b", 재성: "#6b7f5a", 식상: "#8a6e9e" };

// `say`: what 정 훈도 asks at the foot, in a bubble beside his face (outside the paper, so a long result never
// pushes it out of the frame).
function Frame({ no, say, children }: { no: string; say: string; children: React.ReactNode }) {
  return (
    <div className="relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#0f2236,#17304a_55%,#1f3d5c)] p-4">
      <div className="flex items-center justify-between px-1 text-[11px] font-extrabold">
        <span className="flex items-center gap-1.5 text-hanji">
          <span className="grid size-6 -rotate-3 place-items-center border-2 border-seal bg-hanji text-[8px] leading-none text-seal">
            訓<br />導
          </span>
          훈도사주
        </span>
        <span style={{ color: GOLD }}>{no}</span>
      </div>
      <div className="doc-paper mx-auto mt-3 flex min-h-0 w-[90%] flex-1 flex-col items-center overflow-hidden px-3 py-4 text-center text-ink">{children}</div>
      <div className="mt-3 flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hundo-face.png" alt="" className="size-12 shrink-0 rounded-full border-[3px] bg-hanji object-cover" style={{ borderColor: GOLD }} />
        <p className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug font-bold text-ink">{say}</p>
        <span className="shrink-0 text-[10.5px] tracking-wider text-hanji/80">hundosaju.com</span>
      </div>
    </div>
  );
}

// The 신분 감정 card: the 호패 alone on the night with its glow, the life under it. With no tag (a shared link
// that carries no birth year), the plain paper card.
export function SinbunCard({ who, rank, job, line, rise, yong, tag, rarity }: { who: string; rank: Rank; job: string; line: string; rise: number; yong: number; tag?: HopaeInput; rarity?: string }) {
  if (!tag) return <SinbunPaperCard who={who} rank={rank} job={job} line={line} rise={rise} yong={yong} />;
  const m = MATERIAL[rank];
  return (
    <div className="relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_38%,#24456a,transparent_60%),linear-gradient(180deg,#0b1626,#13263d_50%,#0f2236)] p-3.5 text-hanji">
      <div className="flex items-center justify-between px-1 text-[11px] font-extrabold">
        <span className="flex items-center gap-1.5">
          <span className="grid size-6 -rotate-3 place-items-center border-2 border-seal bg-hanji text-[8px] leading-none text-seal">
            訓<br />導
          </span>
          훈도사주
        </span>
        <span style={{ color: GOLD }}>조선 신분 감정 · 호패</span>
      </div>
      <p className="mt-1 text-center text-[11px] text-hanji/70">{who}</p>
      {/* The tag takes the height left between the head and the words, its width following. */}
      <div className="flex min-h-0 flex-1 justify-center py-1">
        <div className="h-full" style={{ aspectRatio: "510 / 1000" }}>
          <HopaeFace tag={tag} id="card" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-myeongjo text-[24px] leading-tight font-extrabold">{job}</p>
        <p className="mt-0.5 text-[11.5px] text-hanji/80">{line}</p>
        <p className="mt-1.5 flex flex-wrap items-center justify-center gap-1 text-[10px]">
          {rarity && (
            <span className="rounded-full px-2 py-px font-extrabold text-[#0f2236]" style={{ background: GOLD }}>
              {rarity}
            </span>
          )}
          <span className="rounded-full border px-2 py-px font-extrabold" style={{ borderColor: `${GOLD}99`, color: GOLD }}>
            {rank} · {m.name} {m.hanja}
          </span>
        </p>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn into an image */}
        <img src="/hundo-face.png" alt="" className="size-10 shrink-0 rounded-full border-[3px] bg-hanji object-cover" style={{ borderColor: GOLD }} />
        <p className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug font-bold text-ink">너는 조선에서 뭐였을까?</p>
        <span className="shrink-0 text-[10px] tracking-wider text-hanji/80">hundosaju.com</span>
      </div>
    </div>
  );
}

function SinbunPaperCard({ who, rank, job, line, rise, yong }: { who: string; rank: Rank; job: string; line: string; rise: number; yong: number }) {
  return (
    <Frame no="조선 신분 감정" say="너는 조선에서 뭐였을까?">
      <p className="text-[13px] text-ink-soft">{who}</p>
      <span className="mt-2 border-2 px-3 py-0.5 font-myeongjo text-base font-extrabold" style={{ color: RANK_COLOR[rank], borderColor: RANK_COLOR[rank] }}>
        {rank}
      </span>
      <p className="mt-2 font-myeongjo text-[26px] leading-tight font-extrabold">{job}</p>
      <p className="mt-1.5 px-1 text-[12.5px] leading-snug text-ink-soft">{line}</p>
      <div className="mt-auto grid w-full grid-cols-2 gap-1.5 text-[11px]">
        <div className="border border-seal/25 py-1">
          <span className="block text-ink-soft">출세 가능성</span>
          <span className="text-sm tracking-tighter">
            <span style={{ color: GOLD }}>{"★".repeat(rise)}</span>
            <span className="text-ink/15">{"★".repeat(5 - rise)}</span>
          </span>
        </div>
        <div className="border border-seal/25 py-1">
          <span className="block text-ink-soft">귀인의 기운</span>
          <b className="font-myeongjo text-sm">
            {ELEMENT_KO[yong]}({ELEMENT_HANJA[yong]})
          </b>
        </div>
      </div>
    </Frame>
  );
}

export function ReadingCard({
  who,
  ilju,
  image,
  powers,
  kinds,
  same,
}: {
  who: string;
  ilju: { hanja: string; name: string } | null;
  image: string | null;
  powers: FreeReading["powers"];
  kinds: { label: string; type: string }[];
  // "같은 신묘일주 가운데 약 3%만 이 구조" when the chart has a build of its own.
  same: string | null;
}) {
  const shown = [...powers].filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct);
  const top = shown[0];
  return (
    <Frame no="나의 사주 한 장" say={same ?? "너의 사주는 어때?"}>
      <p className="font-myeongjo text-[11px] font-extrabold tracking-[0.35em] text-seal">四 柱 一 張</p>
      <p className="mt-1.5 text-[13px] text-ink-soft">{who}</p>
      {ilju && (
        <>
          <p className="mt-1 text-[44px] leading-none text-seal" style={{ fontFamily: '"GanzhiBrush", var(--font-heading)' }}>
            {ilju.hanja}
          </p>
          <p className="mt-0.5 font-myeongjo text-lg font-extrabold">{ilju.name}일주</p>
          {image && <p className="text-[12px] text-ink-soft">{image}</p>}
        </>
      )}
      <div className="mt-2 w-full">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {shown.map((x) => (
            <span key={x.group} style={{ width: `${x.pct}%`, background: POWER_COLOR[x.group] }} />
          ))}
        </div>
        <p className="mt-1.5 text-[12px]">
          가장 큰 힘 <b style={{ color: POWER_COLOR[top.group] }}>{top.name} {top.pct}%</b>
        </p>
      </div>
      <ul className="mt-2 flex w-full flex-col gap-0.5 text-[12px]">
        {kinds.map((k) => (
          <li key={k.label} className="flex justify-between border-b border-seal/15 pb-1 last:border-b-0">
            <span className="text-ink-soft">{k.label}</span>
            <b className="font-myeongjo">{k.type}</b>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
