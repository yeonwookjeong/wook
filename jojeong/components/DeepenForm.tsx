"use client";

import { useActionState } from "react";
import { deepenAction, type FormState } from "@/app/actions";
import BirthTimeFields from "./BirthTimeFields";

const field = "rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal";
const chip =
  "block rounded-xl border border-ink/15 bg-white/50 py-2.5 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji peer-focus-visible:ring-2 peer-focus-visible:ring-seal";

// Asks once more for the birth date (checked against the stored chart) plus gender and hour, to add the
// ten-year luck and the finer reading of each area. The date is used for the calculation and not kept.
export default function DeepenForm({ courtId, who }: { courtId: string; who: string; needs?: { daeun: boolean; palaces: boolean } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deepenAction, { error: null });
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="who" value={who} />
      <input name="birth" required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} placeholder="생년월일 8자리 (19950312)" className={`${field} tracking-widest`} />
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">달력</legend>
        {[
          ["solar", "양력"],
          ["lunar", "음력"],
          ["lunar-leap", "음력 윤달"],
        ].map(([v, l], i) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="calendar" value={v} defaultChecked={i === 0} className="peer sr-only" />
            <span className={chip}>{l}</span>
          </label>
        ))}
      </fieldset>
      <BirthTimeFields unknownLabel="모름" />
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">성별</legend>
        {[
          ["m", "남"],
          ["f", "여"],
          ["", "밝히지 않음"],
        ].map(([v, l]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="gender" value={v} defaultChecked={v === ""} className="peer sr-only" />
            <span className={chip}>{l}</span>
          </label>
        ))}
      </fieldset>
      {state.error && (
        <p role="alert" className="rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji disabled:opacity-60">
        {pending ? "살펴보는 중이옵니다…" : "더 깊이 보기"}
      </button>
      <p className="text-center text-[11px] text-ink-soft">처음 올리신 사주와 같은지 확인한 뒤, 계산에만 쓰고 생년월일은 저장하지 않사옵니다.</p>
    </form>
  );
}
