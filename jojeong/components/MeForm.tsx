"use client";

import { useActionState } from "react";
import { saveMeAction, type FormState } from "@/app/actions";
import PersonFields from "./PersonFields";

// "내 사주" for the reports: entered once, remembered in this browser.
export default function MeForm({ next, submit = "내 사주로 보기" }: { next: string; submit?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveMeAction, { error: null });
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <PersonFields nameLabel="이름" unknownHour="모름" genderLabel="성별 (선택 · 10년 대운 풀이에 쓰여요)" />
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
        {pending ? "사주를 세우는 중이에요…" : submit}
      </button>
      <p className="text-center text-xs leading-relaxed text-ink-soft">
        생년월일은 사주 계산에만 쓰고 저장하지 않아요. 이 브라우저에 사주 글자만 기억해 두면 다른 보고서도 바로 열려요.
      </p>
    </form>
  );
}
