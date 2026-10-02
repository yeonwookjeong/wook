"use client";

import { useActionState, useState } from "react";
import { taekilAction, type FormState } from "@/app/actions";
import { keepValues } from "@/lib/keepForm";
import { KINDS, OFFERED, SPANS, type Kind } from "@/lib/taekilKinds";
import PersonFields from "./PersonFields";

const choice =
  "block rounded-full border border-ink/15 bg-white/50 px-3.5 py-2 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji peer-focus-visible:ring-2 peer-focus-visible:ring-seal";
const select = "w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal";

// What for, from which month, for how long, and whose chart; a wedding or a betrothal also asks for the partner.
// `initial` picks the purpose for a link that names one (/reports/taekil?kind=move, from the almanac).
export default function TaekilForm({ savedName, months, initial = "wedding" }: { savedName: string | null; months: { value: string; label: string }[]; initial?: Kind }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(taekilAction, { error: null });
  const [kind, setKind] = useState<Kind>(initial);
  const [useSaved, setUseSaved] = useState(savedName !== null);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-ink-soft">무엇을 할 날인가요?</legend>
        <div className="flex flex-wrap gap-2">
          {OFFERED.map((k) => (
            <label key={k} className="cursor-pointer">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="peer sr-only" />
              <span className={choice}>{KINDS[k].label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-soft">언제부터</span>
          <select name="from" defaultValue={months[1]?.value ?? months[0].value} className={select}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-soft">기간</span>
          <select name="n" defaultValue="3" className={select}>
            {SPANS.map((n) => (
              <option key={n} value={n}>
                {n}개월
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="mt-2 border-t border-seal/20 pt-4 font-myeongjo font-extrabold">나</h3>
      {savedName !== null && (
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer">
            <input type="radio" name="a_use" value="saved" checked={useSaved} onChange={() => setUseSaved(true)} className="peer sr-only" />
            <span className={choice}>{savedName} (내 사주)</span>
          </label>
          <label className="cursor-pointer">
            <input type="radio" name="a_use" value="typed" checked={!useSaved} onChange={() => setUseSaved(false)} className="peer sr-only" />
            <span className={choice}>직접 입력</span>
          </label>
        </div>
      )}
      {!useSaved && <PersonFields prefix="a_" nameLabel="내 이름" unknownHour="모름" genderLabel="성별 (선택)" modern />}

      {KINDS[kind].people === 2 && (
        <>
          <h3 className="mt-2 border-t border-seal/20 pt-4 font-myeongjo font-extrabold">{kind === "wedding" ? "결혼할 상대" : "함께하는 사람 (예비 배우자)"}</h3>
          <PersonFields prefix="b_" nameLabel="상대 이름" unknownHour="모름" genderLabel="성별 (선택)" modern />
        </>
      )}

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
        {pending ? "책력을 넘기는 중이에요…" : "좋은 날 받기"}
      </button>
      <p className="text-center text-xs text-ink-soft">생년월일은 사주 계산에만 쓰고 저장하지 않아요.</p>
    </form>
  );
}
