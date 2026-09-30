"use client";

import { useFormStatus } from "react-dom";
import { forgetCourtAction } from "@/app/actions";

function Submit({ kingName }: { kingName: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${kingName} 전하의 조정을 이 기기 목록에서 지우기`}
      onClick={(e) => {
        if (
          !confirm(
            `${kingName} 전하의 조정을 이 기기 목록에서 지우시겠사옵니까?\n조정은 친구들의 링크로 그대로 남지만, 이 기기에서는 더 이상 왕으로 들어갈 수 없사옵니다.`,
          )
        )
          e.preventDefault();
      }}
      className="shrink-0 px-1 text-[12px] font-bold text-ink-soft underline disabled:opacity-50"
    >
      {pending ? "…" : "지우기"}
    </button>
  );
}

// Takes one court off "이 기기에서 즉위하신 조정" (the owner cookie only; the court itself stays).
export default function ForgetCourtButton({ courtId, kingName }: { courtId: string; kingName: string }) {
  return (
    <form action={forgetCourtAction} className="flex">
      <input type="hidden" name="courtId" value={courtId} />
      <Submit kingName={kingName} />
    </form>
  );
}
