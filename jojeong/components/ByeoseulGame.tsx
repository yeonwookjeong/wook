"use client";

import { useState } from "react";
import { lifeOf, type Board, type Exam, type Life, type Post } from "@/lib/byeoseul";
import { ageWord, END_TEXT, EXAM_TEXT, POST_TEXT, TRIAL_TEXT } from "@/lib/byeoseulText";
import { josa } from "@/lib/josa";
import TrackLink from "./TrackLink";

// 벼슬길 (2026-11-17, 대표님 "사주대로 할래? 내 선택대로 할래?"): four gates walked one door at a time. The chart's
// door carries a seal; any door may be opened. At the end, the life walked and, if it strayed, the life the chart
// pointed to, side by side. All of it computed (lib/byeoseul.ts); the page only reveals.

const SEAL = (
  <span className="absolute -top-2 -right-2 flex size-8 rotate-6 items-center justify-center rounded-md border-2 border-seal bg-hanji font-myeongjo text-[11px] leading-none font-extrabold text-seal shadow-sm">
    四柱
  </span>
);

function Door({ title, line, chart, onClick }: { title: string; line: string; chart: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.98] ${
        chart ? "bg-[#0f2236] text-hanji shadow-[0_6px_16px_rgb(15_34_54/0.3),inset_0_0_0_2px_#d9b465]" : "bg-white/70 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.15)]"
      }`}
    >
      {chart && SEAL}
      <span className="block font-myeongjo text-[17px] font-extrabold">{title}</span>
      <span className={`mt-0.5 block text-[13px] leading-snug ${chart ? "text-hanji/75" : "text-ink-soft"}`}>{line}</span>
    </button>
  );
}

function LifeCard({ life, name, label, dark }: { life: Life; name: string; label: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${dark ? "bg-[#0f2236] text-hanji" : "bg-white/70 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.12)]"}`}>
      <p className={`text-[12px] font-bold ${dark ? "text-[#d9b465]" : "text-seal"}`}>{label}</p>
      <p className="mt-1 font-myeongjo text-[22px] leading-tight font-extrabold">{END_TEXT[life.post][life.tier]}</p>
      <ul className={`mt-2 flex flex-col gap-1 text-[13.5px] leading-snug ${dark ? "text-hanji/80" : "text-ink-soft"}`}>
        <li>
          {ageWord(life.age)}에 {EXAM_TEXT[life.exam].name} 급제
        </li>
        <li>첫 자리, {POST_TEXT[life.post].name}</li>
        <li>시련, {TRIAL_TEXT[life.trial].name}</li>
      </ul>
      <p className={`mt-2 text-[12px] ${dark ? "text-hanji/60" : "text-ink-soft"}`}>{name}의 벼슬길</p>
    </div>
  );
}

export default function ByeoseulGame({ board, name }: { board: Board; name: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const chartLife = lifeOf(board, board.exams[0], board.posts[board.exams[0]][0]);
  const life = exam && post ? lifeOf(board, exam, post) : null;
  const strayed = life !== null && life.off > 0;

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* 첫 관문: 과거 */}
      <section>
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.2em] text-seal">第一關 · 科擧</p>
        <h2 className="mt-1 font-myeongjo text-[20px] font-extrabold">어느 과거를 보시겠사옵니까</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          <b className="text-seal">四柱</b> 도장이 찍힌 문이 그대 사주가 가리키는 길이옵니다. 다른 문을 열어도 되옵니다.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {board.exams.map((e, i) => (
            <Door
              key={e}
              title={`${EXAM_TEXT[e].name} ${EXAM_TEXT[e].hanja}`}
              line={EXAM_TEXT[e].line}
              chart={i === 0}
              onClick={() => {
                setExam(e);
                setPost(null);
              }}
            />
          ))}
        </div>
        {exam && (
          <p className="mt-3 rounded-xl bg-white/60 px-4 py-3 text-[14px] leading-relaxed">
            {exam === board.exams[0] ? (
              <>사주대로 고르셨사옵니다. {EXAM_TEXT[exam].why}이옵니다.</>
            ) : (
              <>
                사주는 {EXAM_TEXT[board.exams[0]].name}를 가리켰으나, 그대는 {EXAM_TEXT[exam].name}를 고르셨사옵니다. 맞지 않는 공부라 급제가 늦어지옵니다.
              </>
            )}
          </p>
        )}
      </section>

      {/* 둘째 관문: 첫 자리 */}
      {exam && (
        <section className="animate-rise">
          <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.2em] text-seal">第二關 · 初仕</p>
          <h2 className="mt-1 font-myeongjo text-[20px] font-extrabold">첫 벼슬은 어디로 가시겠사옵니까</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {board.posts[exam].map((p, i) => (
              <Door key={p} title={POST_TEXT[p].name} line={POST_TEXT[p].line} chart={i === 0} onClick={() => setPost(p)} />
            ))}
          </div>
          {post && (
            <p className="mt-3 rounded-xl bg-white/60 px-4 py-3 text-[14px] leading-relaxed">
              {post === board.posts[exam][0] ? (
                <>사주대로이옵니다. {POST_TEXT[post].why} 이 자리가 맞사옵니다.</>
              ) : (
                <>사주는 {josa(POST_TEXT[board.posts[exam][0]].name, "을/를")} 가리켰사옵니다. {POST_TEXT[board.posts[exam][0]].why}이지요.</>
              )}
            </p>
          )}
        </section>
      )}

      {/* 셋째 관문: 시련, 넷째: 마지막 벼슬 */}
      {life && (
        <section className="animate-rise">
          <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.2em] text-seal">第三關 · 試鍊</p>
          <h2 className="mt-1 font-myeongjo text-[20px] font-extrabold">{TRIAL_TEXT[life.trial].name}</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{TRIAL_TEXT[life.trial].line}</p>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            {life.trial === board.trial ? `사주에 ${TRIAL_TEXT[life.trial].why} 오는 시련이옵니다.` : "사주와 다른 길을 걸어 시련이 더 거세졌사옵니다."}
          </p>

          <p className="mt-6 font-myeongjo text-[13px] font-extrabold tracking-[0.2em] text-seal">第四關 · 終職</p>
          <div className="mt-2 flex flex-col gap-3">
            <LifeCard life={life} name={name} label={strayed ? "그대가 고른 길" : "사주대로 걸은 길"} dark />
            {strayed && <LifeCard life={chartLife} name={name} label="사주대로 갔다면" />}
          </div>
          <button
            type="button"
            onClick={() => {
              setExam(null);
              setPost(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-3 w-full rounded-xl py-3 text-[14px] font-bold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]"
          >
            다른 문을 열어 보기
          </button>

          <TrackLink
            event="to_saju"
            from="byeoseul"
            href="/reports/jikup"
            className="mt-5 flex items-center gap-3 rounded-2xl bg-[#0f2236] px-4 py-3.5 text-left text-hanji shadow-[0_6px_16px_rgb(15_34_54/0.25),inset_0_0_0_1px_rgb(217_180_101/0.4)]"
          >
            <span className="flex size-11 shrink-0 -rotate-3 items-center justify-center border-[3px] border-[#d9b465] font-myeongjo text-lg font-extrabold text-[#d9b465]">業</span>
            <span className="min-w-0 flex-1">
              <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">조선에선 {POST_TEXT[chartLife.post].name}, 지금은 어떤 일이 맞을까</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-hanji/70">직업, 적성 보고서, 맞는 일 세 가지와 움직일 때</span>
            </span>
            <span className="shrink-0 font-myeongjo text-sm font-extrabold text-[#d9b465]">보기 →</span>
          </TrackLink>
          <TrackLink event="to_saju" from="byeoseul" href="/king" className="mt-2 block rounded-xl bg-white/60 px-4 py-3 text-center text-[14px] font-bold">
            친구 조정에선 무슨 자리일까 → 왕이 될 사주
          </TrackLink>
        </section>
      )}
    </div>
  );
}
