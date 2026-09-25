"use client";

import { useActionState } from "react";
import { appointMinisterAction, enthroneAction, joinCourtAction, type FormState } from "@/app/actions";
import { HOUR_SLOTS } from "@/lib/saju";

const CALENDARS = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
  { value: "lunar-leap", label: "음력 윤달" },
] as const;

const MODES = {
  king: { action: enthroneAction, nameLabel: "전하의 존함", submit: "즉위하기", unknownHour: "모르겠노라" },
  minister: { action: joinCourtAction, nameLabel: "그대의 이름", submit: "입궐하기", unknownHour: "모르겠사옵니다" },
  appoint: { action: appointMinisterAction, nameLabel: "등용할 신하의 이름", submit: "등용하기", unknownHour: "모르겠노라" },
};

export default function BirthForm({ mode, courtId }: { mode: keyof typeof MODES; courtId?: string }) {
  const { action, nameLabel, submit, unknownHour } = MODES[mode];
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {courtId && <input type="hidden" name="courtId" value={courtId} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">{nameLabel}</span>
        <input
          name="name"
          required
          maxLength={10}
          autoComplete="nickname"
          placeholder="이름 또는 별명 (10자 이내)"
          className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">생년월일</span>
        <input
          name="birth"
          required
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          placeholder="19950312"
          className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base tracking-widest outline-none focus:border-seal"
        />
      </label>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">달력</legend>
        {CALENDARS.map((c, i) => (
          <label key={c.value} className="cursor-pointer">
            <input type="radio" name="calendar" value={c.value} defaultChecked={i === 0} className="peer sr-only" />
            <span className="block rounded-xl border border-ink/15 bg-white/50 py-2.5 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji peer-focus-visible:ring-2 peer-focus-visible:ring-seal">
              {c.label}
            </span>
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">태어난 시간 (선택)</span>
        <select
          name="hour"
          defaultValue=""
          className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal"
        >
          <option value="">{unknownHour}</option>
          {HOUR_SLOTS.map((slot, i) => (
            <option key={slot} value={i}>
              {slot}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-seal/10 px-4 py-3 text-sm text-seal">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-2xl bg-seal py-4 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14] transition active:translate-y-1 active:shadow-[0_2px_0_#7d1a14] disabled:opacity-60"
      >
        {pending ? "잠시만 기다리시옵소서…" : submit}
      </button>
      <p className="text-center text-xs text-ink-soft">
        {mode === "appoint" && "본인에게 허락받고 입력하시옵소서. "}생년월일은 사주 계산에만 쓰고 저장하지 않사옵니다.
      </p>
    </form>
  );
}
