"use client";

import { useActionState } from "react";
import CopyButton from "@/components/CopyButton";
import PersonFields from "@/components/PersonFields";
import { keepValues } from "@/lib/keepForm";
import { giftIssueAction, type GiftState } from "./actions";

// The owner gives a report away: the friend's name and birth, the reports to open, and a link for each comes back
// to copy. What is typed stays after an answer, so one more report for the same friend is one more tap.
export default function GiftForm({ products, years, defaultYear }: { products: { id: string; title: string }[]; years: number[]; defaultYear: number }) {
  const [state, formAction, pending] = useActionState<GiftState, FormData>(giftIssueAction, { error: null });
  const message = state.links ? `${state.name}님, 정 훈도가 풀어 드린 보고서예요 🙇\n${state.links.map((l) => `${l.title}: ${l.url}`).join("\n")}` : "";
  return (
    <form onSubmit={keepValues(formAction)} className="mt-3 flex flex-col gap-3">
      <PersonFields nameLabel="친구 이름" unknownHour="모름" modern />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-ink-soft">열어 줄 보고서</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {products.map((p) => (
            <label key={p.id} className="cursor-pointer">
              <input type="checkbox" name="product" value={p.id} defaultChecked={p.id === "pyeongsaeng"} className="peer sr-only" />
              <span className="block rounded-xl border border-ink/15 bg-white/50 py-2.5 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji">
                {p.title}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-ink-soft">연운은</span>
        <select name="y" defaultValue={defaultYear} className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <span className="text-ink-soft">을 열어 줘요</span>
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded-xl bg-ink py-3 text-sm font-extrabold text-hanji disabled:opacity-60">
        {pending ? "만드는 중이에요…" : "선물 링크 만들기"}
      </button>
      {state.links && (
        <div className="rounded-xl border-2 border-jade/50 bg-jade/5 px-3 py-3">
          <p className="text-[13px] font-bold text-jade">{state.name}님 링크를 만들었어요</p>
          <ul className="mt-2 flex flex-col gap-2">
            {state.links.map((l) => (
              <li key={l.url} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px]">{l.title}</b>
                  <span className="block truncate text-[11px] text-ink-soft">{l.url}</span>
                </span>
                <CopyButton text={l.url} label="링크 복사" />
              </li>
            ))}
          </ul>
          <CopyButton text={message} label="보낼 메시지 통째로 복사" className="mt-3 w-full" />
        </div>
      )}
    </form>
  );
}
