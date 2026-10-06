"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { saveMeAction, type FormState } from "@/app/actions";
import PersonFields from "./PersonFields";
import { keepValues } from "@/lib/keepForm";

// After the chart is saved, the report replaces the form at the same address, and the browser keeps the scroll
// position the form was at: somewhere down a page that just became a long result, so a first-time visitor lands
// mid-page and wonders whether it worked. Back to the top of the result then, unless the answer was an error
// (stay at the form) or the form points at an anchor (the home page's #today).
const SCROLL_KEY = "jj_scroll_top";
const toTop = () => {
  try {
    if (sessionStorage.getItem(SCROLL_KEY) !== "1") return;
    sessionStorage.removeItem(SCROLL_KEY);
    window.scrollTo({ top: 0 });
  } catch {}
};

// "내 사주" for the reports: entered once, remembered in this browser.
export default function MeForm({ next, submit = "내 사주로 보기", defaultName }: { next: string; submit?: string; defaultName?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveMeAction, { error: null });
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state.error) {
        try {
          sessionStorage.removeItem(SCROLL_KEY);
        } catch {}
      } else setTimeout(toTop, 80);
    }
    wasPending.current = pending;
  }, [pending, state.error]);
  // The form is gone once the result replaces it.
  useEffect(() => () => void setTimeout(toTop, 80), []);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    try {
      if (!next.startsWith("/#")) sessionStorage.setItem(SCROLL_KEY, "1");
    } catch {}
    keepValues(formAction)(e);
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <PersonFields nameLabel="이름" unknownHour="모름" modern defaultName={defaultName} />
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
