"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PersonFields from "@/components/PersonFields";
import { keepValues } from "@/lib/keepForm";
import { RELS, REL_LABEL } from "@/lib/rels";
import { askAction, attachOtherAction, openRoomAction, removePersonAction, type FormState } from "./actions";

// The guest's side of 정 훈도에게 묻기 (app/ask): the same forms as the owner's trial room (app/admin/ask), on the
// member's own actions, which spend a question per answer.

const TOPICS = ["연애", "일", "돈", "사람", "기타"] as const;

// Starters for an empty box: a situation half written, so the guest tells what is going on, which is where a
// question beats a report.
const STARTERS: { topic: (typeof TOPICS)[number]; label: string; text: string }[] = [
  { topic: "일", label: "이직·제안", text: "요즘 이직(또는 새 제안)을 고민 중인데, " },
  { topic: "연애", label: "그 사람", text: "요즘 마음 가는 사람이 있는데, " },
  { topic: "돈", label: "돈 결정", text: "돈이 들어가는 결정을 앞두고 있는데, " },
  { topic: "사람", label: "관계 고민", text: "가까운 사람과 사이가 어긋나서, " },
];
const MAX = 300;

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
        {pending ? "방을 여는 중이에요…" : "내 사주로 사랑방 열기"}
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-7 shrink-0 text-[11px] font-bold text-ink-soft">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 rounded-full border px-3 py-1 text-[12.5px] ${on ? "border-ink bg-ink text-hanji" : "border-ink/15 bg-white/70 text-ink"}`}
    >
      {children}
    </button>
  );
}

export const draftKey = (room: string) => `jj_ask_draft:${room}`;

// The question box, fixed to the bottom of the room: a topic (one question = one topic), then up to 300 characters.
// It is there even with no questions left: the guest writes first, and sending then opens `children` (the packs to
// buy). What was written is kept in this browser (draftKey) until it is sent, so it waits through the payment.
// `people`: those on the room's list; the guest picks who the question is about (or no one).
export function AskForm({
  room,
  people = [],
  defaultWith,
  canAdd = true,
  credits,
  children,
}: {
  room: string;
  people?: { id: string; label: string }[];
  defaultWith?: string;
  canAdd?: boolean;
  credits: number;
  children?: React.ReactNode;
}) {
  const [withId, setWithId] = useState(defaultWith ?? "");
  // Folded to one line while reading; the choices open with the box.
  const [open, setOpen] = useState(false);
  const whoLabel = people.find((x) => x.id === withId)?.label ?? "나";
  const [state, action, pending] = useActionState<FormState, FormData>(askAction, { error: null });
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [needCredits, setNeedCredits] = useState(false);
  // A question written before (here, or before buying more): back in the box.
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey(room)) ?? "null") as { text?: string; topic?: string } | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage
      if (d?.text) setText(d.text);
      if (d?.topic) setTopic(d.topic);
    } catch {}
  }, [room]);
  const keep = (t: string, tp: string) => {
    try {
      if (t.trim()) localStorage.setItem(draftKey(room), JSON.stringify({ text: t, topic: tp }));
      else localStorage.removeItem(draftKey(room));
    } catch {}
  };
  const box = useRef<HTMLTextAreaElement>(null);
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
      {needCredits && (
        <section className="jjok-box mt-3 px-4 py-4">
          <p className="text-center font-myeongjo text-[15px] font-extrabold">질문을 채우시면 바로 보내 드려요</p>
          <p className="mt-1 text-center text-[12px] opacity-75">써 두신 질문은 그대로 남아 있어요</p>
          {children}
        </section>
      )}
      <form
        onSubmit={(e) => {
          if (credits < 1) {
            e.preventDefault();
            keep(text, topic);
            setNeedCredits(true);
            return;
          }
          const f = new FormData(e.currentTarget);
          setSent({ question: text.trim(), topic: String(f.get("topic") ?? "") });
          keepValues(action)(e);
          keep("", "");
          setText("");
          setTopic("");
          setOpen(false);
        }}
        className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-ink/10 bg-hanji/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <input type="hidden" name="room" value={room} />
        <input type="hidden" name="with" value={withId} />
        <input type="hidden" name="topic" value={topic} />
        {open ? (
          <div className="mb-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-ink-soft">여쭐 말씀</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-soft">
                접기 ▾
              </button>
            </div>
            <Row label="누구">
              {[{ id: "", label: "나" }, ...people].map((x) => (
                <Chip key={x.id || "me"} on={withId === x.id} onClick={() => setWithId(x.id)}>
                  {x.label}
                </Chip>
              ))}
              {canAdd && (
                <a href="#people" onClick={() => setOpen(false)} className="shrink-0 px-1.5 py-1 text-[12.5px] text-ink-soft underline">
                  ＋ 사람
                </a>
              )}
            </Row>
            <Row label="무엇">
              {TOPICS.map((t) => (
                <Chip
                  key={t}
                  on={topic === t}
                  onClick={() => {
                    setTopic(t);
                    keep(text, t);
                  }}
                >
                  {t}
                </Chip>
              ))}
            </Row>
            {!text && (
              <p className="flex gap-x-2.5 overflow-x-auto text-[12px] whitespace-nowrap text-seal [scrollbar-width:none]">
                <span className="shrink-0 text-ink-soft">이렇게 시작해 보세요</span>
                {STARTERS.map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => {
                      setText(st.text);
                      setTopic(st.topic);
                      keep(st.text, st.topic);
                      requestAnimationFrame(() => box.current?.focus());
                    }}
                    className="shrink-0 underline decoration-seal/30 underline-offset-2"
                  >
                    {st.label}
                  </button>
                ))}
              </p>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="mb-1.5 flex max-w-full items-center gap-1 text-[12px] text-ink-soft">
            <span className="truncate">
              <b className="text-ink">{whoLabel} 이야기</b> · {topic || "주제 고르기"}
            </span>
            <span aria-hidden>▴</span>
          </button>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={box}
            name="question"
            value={text}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX));
              keep(e.target.value.slice(0, MAX), topic);
            }}
            rows={open && text ? 3 : 1}
            maxLength={MAX}
            disabled={pending}
            aria-label="여쭐 말씀"
            placeholder="지금 상황도 한두 줄 적어 주시옵소서"
            className="min-h-11 flex-1 resize-none rounded-2xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] leading-snug disabled:opacity-60"
          />
          <button type="submit" disabled={pending || !text.trim()} className="h-11 shrink-0 rounded-2xl bg-seal px-4 text-sm font-extrabold text-hanji disabled:opacity-50">
            {pending ? "쓰는 중" : "여쭙기"}
          </button>
        </div>
        {open && text && (
          <p className="mt-1 text-right text-[11px] text-ink-soft">
            {[...text].length}/{MAX} · 무슨 일이 있는지, 언제까지 정해야 하는지 적어 주실수록 깊어져요
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

// A new person for the room's list, or (`person`) the birth of one on it entered again.
export function AttachOtherForm({ room, person }: { room: string; person?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(attachOtherAction, { error: null });
  return (
    <form onSubmit={keepValues(action)} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="room" value={room} />
      {person && <input type="hidden" name="person" value={person} />}
      {!person && (
        <fieldset className="flex flex-col gap-1.5 text-sm">
          <legend className="mb-1 font-semibold text-ink-soft">어떤 사이인가요</legend>
          <div className="flex flex-wrap gap-1.5">
            {RELS.map((r) => (
              <label key={r} className="cursor-pointer">
                <input type="radio" name="rel" value={r} required className="peer sr-only" />
                <span className="block rounded-full border border-ink/15 bg-white/70 px-3 py-1 text-[13px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji">
                  {REL_LABEL[r]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className={`flex flex-col gap-1 text-sm ${person ? "hidden" : ""}`}>
        <span className="font-semibold text-ink-soft">그 사람을 뭐라고 부를까요</span>
        <input name="label" placeholder="그 사람, 남자친구, 팀장님 …" maxLength={12} className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2" />
      </label>
      <PersonFields prefix="b_" nameLabel="상대 이름" unknownHour="모름" modern binaryGender genderLabel="상대 성별" />
      <ErrorLine error={state.error} />
      <button type="submit" disabled={pending} className="rounded-xl border-2 border-ink py-2.5 text-sm font-extrabold disabled:opacity-60">
        {pending ? "넣는 중…" : person ? "이 사람 사주 고치기" : "함께 보는 사람 더하기"}
      </button>
    </form>
  );
}

export function RemovePersonButton({ room, person, label }: { room: string; person: string; label: string }) {
  return (
    <form
      action={removePersonAction}
      onSubmit={(e) => {
        if (!confirm(`${label}을(를) 목록에서 지울까요? 나눈 이야기는 정 훈도가 기억해요.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="room" value={room} />
      <input type="hidden" name="person" value={person} />
      <button type="submit" className="shrink-0 rounded-lg border border-ink/20 px-2.5 py-1 text-[11.5px] text-ink-soft">
        지우기
      </button>
    </form>
  );
}
