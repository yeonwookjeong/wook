import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import Hundo from "@/components/Hundo";
import NextStep from "@/components/NextStep";
import SaveCard from "@/components/SaveCard";
import { iljuBySlug, iljuHead, iljuMatches } from "@/lib/iljuBook";
import { monthPillarNow, rankMonth } from "@/lib/iljuRank";
import { readMe } from "@/lib/me";
import { ELEMENT_HANJA } from "@/lib/myeongri";
import { STEPS } from "@/lib/nextStep";

// 60일주 사전, one day pillar: first something to look at (its card, which a reader can save or post), then
// something to read (what people say about them, love, work, money, the moment it hurts and the one it shines),
// then whom it meets well and the month's rank, and the reasons last, folded.

// Each element in its colour, and in a word anyone reads.
const EL_COLOR = ["#3d6656", "#b3261e", "#a87a22", "#7d8590", "#1f3d5c"];
const EL_WORD = ["나무", "불", "흙", "쇠", "물"];

export async function generateMetadata({ params }: PageProps<"/ilju/[slug]">): Promise<Metadata> {
  const e = iljuBySlug((await params).slug);
  if (!e) return {};
  const f = iljuHead(e);
  return {
    title: `${f.name}(${f.hanja}) 성격 · 연애 · 궁합`,
    description: `${f.name}, ${f.image}. ${e.heard[0]} 연애·일·돈 쓰는 법, 잘 맞는 일주와 이번 달 순위까지.`,
    // A sample until the pages are reviewed: kept out of search for now.
    robots: { index: false },
  };
}

export default async function IljuPage({ params }: PageProps<"/ilju/[slug]">) {
  const e = iljuBySlug((await params).slug);
  if (!e) notFound();
  const f = iljuHead(e);
  const { best, worst } = iljuMatches(e.stem, e.branch);
  const mp = monthPillarNow();
  const rank = rankMonth(mp.stem, mp.branch).find((r) => r.stem === e.stem && r.branch === e.branch)!;
  const me = await readMe();
  const mine = me && me.person.pillars.dayStem === e.stem && me.person.pillars.dayBranch === e.branch;
  const nn = String(f.no).padStart(2, "0");

  const reads = [
    { seal: "戀", title: "연애할 때", text: e.love },
    { seal: "業", title: "일할 때", text: e.work },
    { seal: "財", title: "돈 쓸 때", text: e.money },
    { seal: "傷", title: "서운한 순간", text: e.hurt },
    { seal: "光", title: "빛나는 순간", text: e.shine },
  ];

  return (
    <>
      <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-syuku.woff2) format("woff2");font-display:block}`}</style>

      <section className="mt-5">
        {mine && <p className="mb-2 text-center text-sm font-extrabold text-seal">{me!.person.name}님의 일주예요</p>}
        <SaveCard file={`hundosaju-${e.slug}`}>
          {/* The card: the same face as the Instagram 60일주 도감 cover. */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#0f2236,#17304a_55%,#1f3d5c)] p-4">
            <div className="flex items-center justify-between px-1 text-[11px] font-extrabold">
              <span className="flex items-center gap-1.5 text-hanji">
                <span className="grid size-6 -rotate-3 place-items-center border-2 border-seal bg-hanji text-[8px] leading-none text-seal">
                  訓<br />導
                </span>
                훈도사주
              </span>
              <span className="text-[#d4af5f]">{nn} / 60</span>
            </div>
            <div className="doc-paper mx-auto mt-3 flex h-[78%] w-[86%] flex-col items-center px-3 pt-4 text-center text-ink">
              <p className="bg-ink px-3 py-1 text-[11px] font-extrabold text-hanji">
                60일주 도감 <span className="text-[#f1cf7a]">No.{nn}</span>
              </p>
              <p className="mt-2 text-[11px] text-ink-soft">육십갑자의 {f.no}번째 자리</p>
              <p className="mt-1 text-[84px] leading-none text-seal" style={{ fontFamily: '"GanzhiBrush", var(--font-heading)' }}>
                {f.hanja}
              </p>
              <p className="mt-1 font-myeongjo text-2xl font-extrabold">{f.name}</p>
              <p className="mt-1 text-[13px] text-ink-soft">{f.image}</p>
              <div className="mt-3 flex gap-1.5 text-[11px] font-extrabold text-white">
                {[f.stemEl, f.branchEl].map((el, i) => (
                  <span key={i} className="rounded-full px-2.5 py-0.5" style={{ background: EL_COLOR[el] }}>
                    {ELEMENT_HANJA[el]} {EL_WORD[el]}
                  </span>
                ))}
              </div>
              {/* One line to read on the saved image too. */}
              <p className="mt-auto mb-4 border-t border-dashed border-seal/30 px-1 pt-3 text-[12.5px] leading-snug font-bold">{e.heard[0]}</p>
            </div>
            <div className="absolute bottom-3 left-4 flex items-end gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hundo-face.png" alt="" className="size-14 rounded-full border-[3px] border-[#d4af5f] bg-hanji object-cover" />
            </div>
            <p className="absolute right-4 bottom-4 text-[10px] tracking-wider text-hanji/80">hundosaju.com</p>
          </div>
        </SaveCard>
      </section>

      <section className="mt-6">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">이런 말, 자주 듣지 않나요?</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {e.heard.map((h) => (
            <li key={h} className="rounded-2xl rounded-bl-sm border border-ink/10 bg-white/80 px-4 py-3 text-[15px] leading-relaxed shadow-sm">
              {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        {reads.map((r) => (
          <div key={r.seal} className="doc-paper flex gap-3 px-4 py-3.5">
            <span className="grid size-10 shrink-0 -rotate-3 place-items-center border-2 border-seal font-myeongjo text-lg font-extrabold text-seal">{r.seal}</span>
            <span className="min-w-0 flex-1">
              <b className="block text-[13px] text-seal">{r.title}</b>
              <span className="block text-[15px] leading-relaxed">{r.text}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="doc-paper mt-6 px-4 py-4">
        <h2 className="font-myeongjo text-lg font-extrabold">{f.name}와 잘 맞는 일주</h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
          {best.map((m) => (
            <li key={m.hanja} className="rounded-xl bg-[#3d6656]/10 px-1 py-3">
              <span className="block text-3xl leading-none text-[#3d6656]" style={{ fontFamily: '"GanzhiBrush", var(--font-heading)' }}>
                {m.hanja}
              </span>
              <b className="mt-1 block text-[13px]">{m.name}일주</b>
              <span className="block text-[11px] leading-snug text-ink-soft">{m.plain}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-myeongjo font-extrabold">부딪히기 쉬운 일주</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-center">
          {worst.map((m) => (
            <li key={m.hanja} className="rounded-xl bg-ink/5 px-1 py-3">
              <span className="block text-2xl leading-none text-ink-soft" style={{ fontFamily: '"GanzhiBrush", var(--font-heading)' }}>
                {m.hanja}
              </span>
              <b className="mt-1 block text-[13px]">{m.name}일주</b>
              <span className="block text-[11px] leading-snug text-ink-soft">{m.plain}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/ranking" className="doc-paper mt-4 flex items-center gap-4 px-4 py-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-[#8a6214] bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e2bd62_45%,#a87a22)] font-myeongjo text-xl font-extrabold text-[#8a6214]">
          {rank.rank}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[12px] text-seal">
            이번 달 {mp.label} · 60일주 중 {rank.rank}위
          </b>
          <span className="block text-[14px] leading-snug">{rank.line}</span>
        </span>
        <span className="shrink-0 text-xs font-bold text-seal">순위 →</span>
      </Link>

      <section className="mt-6">
        <Hundo>{e.hundo}</Hundo>
      </section>

      <NextStep from="ilju" steps={STEPS.ilju(f.name)} />

      <details className="group doc-paper mt-5 px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-myeongjo font-extrabold [&::-webkit-details-marker]:hidden">
          이 풀이의 근거
          <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-ink-soft">
          {e.basis.map((b) => (
            <li key={b}>{b}</li>
          ))}
          {[...best, ...worst].map((m) => (
            <li key={`w-${m.hanja}`}>
              {m.name}일주: {m.why}
            </li>
          ))}
        </ul>
      </details>

      <AdSlot />
    </>
  );
}
