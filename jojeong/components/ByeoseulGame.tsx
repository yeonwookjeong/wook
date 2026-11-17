"use client";

import { useState, type ReactNode } from "react";
import { lifeOf, type Board, type Exam, type Life, type Post, type Trial } from "@/lib/byeoseul";
import { bondScene, childScene, studyScene, trialEnd, verdict, workScene, type Scene } from "@/lib/byeoseulStory";
import { ageWord, END_TEXT, EXAM_TEXT, POST_TEXT, TRIAL_TEXT } from "@/lib/byeoseulText";
import { josa } from "@/lib/josa";
import TrackLink from "./TrackLink";

// 벼슬길 (2026-11-17, 대표님 "진행되면서 화면이 어떤지가 중요"): an 일대기 told one scene per screen, like a
// storybook. Tap to turn the page; at the two crossroads the reader picks a door, the chart's door carrying a 四柱
// seal. Every scene is chosen by one part of the chart (lib/byeoseulStory.ts) and says which under it. The end is
// a 敎旨 card, then the road walked set beside the road the chart pointed to.

type Step = "intro" | "child" | "study" | "exam" | "pass" | "post" | "work" | "bond" | "trial" | "gyoji" | "compare";
const STEPS: Step[] = ["intro", "child", "study", "exam", "pass", "post", "work", "bond", "trial", "gyoji", "compare"];
const CHAPTER: Record<Step, number> = { intro: 0, child: 0, study: 0, exam: 0, pass: 1, post: 1, work: 2, bond: 2, trial: 2, gyoji: 3, compare: 3 };
const CHAPTERS = [
  ["一", "수학"],
  ["二", "급제"],
  ["三", "벼슬"],
  ["四", "교지"],
];
// Scene art by trial; the cut-out pictures (no background) sit whole on the navy panel.
const TRIAL_ART: Record<Trial, [string, "cover" | "contain"]> = {
  exile: ["exile", "contain"],
  war: ["hero", "cover"],
  faction: ["gansin", "contain"],
  patron: ["throne", "cover"],
  calm: ["yard", "cover"],
};

function Progress({ step }: { step: Step }) {
  const at = CHAPTER[step];
  return (
    <div className="flex items-center gap-1.5">
      {CHAPTERS.map(([n, w], i) => (
        <div key={n} className="flex flex-1 flex-col items-center gap-1">
          <div className={`h-1 w-full rounded-full ${i <= at ? "bg-seal" : "bg-ink/10"}`} />
          <span className={`font-myeongjo text-[11px] font-extrabold ${i === at ? "text-seal" : "text-ink-soft/60"}`}>
            {n} {w}
          </span>
        </div>
      ))}
    </div>
  );
}

function Art({ name, fit = "cover" }: { name: string; fit?: "cover" | "contain" }) {
  return (
    <div className="relative h-48 overflow-hidden bg-[#0f2236]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/king/${name}.webp`} alt="" className={`size-full ${fit === "cover" ? "object-cover" : "object-contain p-3"}`} />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#f6efe2] to-transparent" />
    </div>
  );
}

function Why({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-1.5 text-left text-[12px] leading-snug text-ink-soft">
      <span className="mt-px shrink-0 rounded border border-seal/50 px-1 font-myeongjo text-[10px] font-extrabold text-seal">命</span>
      <span>{children}</span>
    </p>
  );
}

function Lines({ scene }: { scene: Scene }) {
  return (
    <>
      <div className="flex flex-col gap-2 font-myeongjo text-[19px] leading-relaxed font-bold">
        {scene.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <Why>{scene.why}</Why>
    </>
  );
}

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
      className={`relative rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ${
        chart ? "bg-[#0f2236] text-hanji shadow-[0_6px_16px_rgb(15_34_54/0.3),inset_0_0_0_2px_#d9b465]" : "bg-white/80 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.15)]"
      }`}
    >
      {chart && SEAL}
      <span className="block font-myeongjo text-[16px] font-extrabold">{title}</span>
      <span className={`mt-0.5 block text-[12.5px] leading-snug ${chart ? "text-hanji/75" : "text-ink-soft"}`}>{line}</span>
    </button>
  );
}

function Gyoji({ life, name, b }: { life: Life; name: string; b: Board }) {
  return (
    <div className="relative mx-auto w-full rounded-sm bg-[#fbf5e6] px-6 py-7 text-center shadow-[0_8px_24px_rgb(33_27_23/0.18),inset_0_0_0_6px_#fbf5e6,inset_0_0_0_7px_rgb(179_38_30/0.5)]">
      <p className="font-myeongjo text-[34px] leading-none font-extrabold tracking-[0.5em] text-seal">敎旨</p>
      <p className="mt-5 text-[13.5px] leading-relaxed text-ink-soft">
        {name}, {ageWord(life.age)}에 {EXAM_TEXT[life.exam].name} 급제하여
        <br />
        {POST_TEXT[life.post].name}에서 첫 벼슬을 시작하고
        <br />
        {josa(TRIAL_TEXT[life.trial].name, "을/를")} 지나
      </p>
      <p className="mt-4 font-myeongjo text-[28px] leading-tight font-extrabold">{END_TEXT[life.post][life.tier]}</p>
      <p className="mt-1 font-myeongjo text-[14px] font-bold text-ink-soft">에 이르렀노라</p>
      <div className="mt-5 border-t border-ink/10 pt-4 text-[13px] leading-relaxed">
        <span className="text-ink-soft">사관의 평</span>
        <p className="mt-1 font-myeongjo text-[15px] font-bold">&ldquo;{verdict(b)}&rdquo;</p>
      </div>
      <span className="animate-stamp absolute right-4 bottom-4 flex size-14 rotate-[-8deg] items-center justify-center border-[3px] border-seal font-myeongjo text-[15px] leading-tight font-extrabold text-seal opacity-85">
        御寶
      </span>
    </div>
  );
}

function LifeSummary({ life, b }: { life: Life; b: Board }) {
  return (
    <div className="rounded-2xl bg-white/80 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.12)]">
      <p className="font-myeongjo text-[22px] leading-tight font-extrabold">{END_TEXT[life.post][life.tier]}</p>
      <ul className="mt-2 flex flex-col gap-1 text-[13.5px] leading-snug text-ink-soft">
        <li>
          {ageWord(life.age)}에 {EXAM_TEXT[life.exam].name} 급제
        </li>
        <li>첫 자리, {POST_TEXT[life.post].name}</li>
        <li>
          시련, {TRIAL_TEXT[life.trial].name}. {trialEnd(b, life.trial)}
        </li>
      </ul>
    </div>
  );
}

export default function ByeoseulGame({ board: b, name }: { board: Board; name: string }) {
  const [i, setI] = useState(0);
  const [exam, setExam] = useState<Exam | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [tab, setTab] = useState(0);
  const step = STEPS[i];
  const next = () => setI((x) => Math.min(x + 1, STEPS.length - 1));
  const prev = () => setI((x) => Math.max(x - 1, 0));

  const chartExam = b.exams[0];
  const chartLife = lifeOf(b, chartExam, b.posts[chartExam][0]);
  const life = exam && post ? lifeOf(b, exam, post) : null;
  const examOff = exam !== null && exam !== chartExam;
  const postOff = exam !== null && post !== null && post !== b.posts[exam][0];
  // 첫 문은 달랐어도 그 뒤로 사주를 따른 길: the exam picked, then the chart's post for it.
  const back = exam && examOff && postOff ? lifeOf(b, exam, b.posts[exam][0]) : null;
  const tabs: { label: string; life: Life }[] = life
    ? [
        { label: "내가 걸은 길", life },
        ...(back ? [{ label: "결을 되찾았다면", life: back }] : []),
        ...(life.off > 0 ? [{ label: "처음부터 사주대로", life: chartLife }] : []),
      ]
    : [];

  const tap = (body: ReactNode, art?: ReactNode) => (
    <button type="button" onClick={next} className="block w-full text-left">
      {art}
      <div className="px-6 pt-5 pb-6">
        {body}
        <p className="mt-6 text-right font-myeongjo text-[13px] font-extrabold text-seal">눌러서 넘기기 ▸</p>
      </div>
    </button>
  );

  let view: ReactNode = null;
  if (step === "intro")
    view = tap(
      <>
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.3em] text-seal">官路 一代記</p>
        <p className="mt-2 font-myeongjo text-[24px] leading-snug font-extrabold">
          {name} 선비,
          <br />
          과거 보러 가시겠사옵니까
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">그대 사주로 한 사람의 벼슬길을 그려 드리옵니다. 갈림길 두 곳에서는 문을 직접 고르시옵소서.</p>
      </>,
      <Art name="hero" />,
    );
  else if (step === "child") view = tap(<Lines scene={childScene(b)} />, <Art name="gate" fit="contain" />);
  else if (step === "study") view = tap(<Lines scene={studyScene(b)} />, <Art name="yard" />);
  else if (step === "exam")
    view = (
      <div className="px-5 pt-6 pb-6">
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.3em] text-seal">첫 갈림길</p>
        <p className="mt-1 font-myeongjo text-[21px] font-extrabold">어느 과거를 보시겠사옵니까</p>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          <b className="text-seal">四柱</b> 도장이 찍힌 문이 그대 사주가 가리키는 길이옵니다.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          {b.exams.map((e, k) => (
            <Door
              key={e}
              title={`${EXAM_TEXT[e].name} ${EXAM_TEXT[e].hanja}`}
              line={EXAM_TEXT[e].line}
              chart={k === 0}
              onClick={() => {
                setExam(e);
                setPost(null);
                next();
              }}
            />
          ))}
        </div>
      </div>
    );
  else if (step === "pass" && exam) {
    const age = b.age + b.exams.indexOf(exam) * 4;
    view = tap(
      <div className="pt-4 text-center">
        <div className="animate-stamp mx-auto flex size-28 rotate-[-6deg] items-center justify-center border-[5px] border-seal font-myeongjo text-[40px] leading-none font-extrabold text-seal">
          及第
        </div>
        <p className="mt-6 font-myeongjo text-[24px] font-extrabold">
          {ageWord(age)}, {EXAM_TEXT[exam].name} 급제
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed">
          {examOff ? <>맞지 않는 공부라 사주의 길보다 {age - b.age}년이 더 걸렸사옵니다. 그래도 끝내 방에 이름이 붙었지요.</> : <>방이 붙던 날, 그대 이름이 앞줄에 있었사옵니다.</>}
        </p>
        <Why>{examOff ? `사주는 ${EXAM_TEXT[chartExam].name}를 가리켰사옵니다. ${EXAM_TEXT[chartExam].why}라서요` : `${EXAM_TEXT[exam].why}라 이 과거가 맞았사옵니다`}</Why>
      </div>,
    );
  } else if (step === "post" && exam)
    view = (
      <div className="px-5 pt-6 pb-6">
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.3em] text-seal">둘째 갈림길</p>
        <p className="mt-1 font-myeongjo text-[21px] font-extrabold">첫 벼슬은 어디로 가시겠사옵니까</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {b.posts[exam].map((p, k) => (
            <Door
              key={p}
              title={POST_TEXT[p].name}
              line={POST_TEXT[p].line}
              chart={k === 0}
              onClick={() => {
                setPost(p);
                next();
              }}
            />
          ))}
        </div>
      </div>
    );
  else if (step === "work" && exam && post)
    view = tap(
      <>
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.3em] text-seal">{POST_TEXT[post].name}</p>
        <div className="mt-2">
          <Lines scene={workScene(b, post)} />
        </div>
        {postOff && (
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[12.5px] text-ink-soft">
            사주는 {josa(POST_TEXT[b.posts[exam][0]].name, "을/를")} 가리켰사옵니다. {POST_TEXT[b.posts[exam][0]].why}이지요.
          </p>
        )}
      </>,
      <Art name="throne" />,
    );
  else if (step === "bond") view = tap(<Lines scene={bondScene(b)} />, <Art name="gate" fit="contain" />);
  else if (step === "trial" && life)
    view = tap(
      <>
        <p className="font-myeongjo text-[13px] font-extrabold tracking-[0.3em] text-seal">시련</p>
        <p className="mt-1 font-myeongjo text-[24px] font-extrabold">{TRIAL_TEXT[life.trial].name}</p>
        <p className="mt-2 font-myeongjo text-[17px] leading-relaxed font-bold">{TRIAL_TEXT[life.trial].line}</p>
        <p className="mt-2 text-[15px] leading-relaxed">{trialEnd(b, life.trial)}</p>
        <Why>{life.trial === b.trial ? `사주에 ${TRIAL_TEXT[life.trial].why} 오는 시련이옵니다` : "사주와 다른 길을 걸어 시련이 더 거세졌사옵니다"}</Why>
      </>,
      <Art name={TRIAL_ART[life.trial][0]} fit={TRIAL_ART[life.trial][1]} />,
    );
  else if (step === "gyoji" && life)
    view = (
      <div className="px-5 pt-6 pb-6">
        <Gyoji life={life} name={name} b={b} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) navigator.share({ title: "벼슬길", text: `조선에서 나는 ${END_TEXT[life.post][life.tier]}`, url: "https://www.hundosaju.com/byeoseul" }).catch(() => {});
            }}
            className="rounded-xl bg-seal py-3 font-myeongjo text-[15px] font-extrabold text-hanji"
          >
            벗에게 보내기
          </button>
          <button type="button" onClick={next} className="rounded-xl py-3 font-myeongjo text-[15px] font-extrabold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]">
            {life.off > 0 ? "사주대로였다면 ▸" : "다음 ▸"}
          </button>
        </div>
      </div>
    );
  else if (step === "compare" && life)
    view = (
      <div className="px-5 pt-6 pb-6">
        {tabs.length > 1 ? (
          <>
            <div className="flex gap-1 rounded-xl bg-ink/5 p-1">
              {tabs.map((t, k) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`flex-1 rounded-lg py-2 text-[12.5px] font-bold ${tab === k ? "bg-white text-seal shadow-sm" : "text-ink-soft"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <LifeSummary life={tabs[Math.min(tab, tabs.length - 1)].life} b={b} />
            </div>
            <p className="mt-3 text-[14px] leading-relaxed">
              {chartLife.tier === life.tier
                ? "다른 문을 열었어도 닿은 높이는 같았사옵니다. 다만 사주대로였다면 더 일찍 닿았지요."
                : `사주대로 걸었다면 ${END_TEXT[chartLife.post][chartLife.tier]}까지 갔을 길이옵니다.`}
            </p>
          </>
        ) : (
          <>
            <p className="font-myeongjo text-[20px] font-extrabold">사주대로 걸으셨사옵니다</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">두 갈림길 모두 사주가 가리킨 문이었사옵니다. 다른 문을 열면 인생이 어떻게 달라지는지 보시겠사옵니까.</p>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setExam(null);
            setPost(null);
            setTab(0);
            setI(3);
          }}
          className="mt-4 w-full rounded-xl py-3 text-[14px] font-bold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]"
        >
          다른 문을 열어 보기
        </button>
        <TrackLink
          event="to_saju"
          from="byeoseul"
          href="/reports/jikup"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-[#0f2236] px-4 py-3.5 text-left text-hanji shadow-[0_6px_16px_rgb(15_34_54/0.25),inset_0_0_0_1px_rgb(217_180_101/0.4)]"
        >
          <span className="flex size-11 shrink-0 -rotate-3 items-center justify-center border-[3px] border-[#d9b465] font-myeongjo text-lg font-extrabold text-[#d9b465]">業</span>
          <span className="min-w-0 flex-1">
            <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">조선에선 {POST_TEXT[chartLife.post].name}, 지금은 어떤 일이 맞을까</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-hanji/70">직업, 적성 보고서, 맞는 일 세 가지와 움직일 때</span>
          </span>
          <span className="shrink-0 font-myeongjo text-sm font-extrabold text-[#d9b465]">보기 →</span>
        </TrackLink>
        <TrackLink event="to_saju" from="byeoseul" href="/king" className="mt-2 block rounded-xl bg-white/60 px-4 py-3 text-center text-[14px] font-bold">
          벗들의 조정에선 무슨 자리일까 → 왕이 될 사주
        </TrackLink>
      </div>
    );

  return (
    <div className="mt-5">
      <Progress step={step} />
      <div key={i} className="animate-rise mt-3 overflow-hidden rounded-3xl bg-[#f6efe2] shadow-[0_10px_30px_rgb(33_27_23/0.12),inset_0_0_0_1px_rgb(33_27_23/0.08)]">
        {view}
      </div>
      {i > 0 && (
        <button type="button" onClick={prev} className="mt-3 text-[13px] text-ink-soft">
          ◂ 이전 장면
        </button>
      )}
    </div>
  );
}
