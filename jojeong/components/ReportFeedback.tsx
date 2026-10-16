import type { ReactNode } from "react";
import { feedbackAction } from "@/app/reports/actions";
import { FEEDBACK_MAX, getFeedback } from "@/lib/feedback";

// Under a bought report: was it worth it? A thumb (the line and the review tick are optional), then a thank-you
// that can be changed.
export default async function ReportFeedback({ order, product }: { order: string; product: string }) {
  const given = await getFeedback(order, product);
  const fields = (
    <>
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="product" value={product} />
    </>
  );
  if (given)
    return (
      <details className="mt-4 rounded-2xl border border-seal/15 bg-white/40 px-4 py-3 text-center text-[13px]">
        <summary className="cursor-pointer list-none">
          {given.up ? "👍" : "👎"} 남겨 주셔서 고맙습니다. 보고서를 다듬는 데 꼭 쓸게요. <span className="text-[11.5px] text-ink-soft underline">고치기</span>
        </summary>
        <Form fields={fields} text={given.text} share={given.share} />
      </details>
    );
  return (
    <section className="mt-4 rounded-2xl border border-seal/15 bg-white/40 px-4 py-4 text-center">
      <p className="font-myeongjo text-[16px] font-extrabold">이 보고서, 어떠셨어요?</p>
      <p className="mt-1 text-[12.5px] text-ink-soft">한 번만 눌러 주셔도 다음 보고서가 더 좋아져요.</p>
      <Form fields={fields} />
    </section>
  );
}

function Form({ fields, text = "", share = false }: { fields: ReactNode; text?: string; share?: boolean }) {
  return (
    <form action={feedbackAction} className="mt-3 text-left">
      {fields}
      <textarea
        name="text"
        defaultValue={text}
        maxLength={FEEDBACK_MAX}
        rows={2}
        placeholder="한 줄 남기기 (선택) · 맞았던 것, 아쉬웠던 것"
        className="w-full rounded-xl border border-ink/15 bg-white/70 px-3 py-2 text-[13px]"
      />
      <label className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
        <input type="checkbox" name="share" value="1" defaultChecked={share} />
        이름 없이 후기로 소개해도 괜찮아요 (선택)
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button name="up" value="1" className="rounded-xl bg-ink py-2.5 text-[14px] font-bold text-hanji">
          👍 좋았어요
        </button>
        <button name="up" value="0" className="rounded-xl border border-ink/25 py-2.5 text-[14px] font-bold">
          👎 아쉬워요
        </button>
      </div>
    </form>
  );
}
