"use client";

import { useActionState } from "react";
import { adminSignIn } from "./actions";

export default function SignInForm() {
  const [state, action, pending] = useActionState(adminSignIn, { error: null });
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="관리자 비밀번호"
        className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal"
      />
      {state.error && <p className="text-sm text-seal">{state.error}</p>}
      <button disabled={pending} className="rounded-2xl bg-seal py-3.5 font-myeongjo font-extrabold text-hanji disabled:opacity-60">
        로그인
      </button>
    </form>
  );
}
