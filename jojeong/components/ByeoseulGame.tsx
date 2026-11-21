"use client";

import { useMemo, useState } from "react";
import type { Pillars } from "@/lib/saju";
import { RANK_NAME, TRACK, rankLabel, type Office } from "@/lib/byeoseulRanks";
import { boardOf, nameAt, nextScene, roadEnds, start, tierOf, TRAIT_WORD, walk, type Board, type Door, type Life, type Scene, type Tier } from "@/lib/byeoseulSim";
import POP from "@/lib/byeoseulPop.json";
import TrackLink from "./TrackLink";

// 벼슬길 (2026-11-17, 대표님 "선택극장처럼, 내 사주로 옛날 벼슬 시뮬레이션"): nine scenes, four doors each. Pick a door
// and its outcome lands at once, decided by the chart (the same door goes well for one chart and badly for
// another), the office moves up or down a ladder of real Joseon offices, and the doors not taken can be opened to
// see what they would have brought. The end names the office reached and how far every road would have gone.

const NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const DOOR_MARK = ["甲", "乙", "丙", "丁"];
const TIER_LABEL: Record<Tier, { word: string; cls: string }> = {
  0: { word: "잘 풀림", cls: "bg-[#1f6b4a] text-white" },
  1: { word: "그럭저럭", cls: "bg-ink/10 text-ink" },
  2: { word: "역풍", cls: "bg-seal text-white" },
};

// 관복 색: 7품 아래 초록, 3품에서 6품 파랑, 당상 이상 빨강.
const robe = (o: Office) => (o.dangsang || o.rank >= 14 ? "#b3261e" : o.rank >= 6 ? "#1d4e89" : "#2f6b3f");

function Ladder({ office }: { office: Office }) {
  return (
    <div className="flex h-2 w-full gap-[2px]" aria-hidden>
      {RANK_NAME.map((r, i) => (
        <span key={r} className="flex-1 rounded-[2px]" style={{ background: i <= office.rank ? robe(office) : "rgb(33 27 23 / 0.1)" }} />
      ))}
    </div>
  );
}

function Hud({ b, l }: { b: Board; l: Life }) {
  const o = TRACK[l.track].ladder[l.index];
  const started = l.steps.length > 1;
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-[#f3ebdd]/95 px-4 pt-2 pb-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-3 shrink-0 rounded-full" style={{ background: robe(o) }} />
          <p className="truncate font-myeongjo text-[14px] font-extrabold">{started ? `${rankLabel(o)} ${nameAt(b, l.track, l.index)}` : "아직 벼슬이 없는 선비"}</p>
        </div>
        <p className="shrink-0 text-[13px] tracking-wider text-seal">{"♥".repeat(Math.max(0, Math.min(5, l.life)))}</p>
      </div>
      <div className="mt-1.5">
        <Ladder office={started ? o : { rank: -1, name: "" }} />
        <div className="mt-0.5 flex justify-between text-[10px] text-ink-soft">
          <span>종9품</span>
          <span>정1품</span>
        </div>
      </div>
    </div>
  );
}

function Art({ name }: { name: string }) {
  const cut = name === "gansin" || name === "exile" || name === "gate";
  return (
    <div className="relative h-40 overflow-hidden bg-[#0f2236]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/king/${name}.webp`} alt="" className={`size-full ${cut ? "object-contain p-3" : "object-cover"}`} />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fbf7ef] to-transparent" />
    </div>
  );
}

const fill = (text: string, b: Board, l: Life) => text.replace("{office}", l.steps.length > 1 ? nameAt(b, l.track, l.index) : "선비");

function Move({ from, to, b, l }: { from: Office; to: Office; b: Board; l: Life }) {
  const same = to === from;
  const up = to.rank > from.rank || (to.rank === from.rank && !!to.dangsang && !from.dangsang);
  const side = !same && !up && to.rank === from.rank;
  return (
    <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
      <p className="text-[12px] text-ink-soft">{same ? "자리는 그대로" : up ? "올랐사옵니다 ▲" : side ? "자리를 옮겼사옵니다" : "내려앉았사옵니다 ▼"}</p>
      <p className="mt-0.5 font-myeongjo text-[17px] leading-snug font-extrabold">
        <span style={{ color: robe(to) }}>{rankLabel(to)}</span> {nameAt(b, l.track, l.index)}
      </p>
      <div className="mt-2">
        <Ladder office={to} />
      </div>
    </div>
  );
}

export default function ByeoseulGame({ pillars, name }: { pillars: Pillars; name: string }) {
  const b = useMemo(() => boardOf(pillars), [pillars]);
  const [l, setL] = useState<Life>(start);
  const [picked, setPicked] = useState<{ scene: Scene; door: Door; before: Life } | null>(null);
  const [peek, setPeek] = useState(false);
  const [began, setBegan] = useState(false);
  if (!b) return null;
  const scene = nextScene(l);
  const chapter = l.steps.length + (picked ? 0 : 1);

  const choose = (s: Scene, d: Door) => {
    setPicked({ scene: s, door: d, before: l });
    setL(walk(b, l, s, d));
    setPeek(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goOn = () => {
    setPicked(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const again = () => {
    setL(start());
    setPicked(null);
    setBegan(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!began)
    return (
      <div className="mt-5 overflow-hidden rounded-3xl bg-[#fbf7ef] shadow-[0_10px_30px_rgb(33_27_23/0.12)]">
        <Art name="hero" />
        <div className="px-6 pt-4 pb-6">
          <p className="font-myeongjo text-[24px] leading-snug font-extrabold">
            {name} 선비,
            <br />
            조선에서 벼슬을 산다면
            <br />
            어디까지 오를 수 있을까요
          </p>
          <ul className="mt-4 flex flex-col gap-1.5 text-[14px] leading-snug text-ink-soft">
            <li>· 갈림길 아홉 번, 문은 매번 넷</li>
            <li>· 같은 문이라도 사주에 따라 결과가 달라요</li>
            <li>· 안 고른 문의 결과도 열어 볼 수 있어요</li>
            <li>· 종9품 참봉부터 정1품 영의정까지, 진짜 조선 관직 100여 개</li>
          </ul>
          <button type="button" onClick={() => setBegan(true)} className="mt-6 w-full rounded-2xl bg-seal py-4 font-myeongjo text-[17px] font-extrabold text-hanji shadow-[0_5px_0_#7d1a14]">
            과거 보러 가기
          </button>
        </div>
      </div>
    );

  // ── The outcome of the door just taken.
  if (picked) {
    const step = l.steps[l.steps.length - 1];
    const main = picked.door.trait[0][0];
    const others = picked.scene.doors.filter((d) => d.id !== picked.door.id);
    return (
      <div className="mt-2">
        <Hud b={b} l={l} />
        <div key={l.steps.length} className="animate-rise mt-3 overflow-hidden rounded-3xl bg-[#fbf7ef] px-5 pt-5 pb-6 shadow-[0_10px_30px_rgb(33_27_23/0.12)]">
          <p className="text-[12.5px] text-ink-soft">그대의 선택</p>
          <p className="font-myeongjo text-[16px] font-extrabold">
            {DOOR_MARK[picked.scene.doors.indexOf(picked.door)]} {picked.door.label}
          </p>
          <span className={`mt-4 inline-block rounded-full px-3 py-1 text-[12px] font-bold ${TIER_LABEL[step.tier].cls}`}>{TIER_LABEL[step.tier].word}</span>
          <p className="mt-2 font-myeongjo text-[20px] leading-relaxed font-extrabold">{step.out.text}</p>
          <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-soft">
            <span className="mt-px shrink-0 rounded border border-seal/50 px-1 font-myeongjo text-[10px] font-extrabold text-seal">命</span>
            <span>
              {step.tier === 0
                ? `그대 사주는 ${TRAIT_WORD[main]} 쪽이 두터워 이 문이 열렸사옵니다.`
                : step.tier === 2
                  ? `그대 사주는 ${TRAIT_WORD[main]} 쪽이 옅어 이 문에서 역풍을 맞았사옵니다.`
                  : `그대 사주는 ${TRAIT_WORD[main]} 쪽이 보통이라 그럭저럭이었사옵니다.`}
            </span>
          </p>
          {!l.fled && !l.dead && picked.scene.id !== "exam" && <Move from={step.from} to={step.to} b={b} l={l} />}
          {step.capped && !l.dead && <p className="mt-2 text-[13px] font-bold text-seal">그대 사주로는 이 길에서 여기가 끝이옵니다. 더 오르려면 길을 바꿔야 하옵니다.</p>}
          {step.out.life && step.out.life < 0 && !l.dead ? <p className="mt-2 text-[13px] text-seal">목숨이 위태로웠사옵니다. ♥ {Math.abs(step.out.life)} 잃음</p> : null}

          <button type="button" onClick={() => setPeek((v) => !v)} className="mt-5 w-full rounded-xl py-3 text-[14px] font-bold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]">
            {peek ? "닫기" : "다른 문을 골랐다면? 🔍"}
          </button>
          {peek && (
            <div className="animate-rise mt-3 flex flex-col gap-2">
              {others.map((d) => {
                const t = tierOf(b.f, d);
                return (
                  <div key={d.id} className="rounded-xl bg-white/80 px-3.5 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-myeongjo text-[14px] font-extrabold">
                        {DOOR_MARK[picked.scene.doors.indexOf(d)]} {d.label}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${TIER_LABEL[t].cls}`}>{TIER_LABEL[t].word}</span>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-snug">{d.out[t].text}</p>
                  </div>
                );
              })}
            </div>
          )}
          <button type="button" onClick={goOn} className="mt-5 w-full rounded-2xl bg-[#0f2236] py-3.5 font-myeongjo text-[16px] font-extrabold text-hanji">
            {nextScene(l) ? "세월이 흐르고 ▸" : "벼슬길의 끝 ▸"}
          </button>
        </div>
      </div>
    );
  }

  // ── A scene with its four doors.
  if (scene)
    return (
      <div className="mt-2">
        <Hud b={b} l={l} />
        <div key={scene.id} className="animate-rise mt-3 overflow-hidden rounded-3xl bg-[#fbf7ef] shadow-[0_10px_30px_rgb(33_27_23/0.12)]">
          <Art name={scene.art} />
          <div className="px-5 pt-3 pb-6">
            <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.25em] text-seal">
              第{NUM[chapter - 1]} 갈림길 · {scene.title}
            </p>
            <p className="mt-2 font-myeongjo text-[19px] leading-relaxed font-extrabold">{fill(scene.text, b, l)}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {scene.doors.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => choose(scene, d)}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_0_rgb(33_27_23/0.12),inset_0_0_0_1px_rgb(33_27_23/0.12)] transition active:translate-y-[1px] active:scale-[0.99]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-seal font-myeongjo text-[14px] font-extrabold text-seal">{DOOR_MARK[i]}</span>
                  <span className="font-myeongjo text-[15.5px] leading-snug font-bold">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  // ── The end.
  const o = TRACK[l.track].ladder[l.index];
  const here = nameAt(b, l.track, l.index);
  const share = (POP.atLeast as number[])[o.rank];
  const ends = roadEnds(b);
  const best = ends[0];
  const fate = l.sayak
    ? "목숨을 건 상소 끝에 사약을 받았사옵니다"
    : l.dead
      ? "뜻을 다 펴지 못하고 생을 마쳤사옵니다"
      : l.fled
        ? "벼슬을 버리고 국경 너머 거상이 되었사옵니다"
        : l.capped
          ? "그대 사주가 이 길에서 허락한 끝까지 올랐사옵니다"
          : `이 길의 끝은 ${nameAt(b, l.track, b.ceil[l.track])}였으니, 아직 오를 곳이 남아 있었사옵니다`;
  const held = l.steps.slice(1).filter((s, i, a) => i === 0 || s.to !== a[i - 1].to);
  return (
    <div className="mt-2">
      <div className="animate-rise relative mt-3 overflow-hidden rounded-sm bg-[#fbf5e6] px-6 py-8 text-center shadow-[0_8px_24px_rgb(33_27_23/0.18),inset_0_0_0_6px_#fbf5e6,inset_0_0_0_7px_rgb(179_38_30/0.5)]">
        <span className="animate-stamp absolute top-4 right-4 flex size-12 rotate-[-8deg] items-center justify-center border-[3px] border-seal font-myeongjo text-[14px] leading-tight font-extrabold text-seal">
          御寶
        </span>
        <p className="font-myeongjo text-[34px] leading-none font-extrabold tracking-[0.5em] text-seal">敎旨</p>
        <p className="mt-5 text-[14px] text-ink-soft">{name}의 마지막 벼슬</p>
        <p className="mt-2 font-myeongjo text-[15px] font-extrabold" style={{ color: robe(o) }}>
          {rankLabel(o)}
        </p>
        <p className="font-myeongjo text-[30px] leading-tight font-extrabold">
          {here}
          {l.fled ? " 출신 거상" : ""}
        </p>
        <p className="mt-3 text-[14px] leading-relaxed">{fate}</p>
        <div className="mx-auto mt-4 max-w-[260px]">
          <Ladder office={o} />
        </div>
        <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-[13px]">
          {RANK_NAME[o.rank]} 이상까지 오르는 사람은 <b className="text-seal">100명 중 {share < 1 ? "1명도 안 되옵니다" : `${Math.round(share)}명`}</b>
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-[#fbf7ef] px-5 py-5 shadow-[0_6px_20px_rgb(33_27_23/0.08)]">
        <p className="font-myeongjo text-[17px] font-extrabold">그대가 거친 자리</p>
        <ol className="mt-2 flex flex-col gap-1 text-[13.5px]">
          {held.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-ink-soft">{rankLabel(s.to)}</span>
              <span className="flex-1">{s.to.name.replace("{조}", b.jo)}</span>
              {i > 0 && (() => {
                // Up or down from the office before, so a run of moves reads as a story, not a bare list.
                const lv = (o: typeof s.to) => o.rank * 2 + (o.dangsang ? 1 : 0);
                const d = lv(s.to) - lv(held[i - 1].to);
                return d > 0 ? <span className="text-[12px] font-bold text-seal">▲ 오름</span>
                  : d < 0 ? <span className="text-[12px] font-bold text-[#1e4f8a]">▼ 내림</span>
                  : <span className="text-[12px] text-ink-soft">옮김</span>;
              })()}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 rounded-3xl bg-[#0f2236] px-5 py-5 text-hanji">
        <p className="font-myeongjo text-[17px] font-extrabold">그대 사주로 본, 길마다의 끝</p>
        <p className="mt-1 text-[12.5px] text-hanji/70">어느 길로 갔다면 어디까지 오를 수 있었는지, 사주가 허락한 끝이옵니다.</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {ends.map((e) => (
            <li key={e.track} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${e.track === l.track ? "bg-white/15" : ""}`}>
              <span className="text-[12.5px] text-hanji/70">{TRACK[e.track].name}</span>
              <span className="text-right font-myeongjo text-[14px] font-extrabold">
                <span className="mr-1 text-[11.5px] text-[#d9b465]">{rankLabel(e.office)}</span>
                {e.name}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-hanji/80">
          그대 사주가 가장 높이 닿는 길은 <b className="text-[#d9b465]">{TRACK[best.track].name}</b>, 끝은 {rankLabel(best.office)} {best.name}이옵니다.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={again} className="rounded-xl bg-seal py-3.5 font-myeongjo text-[15px] font-extrabold text-hanji">
          다른 길로 다시
        </button>
        <button
          type="button"
          onClick={() => {
            const text = `조선에서 나는 ${rankLabel(o)} ${here}${l.fled ? " 출신 거상" : ""}. 그대는 어디까지 오를까`;
            if (navigator.share) navigator.share({ title: "벼슬길", text, url: "https://www.hundosaju.com/byeoseul" }).catch(() => {});
            else navigator.clipboard?.writeText(`${text} https://www.hundosaju.com/byeoseul`).catch(() => {});
          }}
          className="rounded-xl py-3.5 font-myeongjo text-[15px] font-extrabold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]"
        >
          벗에게 보내기
        </button>
      </div>
      <TrackLink
        event="to_saju"
        from="byeoseul"
        href="/reports/jikup"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_6px_16px_rgb(15_34_54/0.12),inset_0_0_0_1px_rgb(179_38_30/0.3)]"
      >
        <span className="flex size-11 shrink-0 -rotate-3 items-center justify-center border-[3px] border-seal font-myeongjo text-lg font-extrabold text-seal">業</span>
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">조선에선 {TRACK[best.track].name}, 지금 나에게 맞는 일은?</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">내 사주 직업, 적성 무료로 먼저 보기</span>
        </span>
        <span className="shrink-0 font-myeongjo text-sm font-extrabold text-seal">보기 →</span>
      </TrackLink>
    </div>
  );
}
