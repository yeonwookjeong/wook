"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PersonFields from "@/components/PersonFields";
import { keepValues } from "@/lib/keepForm";
import { askAction, attachOtherAction, openRoomAction, type FormState } from "./actions";

// The guest's side of 정 훈도에게 묻기 (app/ask): the same forms as the owner's trial room (app/admin/ask), on the
// member's own actions, which spend a question per answer.

const TOPICS = ["연애", "일", "돈", "사람", "기타"] as const;
const MAX = 200;

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
      {error}
    </p>
  ) : null;
}

export function OpenRoomForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(openRoomAction, { error: null });
  return (
    <form onSubmit={keepValues(action)} className="mt-3 flex flex-col gap-3">
      <PersonFields nameLabel="이름" unknownHour="모름" modern binaryGender genderLabel="성별 · 배우자의 별과 10년 흐름을 볼 때 꼭 필요해요" />
      <ErrorLine error={state.error} />
      <button type="submit" disabled={pending} className="rounded-xl bg-ink py-3 text-sm font-extrabold text-hanji disabled:opacity-60">
        {pending ? "방을 여는 중이에요…" : "내 사주로 상담방 열기"}
      </button>
    </form>
  );
}

const STEPS = ["여덟 글자를 펼치는 중…", "올해와 이달의 흐름을 짚는 중…", "지난 상담 메모를 읽는 중…", "답서를 쓰는 중…"];

// While he writes (30~60 seconds): the question as sent, and a letter being written, so the wait reads as work.
function Writing({ question, topic }: { question: string; topic: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="ml-12 rounded-[18px] rounded-br-[4px] bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-hanji">
        {topic && <span className="block text-[11px] font-bold opacity-65">{topic}</span>}
        <p className="whitespace-pre-wrap">{question}</p>
      </div>
      <div className="doc-paper rounded-[4px] px-6 py-6 text-center" role="status">
        <p className="font-myeongjo text-[15px] font-extrabold">정 훈도가 답서를 쓰고 있사옵니다</p>
        <p className="mt-1.5 text-[13px] text-ink-soft">{STEPS[step]}</p>
        <div className="mx-auto mt-4 flex w-40 flex-col gap-2" aria-hidden>
          {[100, 85, 92, 60].map((w, i) => (
            <span key={i} className="h-1.5 animate-pulse rounded-full bg-ink/10" style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <p className="mt-4 text-[11px] text-ink-soft">30초~1분쯤 걸려요. 이 화면을 닫지 말아 주세요.</p>
      </div>
    </div>
  );
}

// The question box, fixed to the bottom of the room: a topic (one question = one topic), then up to 200 characters.
export function AskForm({ room, other }: { room: string; other?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(askAction, { error: null });
  const [text, setText] = useState("");
  const [sent, setSent] = useState({ question: "", topic: "" });
  const was = useRef(false);
  // The answer has come: bring the new letter into view.
  useEffect(() => {
    if (was.current && !pending && !state.error) document.getElementById("last-answer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    was.current = pending;
  }, [pending, state.error]);
  return (
    <>
      {pending && <Writing question={sent.question} topic={sent.topic} />}
      <form
        onSubmit={(e) => {
          const f = new FormData(e.currentTarget);
          setSent({ question: text.trim(), topic: String(f.get("topic") ?? "") });
          keepValues(action)(e);
          setText("");
        }}
        className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-ink/10 bg-hanji/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <input type="hidden" name="room" value={room} />
        <fieldset className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <legend className="sr-only">무엇에 대한 질문이옵니까?</legend>
          {TOPICS.map((t) => (
            <label key={t} className="shrink-0 cursor-pointer">
              <input type="radio" name="topic" value={t} className="peer sr-only" />
              <span className="block rounded-full border border-ink/15 bg-white/60 px-3 py-1 text-[12.5px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji">{t}</span>
            </label>
          ))}
          {!other && (
            <a href="#other" className="shrink-0 rounded-full border border-dashed border-ink/25 px-3 py-1 text-[12.5px] text-ink-soft">
              ＋ 그 사람 사주
            </a>
          )}
        </fieldset>
        <div className="mt-2 flex items-end gap-2">
          <textarea
            name="question"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            rows={text.length > 40 ? 3 : 1}
            maxLength={MAX}
            disabled={pending}
            aria-label="여쭐 말씀"
            placeholder="여쭐 말씀을 적어 주시옵소서"
            className="min-h-11 flex-1 resize-none rounded-2xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] leading-snug disabled:opacity-60"
          />
          <button type="submit" disabled={pending || !text.trim()} className="h-11 shrink-0 rounded-2xl bg-seal px-4 text-sm font-extrabold text-hanji disabled:opacity-50">
            {pending ? "쓰는 중" : "여쭙기"}
          </button>
        </div>
        {text && (
          <p className="mt-1 text-right text-[11px] text-ink-soft">
            {[...text].length}/{MAX} · 주제를 안 고르시면 &lsquo;기타&rsquo;로 여쭤요
          </p>
        )}
        <ErrorLine error={state.error} />
      </form>
    </>
  );
}

// After several topics came in one question: pick the one to answer first. Nothing is spent until then.
export function ChooseForm({ room, question, topic, choices }: { room: string; question: string; topic: string; choices: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(askAction, { error: null });
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {choices.map((c) => (
        <form key={c} onSubmit={keepValues(action)}>
          <input type="hidden" name="room" value={room} />
          <input type="hidden" name="question" value={question} />
          <input type="hidden" name="topic" value={topic} />
          <input type="hidden" name="chosen" value={c} />
          <button type="submit" disabled={pending} className="w-full rounded-xl border-2 border-seal/40 bg-white/70 px-3 py-2 text-left text-sm font-bold disabled:opacity-50">
            {c}
          </button>
        </form>
      ))}
      {pending && <p className="text-xs text-ink-soft">정 훈도가 사주를 보는 중…</p>}
      <ErrorLine error={state.error} />
    </div>
  );
}

export function AttachOtherForm({ room }: { room: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(attachOtherAction, { error: null });
  return (
    <form onSubmit={keepValues(action)} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="room" value={room} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-soft">그 사람을 뭐라고 부를까요</span>
        <input name="label" placeholder="그 사람, 남자친구, 팀장님 …" maxLength={12} className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2" />
      </label>
      <PersonFields prefix="b_" nameLabel="상대 이름" unknownHour="모름" modern binaryGender genderLabel="상대 성별" />
      <ErrorLine error={state.error} />
      <button type="submit" disabled={pending} className="rounded-xl border-2 border-ink py-2.5 text-sm font-extrabold disabled:opacity-60">
        {pending ? "붙이는 중…" : "상대 사주 붙이기"}
      </button>
    </form>
  );
}
