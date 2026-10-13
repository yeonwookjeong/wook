import Image from "next/image";
import { hanjaDate, PART_LABELS, paragraphs, segments } from "@/lib/askText";
import type { Person } from "@/lib/pairToken";
import { BRANCHES, hourStemOf, STEMS } from "@/lib/saju";

// The pieces of 정 훈도's consultation room (app/ask/[id], and the owner's trial room in app/admin/ask): the room's
// head with the eight characters, a guest's question, and his answer as a letter (答書) closed with his seal.

export function HundoFace({ size, ring = "gold" }: { size: number; ring?: "gold" | "seal" }) {
  return (
    <span
      className={`block shrink-0 overflow-hidden rounded-full bg-[#f9f1de] ${ring === "gold" ? "shadow-[0_0_0_2px_#d4af5f,0_0_0_4px_#222d3b,0_0_0_5px_rgb(212_175_95/0.4)]" : "shadow-[0_0_0_1.5px_#b3261e]"}`}
      style={{ width: size, height: size }}
    >
      <Image src="/hundo-face.png" alt="" width={size * 2} height={size * 2} sizes={`${size}px`} className="h-full w-full object-cover" />
    </span>
  );
}

function Pillar({ label, stem, branch, me }: { label: string; stem: number | undefined; branch: number | null | undefined; me?: boolean }) {
  const known = stem !== undefined && branch !== undefined && branch !== null;
  return (
    <div className={`rounded-lg border py-1.5 text-center ${me ? "border-[#d4af5f] bg-[#d4af5f]/12" : "border-[#d4af5f]/35 bg-white/[0.04]"}`}>
      <small className="block text-[10px] opacity-60">{label}</small>
      <b className="block font-myeongjo text-[22px] leading-[1.15] font-normal">
        {known ? (
          <>
            {STEMS[stem]}
            <br />
            {BRANCHES[branch]}
          </>
        ) : (
          <span className="text-[13px] leading-[2.6] opacity-60">모름</span>
        )}
      </b>
    </div>
  );
}

// `bare`: inside the room (app/ask/Hall.tsx Room), with no box of its own.
export function RoomHead({ person, ilju, credits, extra, bare = false }: { person: Person; ilju: string; credits?: number; extra?: string; bare?: boolean }) {
  const p = person.pillars;
  const hourStem = p.hourBranch === null ? undefined : (p.hourStem ?? hourStemOf(p.dayStem, p.hourBranch));
  return (
    <section className={bare ? "mt-4 px-1" : "jjok-box mt-3 px-4 pt-4 pb-3"}>
      <div className="flex items-center gap-3">
        <HundoFace size={50} />
        <div className="min-w-0 flex-1">
          {!bare && <p className="font-myeongjo text-[11px] font-bold tracking-[0.25em] text-[#d4af5f]">觀象監 · 問訓導</p>}
          <h1 className="font-myeongjo text-[19px] font-extrabold">정 훈도의 사랑방</h1>
          <p className="truncate text-[12.5px] opacity-75">
            {person.name}님 · {ilju}
            {extra ? ` · ${extra}` : ""}
          </p>
        </div>
        {credits !== undefined && (
          <span className="shrink-0 rounded-full border border-[#d4af5f]/60 px-3 py-1 text-[12px]">
            남은 질문 <b className="font-myeongjo text-[15px] text-[#d4af5f]">{credits}</b>
          </span>
        )}
      </div>
      <div className="mt-3.5 grid grid-cols-4 gap-1.5">
        <Pillar label="時" stem={hourStem} branch={p.hourBranch} />
        <Pillar label="日 · 나" stem={p.dayStem} branch={p.dayBranch} me />
        <Pillar label="月" stem={p.monthStem} branch={p.monthBranch} />
        <Pillar label="年" stem={p.yearStem} branch={p.yearBranch} />
      </div>
      <p className="mt-2 text-center text-[11px] opacity-55">이 여덟 글자로만 답해 드려요 · 생년월일은 저장하지 않아요</p>
    </section>
  );
}

const when = (t: number) => {
  const d = new Date(t + 9 * 3600000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${d.toISOString().slice(11, 16)}`;
};

// `slip`: in the room, the question as a folded paper slip handed across the floor.
export function Question({ text, topic, at, slip = false }: { text: string; topic?: string; at: number; slip?: boolean }) {
  if (slip)
    return (
      <div className="ml-12 rounded-[6px] rounded-br-[2px] bg-[#f3e7c7] px-4 py-2.5 text-[15px] leading-relaxed text-ink shadow-[0_3px_10px_rgb(0_0_0/0.35)] [background-image:repeating-linear-gradient(90deg,rgb(120_90_40/0.05)_0_1px,transparent_1px_14px)]">
        {topic && <span className="block text-[11px] font-bold text-seal">{topic}</span>}
        <p className="whitespace-pre-wrap">{text}</p>
        <span className="mt-0.5 block text-right text-[10.5px] text-ink-soft">{when(at)}</span>
      </div>
    );
  return (
    <div className="ml-12 rounded-[18px] rounded-br-[4px] bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-hanji">
      {topic && <span className="block text-[11px] font-bold opacity-65">{topic}</span>}
      <p className="whitespace-pre-wrap">{text}</p>
      <span className="mt-0.5 block text-right text-[10.5px] opacity-55">{when(at)}</span>
    </div>
  );
}

// His answer as a letter. The last paragraph (today's one step and a warm word) sits apart in a red-ruled box.
// `figure`: draws a picture an answer marks ([[圖|合沖]]) under its paragraph (시안 모드: app/ask/Figures.tsx);
// without it the marks are simply left out.
// `top`: the verdict card under the heading (시안 모드).
export function AnswerLetter({
  id,
  name,
  text,
  at,
  figure,
  top,
}: {
  id?: string;
  name: string;
  text: string;
  at: number;
  figure?: (key: string) => React.ReactNode;
  top?: React.ReactNode;
}) {
  const paras = paragraphs(text);
  const figs = (keys: string[]) => (figure ? keys.map((k) => <div key={k}>{figure(k)}</div>) : null);
  return (
    <article id={id} className="doc-paper relative rounded-[4px] px-6 pt-6 pb-5">
      <span aria-hidden className="absolute top-5 right-5 font-myeongjo text-[24px] tracking-[0.1em] text-seal/85 [writing-mode:vertical-rl]">
        答書
      </span>
      <header className="flex items-center gap-2.5 border-b border-seal/25 pb-3.5">
        <HundoFace size={38} ring="seal" />
        <div>
          <p className="font-myeongjo text-[15px] font-extrabold">정 훈도가 아뢰옵니다</p>
          <p className="text-[11.5px] text-ink-soft">{name}님의 여덟 글자를 펼쳐 놓고</p>
        </div>
      </header>
      {top}
      <div className="font-myeongjo text-[16px] leading-[1.95] tracking-[-0.01em] break-keep">
        {paras.map((p, i) => {
          const body = segments(p.text).map((s, j) =>
            s.key ? (
              <mark key={j} className="bg-transparent bg-[linear-gradient(transparent_58%,rgb(212_175_95/0.45)_58%)] font-semibold text-inherit [box-decoration-break:clone]">
                {s.text}
              </mark>
            ) : (
              <span key={j}>{s.text}</span>
            ),
          );
          const head = p.part && (
            <span className="mb-1 block font-sans text-[11px] font-bold tracking-[0.18em] text-seal">
              <span className="font-myeongjo text-[13px] tracking-[0.12em]">{p.part}</span> · {p.head ?? PART_LABELS[p.part]}
            </span>
          );
          // The closing step sits apart: the one marked 一事, or (answers before the marks) the last of three or more.
          const last = p.part ? p.part === "一事" : i === paras.length - 1 && paras.length > 2;
          return last ? (
            <div key={i}>
              <p aria-hidden className="mt-4 text-center text-[18px] text-gold">
                ❦
              </p>
              <div className="mt-3 rounded-r-lg border-l-[3px] border-seal bg-seal/5 px-3.5 py-3">
                {head}
                <p>{body}</p>
              </div>
              {figs(p.figs)}
            </div>
          ) : (
            <div key={i} className={p.part ? "mt-5" : "mt-4"}>
              {head}
              <p>{body}</p>
              {figs(p.figs)}
            </div>
          );
        })}
      </div>
      <footer className="mt-5 flex items-center justify-end gap-2.5 text-right font-myeongjo text-[12.5px] leading-snug text-ink-soft">
        <span>
          {hanjaDate(at)}
          <br />
          관상감 훈도 정 올림
        </span>
        <span className="grid h-11 w-11 -rotate-[4deg] place-items-center rounded-[5px] bg-seal text-center font-myeongjo text-[16px] leading-[1.05] text-[#f9f1de] shadow-[inset_0_0_0_2px_#b3261e,inset_0_0_0_3.5px_rgb(249_241_222/0.7)]">
          訓<br />導
        </span>
      </footer>
    </article>
  );
}
