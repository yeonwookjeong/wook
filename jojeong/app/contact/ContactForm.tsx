"use client";

import { useActionState, useState } from "react";
import { sendInquiryAction, type InquiryState } from "./actions";
import { INQUIRY_TOPICS } from "./topics";

const field = "w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal";

// Write and send right here: no mail app needed (many open the site inside Instagram, where mailto does
// nothing). Choosing a topic fills in the lines that help the answer.
export default function ContactForm() {
  const [state, action, pending] = useActionState<InquiryState, FormData>(sendInquiryAction, { status: "idle", message: null });
  const [topic, setTopic] = useState<string>(INQUIRY_TOPICS[0].key);
  const [body, setBody] = useState<string>(INQUIRY_TOPICS[0].body.join("\n") + "\n");

  if (state.status === "sent")
    return (
      <div className="rounded-2xl bg-gold/10 px-4 py-5 text-center">
        <p className="font-myeongjo text-lg font-extrabold">문의를 받았어요</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">영업일 1~2일 안에 확인할게요. 이메일을 남기셨다면 그 주소로 답장을 드려요.</p>
      </div>
    );

  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink-soft">무엇에 대한 문의인가요?</legend>
        {INQUIRY_TOPICS.map((t) => (
          <label key={t.key} className="cursor-pointer">
            <input
              type="radio"
              name="topic"
              value={t.key}
              checked={topic === t.key}
              onChange={() => {
                setTopic(t.key);
                setBody(t.body.join("\n") + "\n");
              }}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-ink/15 bg-white/50 px-3.5 py-2 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji">
              {t.key}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-ink-soft">{INQUIRY_TOPICS.find((t) => t.key === topic)?.desc}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">내용</span>
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={2000} required className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">답장받을 이메일 (선택)</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" maxLength={100} placeholder="답장이 필요하면 적어 주세요" className={field} />
      </label>
      {/* Bots fill every field; people never see this one. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state.status === "error" && (
        <p role="alert" className="rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
          {state.message}
        </p>
      )}
      <button disabled={pending} className="rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji disabled:opacity-60">
        {pending ? "보내는 중…" : "문의 보내기"}
      </button>
      <p className="text-[11px] leading-relaxed text-ink-soft">
        적어 주신 내용과 이메일은 답변에만 쓰고, 지워 달라고 하시면 바로 지워요. 생년월일 같은 개인정보는 적지 않아도 돼요.
      </p>
    </form>
  );
}
