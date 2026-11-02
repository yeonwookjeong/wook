import Link from "next/link";
import { feedbackAction } from "@/app/reports/actions";
import FeedbackText from "@/components/FeedbackText";
import { REWARD_MIN, rewardLength, shownFeedback } from "@/lib/feedback";
import { currentMemberId } from "@/lib/members";

// Under a bought report (2026-10-28 대표님): only what was liked is asked, and a line of REWARD_MIN letters or more
// brings one question for 정 훈도. No 👎 and no word of complaint here: a buyer who was let down writes to 문의하기.
export default async function ReportFeedback({ order, product }: { order: string; product: string }) {
  const [given, member] = await Promise.all([shownFeedback(order, product), currentMemberId()]);
  const back = `/reports/${product}?order=${order}`;
  const fields = (
    <>
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="product" value={product} />
      <input type="hidden" name="up" value="1" />
    </>
  );

  if (given && (given.rewarded || rewardLength(given.text) < REWARD_MIN))
    return (
      <section className="mt-4 rounded-2xl border border-seal/15 bg-white/40 px-4 py-4 text-center text-[13.5px]">
        <p className="font-myeongjo text-[16px] font-extrabold">고맙습니다</p>
        <p className="mt-1.5 leading-relaxed">
          남겨 주신 말, 다음 보고서를 쓸 때 꼭 볼게요.
          {given.rewarded && (
            <>
              <br />
              <b className="text-seal">질문권 1개</b>가 들어갔어요.
            </>
          )}
        </p>
        {given.rewarded && (
          <Link href="/ask" className="mt-3 block rounded-xl bg-ink py-2.5 text-[14px] font-bold text-hanji">
            정 훈도에게 바로 묻기 →
          </Link>
        )}
      </section>
    );

  // Written long enough but not yet rewarded: the buyer was not signed in. Signing in and pressing again gives it.
  if (given)
    return (
      <section className="mt-4 rounded-2xl border border-seal/15 bg-white/40 px-4 py-4 text-center text-[13.5px]">
        <p className="font-myeongjo text-[16px] font-extrabold">고맙습니다</p>
        <p className="mt-1.5 leading-relaxed">남겨 주신 말, 다음 보고서를 쓸 때 꼭 볼게요.</p>
        {member ? (
          <form action={feedbackAction} className="mt-3">
            {fields}
            <input type="hidden" name="text" value={given.text} />
            {given.share && <input type="hidden" name="share" value="1" />}
            <button className="w-full rounded-xl bg-seal py-2.5 text-[14px] font-bold text-hanji">질문권 1개 받기</button>
          </form>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(back)}`} className="mt-3 block rounded-xl bg-seal py-2.5 text-[14px] font-bold text-hanji">
            카카오로 들어오면 질문권 1개를 넣어 드려요
          </Link>
        )}
      </section>
    );

  return (
    <section className="mt-4 rounded-2xl border border-seal/15 bg-white/40 px-4 py-4 text-center">
      <p className="font-myeongjo text-[17px] font-extrabold">이 보고서, 마음에 드셨나요?</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
        정 훈도는 남겨 주신 말로 계속 공부하고 있어요.
        <br />
        어떤 점이 좋았는지 <b className="text-ink">{REWARD_MIN}자 이상</b> 알려 주시면
      </p>
      <p className="mt-2">
        <span className="inline-block rounded-full bg-seal px-3 py-1 text-[12px] font-bold text-hanji">정 훈도 질문권 1개 드려요</span>
      </p>
      <form action={feedbackAction} className="mt-3 text-left">
        {fields}
        <FeedbackText min={REWARD_MIN} />
        <label className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-ink-soft">
          <input type="checkbox" name="share" value="1" className="mt-0.5" />
          이름 없이 후기로 소개해도 괜찮아요 (질문권을 받고 남긴 후기로 표시돼요)
        </label>
        <button className="mt-3 w-full rounded-xl bg-ink py-3 text-[14px] font-bold text-hanji">👍 남기고 질문권 받기</button>
        {!member && <p className="mt-2 text-center text-[11.5px] text-ink-soft">질문권은 카카오로 들어온 분께 넣어 드려요. 남긴 뒤 들어오셔도 돼요.</p>}
      </form>
    </section>
  );
}
