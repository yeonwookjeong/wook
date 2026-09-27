"use client";

import { useActionState, useState } from "react";
import { gunghapAction, type FormState } from "@/app/actions";
import { RELATIONS } from "@/lib/relations";
import PersonFields from "./PersonFields";

const choice =
  "block rounded-xl border border-ink/15 bg-white/50 py-2.5 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji peer-focus-visible:ring-2 peer-focus-visible:ring-seal";

// Two people and how they know each other. The reader's own saved chart can stand in for the first.
export default function GunghapForm({ savedName }: { savedName: string | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(gunghapAction, { error: null });
  const [useSaved, setUseSaved] = useState(savedName !== null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-ink-soft">두 사람은 어떤 사이인가요?</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(RELATIONS).map(([value, label], i) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="rel" value={value} defaultChecked={i === 0} className="peer sr-only" />
              <span className={choice}>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

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

      <h3 className="mt-2 border-t border-seal/20 pt-4 font-myeongjo font-extrabold">상대</h3>
      <PersonFields prefix="b_" nameLabel="상대 이름" unknownHour="모름" genderLabel="성별 (선택)" modern />

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
        {pending ? "두 사주를 맞춰 보는 중이에요…" : "궁합 보기"}
      </button>
      <p className="text-center text-xs text-ink-soft">생년월일은 사주 계산에만 쓰고 저장하지 않아요. 상대의 사주는 본인에게 허락받고 넣어 주세요.</p>
    </form>
  );
}
