"use client";

import { useActionState, useState } from "react";
import PersonFields from "@/components/PersonFields";
import { keepValues } from "@/lib/keepForm";
import { askAction, attachOtherAction, openRoomAction, type FormState } from "./actions";

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
      <PersonFields nameLabel="손님 이름" unknownHour="모름" modern />
      <ErrorLine error={state.error} />
      <button type="submit" disabled={pending} className="rounded-xl bg-ink py-3 text-sm font-extrabold text-hanji disabled:opacity-60">
        {pending ? "방을 여는 중이에요…" : "상담방 열기"}
      </button>
    </form>
  );
}

// The question box: a topic first (one question = one topic), then up to 200 characters.
export function AskForm({ room }: { room: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(askAction, { error: null });
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        keepValues(action)(e);
        setText("");
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="room" value={room} />
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1 text-xs font-bold text-ink-soft">무엇에 대한 질문이옵니까?</legend>
        {TOPICS.map((t, i) => (
          <label key={t} className="cursor-pointer">
            <input type="radio" name="topic" value={t} defaultChecked={i === 0} className="peer sr-only" />
            <span className="block rounded-full border border-ink/15 bg-white/60 px-3 py-1.5 text-[13px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji">{t}</span>
          </label>
        ))}
      </fieldset>
      <textarea
        name="question"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        rows={3}
        maxLength={MAX}
        placeholder="한 번에 하나를 물으실수록 깊이 답해 드리옵니다"
        className="rounded-xl border border-ink/15 bg-white/70 px-3 py-2.5 text-[15px] leading-relaxed"
      />
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          {[...text].length}/{MAX}
        </span>
        <button type="submit" disabled={pending || !text.trim()} className="rounded-xl bg-seal px-5 py-2.5 text-sm font-extrabold text-hanji disabled:opacity-50">
          {pending ? "정 훈도가 사주를 보는 중…" : "여쭙기"}
        </button>
      </div>
      <ErrorLine error={state.error} />
    </form>
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
        <span className="font-semibold text-ink-soft">손님이 부르는 호칭</span>
        <input name="label" placeholder="그 사람, 남자친구, 팀장님 …" maxLength={12} className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2" />
      </label>
      <PersonFields prefix="b_" nameLabel="상대 이름" unknownHour="모름" modern />
      <ErrorLine error={state.error} />
      <button type="submit" disabled={pending} className="rounded-xl border-2 border-ink py-2.5 text-sm font-extrabold disabled:opacity-60">
        {pending ? "붙이는 중…" : "상대 사주 붙이기"}
      </button>
    </form>
  );
}
