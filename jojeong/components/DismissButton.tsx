"use client";

import { useFormStatus } from "react-dom";
import { dismissMinisterAction } from "@/app/actions";
import { josa } from "@/lib/josa";

function Submit({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${name} 파직하기`}
      onClick={(e) => {
        if (!confirm(`${josa(name, "을/를")} 파직하여 조정에서 내보내시겠사옵니까?`)) e.preventDefault();
      }}
      className="h-full shrink-0 rounded-2xl border border-seal/30 px-3 font-myeongjo text-sm font-extrabold text-seal disabled:opacity-50"
    >
      {pending ? "…" : "파직"}
    </button>
  );
}

export default function DismissButton({ courtId, ministerId, name }: { courtId: string; ministerId: string; name: string }) {
  return (
    <form action={dismissMinisterAction} className="flex">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="ministerId" value={ministerId} />
      <Submit name={name} />
    </form>
  );
}
